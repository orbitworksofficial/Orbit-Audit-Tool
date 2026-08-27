import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Admin authorisation.
 *
 * Admin status lives in profiles.is_admin and is checked with the service-role
 * key, so a user cannot grant it to themselves — there is deliberately no RLS
 * update policy on profiles.
 */

export interface AdminUser {
  id: string;
  email: string;
}

/** Returns the signed-in admin, or null if not signed in / not an admin. */
export async function requireAdmin(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('profiles')
      .select('is_admin, is_active')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin || data.is_active === false) return null;
    return { id: user.id, email: user.email ?? '' };
  } catch {
    return null;
  }
}

/** Records an admin action, so changes are attributable after the fact. */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetUser: string | null,
  detail: Record<string, unknown> = {}
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('admin_actions').insert({
      admin_id: adminId,
      action,
      target_user: targetUser,
      detail,
    });
  } catch (e) {
    console.error('Could not log admin action:', e);
  }
}

/** Reads a global setting, falling back when the row is missing. */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();
    return (data?.value as T) ?? fallback;
  } catch {
    return fallback;
  }
}
