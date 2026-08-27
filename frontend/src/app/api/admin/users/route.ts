import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, logAdminAction } from '@/lib/admin';

/**
 * User management. Every action is admin-only and written to admin_actions,
 * so changes stay attributable.
 */

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim();

  const db = createAdminClient();
  let query = db
    .from('profiles')
    .select(
      'id, email, full_name, created_at, is_admin, is_active, scan_limit, scans_used, bonus_scans, last_seen_at, deactivated_reason'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}

/**
 * Actions: activate, deactivate, gift_scans, reset_scans, make_admin,
 * revoke_admin.
 */
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId: string | undefined = body?.userId;
  const action: string | undefined = body?.action;

  if (!userId || !action) {
    return NextResponse.json(
      { error: 'userId and action are required' },
      { status: 400 }
    );
  }

  if (userId === admin.id && ['deactivate', 'revoke_admin'].includes(action)) {
    return NextResponse.json(
      { error: 'You cannot deactivate or demote yourself.' },
      { status: 400 }
    );
  }

  const db = createAdminClient();
  let update: Record<string, unknown> = {};

  switch (action) {
    case 'activate':
      update = { is_active: true, deactivated_reason: null };
      break;

    case 'deactivate':
      update = {
        is_active: false,
        deactivated_reason: String(body?.reason ?? '').slice(0, 200) || null,
      };
      break;

    case 'gift_scans': {
      const amount = Number(body?.amount);
      if (!Number.isFinite(amount) || amount < 1 || amount > 100) {
        return NextResponse.json(
          { error: 'amount must be between 1 and 100' },
          { status: 400 }
        );
      }
      const { data: current } = await db
        .from('profiles')
        .select('bonus_scans')
        .eq('id', userId)
        .single();
      update = { bonus_scans: (current?.bonus_scans ?? 0) + amount };
      break;
    }

    case 'reset_scans':
      update = { scans_used: 0 };
      break;

    case 'make_admin':
      update = { is_admin: true };
      break;

    case 'revoke_admin':
      update = { is_admin: false };
      break;

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const { error } = await db.from('profiles').update(update).eq('id', userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(admin.id, action, userId, update);

  return NextResponse.json({ ok: true, applied: update });
}
