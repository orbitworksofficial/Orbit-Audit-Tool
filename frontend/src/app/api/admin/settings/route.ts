import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, logAdminAction } from '@/lib/admin';

/** Keys an admin is allowed to change, and how each value is validated. */
const ALLOWED: Record<string, (v: unknown) => boolean> = {
  free_scans_enabled: (v) => typeof v === 'boolean',
  guest_scans_enabled: (v) => typeof v === 'boolean',
  guest_scan_limit: (v) => typeof v === 'number' && v >= 0 && v <= 10,
  member_scan_limit: (v) => typeof v === 'number' && v >= 0 && v <= 100,
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const db = createAdminClient();
  const { data, error } = await db.from('app_settings').select('key, value');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) settings[row.key] = row.value;

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const key: string | undefined = body?.key;
  const value = body?.value;

  if (!key || !(key in ALLOWED)) {
    return NextResponse.json({ error: 'Unknown setting' }, { status: 400 });
  }
  if (!ALLOWED[key](value)) {
    return NextResponse.json(
      { error: `Invalid value for ${key}` },
      { status: 400 }
    );
  }

  const db = createAdminClient();
  const { error } = await db
    .from('app_settings')
    .upsert(
      { key, value, updated_at: new Date().toISOString(), updated_by: admin.id },
      { onConflict: 'key' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(admin.id, 'update_setting', null, { key, value });

  return NextResponse.json({ ok: true });
}
