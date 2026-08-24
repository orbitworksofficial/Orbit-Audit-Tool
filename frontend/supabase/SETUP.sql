-- ============================================================================
-- OrbitScanner — COMPLETE DATABASE SETUP
--
-- Paste this whole file into: Supabase Dashboard > SQL Editor > New query
-- then press RUN. Safe to run more than once.
--
-- Combines the Python project's supabase_schema.sql with the Next.js
-- auth + quota migration, in the correct order.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Audit reports (written by the Python service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_reports (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    full_name            TEXT,
    email                TEXT,
    whatsapp             TEXT,
    business_name        TEXT,
    website_url          TEXT,
    city                 TEXT,
    country              TEXT,
    aeo_geo_score        INTEGER DEFAULT 0,
    website_health_score INTEGER DEFAULT 0,
    seo_score            INTEGER DEFAULT 0,
    reputation_score     INTEGER DEFAULT 0,
    competitor_score     INTEGER DEFAULT 0,
    social_score         INTEGER DEFAULT 0,
    overall_score        INTEGER DEFAULT 0,
    ai_insights          JSONB,
    raw_data             JSONB
);


-- ---------------------------------------------------------------------------
-- 2. Profiles — one row per authenticated user, holds the scan quota
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    full_name   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    scan_limit  INTEGER DEFAULT 3,
    scans_used  INTEGER DEFAULT 0
);

-- Auto-create a profile on signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for anyone who signed up before this ran.
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data ->> 'full_name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 3. Link reports to their owner
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_reports
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Anonymous scans are free, so abuse is limited by IP + email over 24h.
ALTER TABLE public.audit_reports
    ADD COLUMN IF NOT EXISTS client_ip TEXT;

CREATE INDEX IF NOT EXISTS audit_reports_user_id_idx    ON public.audit_reports(user_id);
CREATE INDEX IF NOT EXISTS audit_reports_created_at_idx ON public.audit_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_reports_email_idx      ON public.audit_reports(email, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_reports_client_ip_idx  ON public.audit_reports(client_ip, created_at DESC);


-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- No UPDATE policy on purpose: scans_used / scan_limit must only be changed
-- by the service-role key from a server route, never from the browser.

ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own reports read" ON public.audit_reports;
CREATE POLICY "own reports read" ON public.audit_reports
    FOR SELECT USING (auth.uid() = user_id);

-- IMPORTANT: with RLS on, the Python service must use the SERVICE ROLE key.
-- Set SUPABASE_KEY in the Python .env to the service_role key, or its inserts
-- will fail silently and you will lose reports.


-- ---------------------------------------------------------------------------
-- 5. Atomic quota consumption
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_scan_credit(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, scans_used INTEGER, scan_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_used  INTEGER;
    v_limit INTEGER;
BEGIN
    UPDATE public.profiles p
       SET scans_used = p.scans_used + 1
     WHERE p.id = p_user_id
       AND p.scans_used < p.scan_limit
    RETURNING p.scans_used, p.scan_limit INTO v_used, v_limit;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, v_used, v_limit;
    ELSE
        SELECT p.scans_used, p.scan_limit INTO v_used, v_limit
          FROM public.profiles p WHERE p.id = p_user_id;
        RETURN QUERY SELECT FALSE, COALESCE(v_used, 0), COALESCE(v_limit, 0);
    END IF;
END;
$$;


-- ---------------------------------------------------------------------------
-- Done. Verify:
-- ---------------------------------------------------------------------------
SELECT
    (SELECT COUNT(*) FROM public.audit_reports) AS reports,
    (SELECT COUNT(*) FROM public.profiles)      AS profiles;
