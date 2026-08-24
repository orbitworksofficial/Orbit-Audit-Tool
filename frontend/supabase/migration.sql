-- ============================================================================
-- OrbitScanner — auth + scan quota
-- Run in the Supabase SQL Editor AFTER the existing supabase_schema.sql
-- (which creates public.audit_reports).
--
-- This migration is additive. It does not alter audit_reports' columns, so
-- the Python service keeps writing exactly as it does today.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profiles — one row per authenticated user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    full_name   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    -- Free scans granted. Kept on the row (not a constant) so support can
    -- top up an individual account without a redeploy.
    scan_limit  INTEGER DEFAULT 3,
    scans_used  INTEGER DEFAULT 0
);

-- Auto-create a profile whenever someone signs up.
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

-- ---------------------------------------------------------------------------
-- 2. Link audit reports to their owner
--    Nullable: the Python service writes rows without a user_id, and
--    anonymous scans stay valid. Next.js backfills it after the scan.
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_reports
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS audit_reports_user_id_idx
    ON public.audit_reports(user_id);
CREATE INDEX IF NOT EXISTS audit_reports_created_at_idx
    ON public.audit_reports(created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Deliberately NO update policy for regular users: scans_used and scan_limit
-- must only ever be changed by the service-role key from a route handler.
-- Otherwise a user could reset their own quota from the browser.

ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own reports read" ON public.audit_reports;
CREATE POLICY "own reports read" ON public.audit_reports
    FOR SELECT USING (auth.uid() = user_id);

-- NOTE: the Python service uses SUPABASE_KEY. If that is the anon key, its
-- inserts will now be blocked by RLS. Either:
--   (a) point the Python service at the service-role key (recommended), or
--   (b) add an insert policy for the anon role.
-- Option (a) is safer — the Python service is server-side only.

-- ---------------------------------------------------------------------------
-- 4. Atomic quota consumption
--    Increments only when quota remains, and returns whether it succeeded.
--    Done in one statement so two concurrent scans cannot both slip through.
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
