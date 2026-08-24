import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client. Bypasses RLS, so it must ONLY ever be imported from
 * server-side route handlers — never from a client component.
 * Used for scan-quota accounting, which the user must not be able to edit.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
