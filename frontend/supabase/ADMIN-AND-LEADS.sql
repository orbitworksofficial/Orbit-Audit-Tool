-- ============================================================================
-- OrbitScanner — leads, admin, and scan-quota controls
--
-- Run in the Supabase SQL Editor AFTER SETUP.sql.
-- Additive only: nothing here alters what the Python service already writes.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Leads — every scan submission, guest or signed in
--
--    audit_reports holds results. This holds the *person*, captured the moment
--    they submit the form, so a lead survives even if the scan later fails.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at    TIMESTAMPTZ DEFAULT NOW(),

    -- What they typed into the scan form
    full_name     TEXT,
    email         TEXT,
    business_name TEXT,
    website_url   TEXT,
    city          TEXT,
    country       TEXT,
    whatsapp      TEXT,

    -- Who they were at the time
    user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_guest      BOOLEAN DEFAULT TRUE,

    -- How we recognise them again
    client_ip     TEXT,
    fingerprint   TEXT,
    user_agent    TEXT,

    -- Outcome
    report_id     UUID REFERENCES public.audit_reports(id) ON DELETE SET NULL,
    scan_status   TEXT DEFAULT 'pending',   -- pending | success | failed
    error_message TEXT,

    -- Sales workflow
    contacted     BOOLEAN DEFAULT FALSE,
    notes         TEXT
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx  ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_email_idx       ON public.leads(email);
CREATE INDEX IF NOT EXISTS leads_fingerprint_idx ON public.leads(fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_client_ip_idx   ON public.leads(client_ip, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_user_id_idx     ON public.leads(user_id);


-- ---------------------------------------------------------------------------
-- 2. Profiles — admin flag, account status, gifted scans
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_admin      BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_active     BOOLEAN DEFAULT TRUE,
    -- Extra scans an admin has granted, on top of scan_limit.
    ADD COLUMN IF NOT EXISTS bonus_scans   INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_seen_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deactivated_reason TEXT;

-- Signing up grants 2 scans. The guest scan is tracked separately, by
-- fingerprint, so the two cannot be double-claimed.
ALTER TABLE public.profiles ALTER COLUMN scan_limit SET DEFAULT 2;


-- ---------------------------------------------------------------------------
-- 3. Guest scan tracking — one free scan per device/IP, no account
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_scans (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    fingerprint TEXT NOT NULL,
    client_ip   TEXT,
    email       TEXT,
    scan_count  INTEGER DEFAULT 1,
    UNIQUE (fingerprint)
);

CREATE INDEX IF NOT EXISTS guest_scans_ip_idx ON public.guest_scans(client_ip);


-- ---------------------------------------------------------------------------
-- 4. Global settings — the master switch for free scans
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.app_settings (key, value) VALUES
    ('free_scans_enabled',   'true'::jsonb),
    ('guest_scans_enabled',  'true'::jsonb),
    ('guest_scan_limit',     '1'::jsonb),
    ('member_scan_limit',    '2'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 5. Admin audit log — who changed what
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    admin_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    target_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    detail      JSONB
);

CREATE INDEX IF NOT EXISTS admin_actions_created_idx ON public.admin_actions(created_at DESC);


-- ---------------------------------------------------------------------------
-- 6. Row Level Security
--
--    Every table here is written by route handlers using the service-role key,
--    which bypasses RLS. These policies exist so that if the anon key ever
--    reaches a table, it can still only read what it should.
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_scans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- No policies on leads, guest_scans or admin_actions: server-side only.

DROP POLICY IF EXISTS "settings readable" ON public.app_settings;
CREATE POLICY "settings readable" ON public.app_settings
    FOR SELECT USING (TRUE);


-- ---------------------------------------------------------------------------
-- 7. Quota consumption, replacing the simpler version in SETUP.sql
--
--    Counts bonus_scans, refuses deactivated accounts, and honours the global
--    kill switch. One statement so two concurrent scans cannot both pass.
-- ---------------------------------------------------------------------------
-- CREATE OR REPLACE cannot change a function's return type, and the version
-- in SETUP.sql returns one column fewer. Drop it first.
DROP FUNCTION IF EXISTS public.consume_scan_credit(UUID);

CREATE FUNCTION public.consume_scan_credit(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, scans_used INTEGER, scan_limit INTEGER, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_used    INTEGER;
    v_limit   INTEGER;
    v_bonus   INTEGER;
    v_active  BOOLEAN;
    v_enabled BOOLEAN;
BEGIN
    SELECT (value)::boolean INTO v_enabled
      FROM public.app_settings WHERE key = 'free_scans_enabled';

    IF COALESCE(v_enabled, TRUE) = FALSE THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Free scans are temporarily disabled.';
        RETURN;
    END IF;

    SELECT p.scans_used, p.scan_limit, p.bonus_scans, p.is_active
      INTO v_used, v_limit, v_bonus, v_active
      FROM public.profiles p WHERE p.id = p_user_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Account not found.';
        RETURN;
    END IF;

    IF v_active = FALSE THEN
        RETURN QUERY SELECT FALSE, v_used, v_limit, 'This account has been deactivated.';
        RETURN;
    END IF;

    UPDATE public.profiles p
       SET scans_used = p.scans_used + 1
     WHERE p.id = p_user_id
       AND p.scans_used < (p.scan_limit + p.bonus_scans)
    RETURNING p.scans_used, p.scan_limit INTO v_used, v_limit;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, v_used, v_limit, NULL::TEXT;
    ELSE
        RETURN QUERY SELECT FALSE, v_used, v_limit,
            format('You have used all %s scans.', v_limit + COALESCE(v_bonus, 0));
    END IF;
END;
$$;


-- ---------------------------------------------------------------------------
-- 8. Guest scan consumption — one per fingerprint
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.consume_guest_scan(TEXT, TEXT, TEXT);

CREATE FUNCTION public.consume_guest_scan(
    p_fingerprint TEXT,
    p_client_ip   TEXT,
    p_email       TEXT
)
RETURNS TABLE (allowed BOOLEAN, used INTEGER, guest_limit INTEGER, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limit    INTEGER;
    v_enabled  BOOLEAN;
    v_guests   BOOLEAN;
    v_count    INTEGER;
    v_ip_count INTEGER;
BEGIN
    SELECT (value)::boolean INTO v_enabled
      FROM public.app_settings WHERE key = 'free_scans_enabled';
    IF COALESCE(v_enabled, TRUE) = FALSE THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Free scans are temporarily disabled.';
        RETURN;
    END IF;

    SELECT (value)::boolean INTO v_guests
      FROM public.app_settings WHERE key = 'guest_scans_enabled';
    IF COALESCE(v_guests, TRUE) = FALSE THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Sign up for a free account to run a scan.';
        RETURN;
    END IF;

    SELECT (value)::int INTO v_limit
      FROM public.app_settings WHERE key = 'guest_scan_limit';
    v_limit := COALESCE(v_limit, 1);

    -- A shared office or mobile network puts many people behind one IP, so the
    -- IP cap is deliberately loose; the fingerprint is the real check.
    SELECT COALESCE(SUM(scan_count), 0) INTO v_ip_count
      FROM public.guest_scans
     WHERE client_ip = p_client_ip
       AND created_at > NOW() - INTERVAL '24 hours';

    IF v_ip_count >= 10 THEN
        RETURN QUERY SELECT FALSE, v_ip_count, v_limit,
            'Too many scans from this network today. Please try again tomorrow.';
        RETURN;
    END IF;

    INSERT INTO public.guest_scans (fingerprint, client_ip, email, scan_count)
    VALUES (p_fingerprint, p_client_ip, p_email, 1)
    ON CONFLICT (fingerprint) DO UPDATE
        SET scan_count = public.guest_scans.scan_count + 1
    RETURNING scan_count INTO v_count;

    IF v_count <= v_limit THEN
        RETURN QUERY SELECT TRUE, v_count, v_limit, NULL::TEXT;
    ELSE
        -- Roll the increment back so the count reflects reality.
        UPDATE public.guest_scans
           SET scan_count = scan_count - 1
         WHERE fingerprint = p_fingerprint;
        RETURN QUERY SELECT FALSE, v_count - 1, v_limit,
            'You have used your free scan. Create a free account for 2 more.';
    END IF;
END;
$$;


-- ---------------------------------------------------------------------------
-- 9. Make yourself an admin
--
--    EDIT THE EMAIL BELOW, then run this file.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_email TEXT := 'kashifdeveloper9053@gmail.com';   -- <== CHANGE THIS
    v_id    UUID;
BEGIN
    SELECT id INTO v_id FROM auth.users WHERE email = v_email;

    IF v_id IS NULL THEN
        RAISE NOTICE 'No account found for %. Sign up first, then re-run this block.', v_email;
    ELSE
        INSERT INTO public.profiles (id, email, is_admin, is_active, scan_limit)
        VALUES (v_id, v_email, TRUE, TRUE, 9999)
        ON CONFLICT (id) DO UPDATE
            SET is_admin = TRUE, is_active = TRUE, scan_limit = 9999;
        RAISE NOTICE 'Admin granted to %', v_email;
    END IF;
END $$;


-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
SELECT
    (SELECT COUNT(*) FROM public.leads)        AS leads,
    (SELECT COUNT(*) FROM public.guest_scans)  AS guest_scans,
    (SELECT COUNT(*) FROM public.app_settings) AS settings,
    (SELECT COUNT(*) FROM public.profiles WHERE is_admin) AS admins;
