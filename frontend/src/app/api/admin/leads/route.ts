import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';

/** Lead list for the admin dashboard, with optional filtering. */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q')?.trim();
  const type = searchParams.get('type'); // all | guest | member
  const status = searchParams.get('status'); // all | success | failed | pending

  const db = createAdminClient();
  let query = db
    .from('leads')
    .select(
      'id, created_at, full_name, email, business_name, website_url, city, country, is_guest, user_id, client_ip, report_id, scan_status, contacted, notes'
    )
    .order('created_at', { ascending: false })
    .limit(300);

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,business_name.ilike.%${search}%,full_name.ilike.%${search}%`
    );
  }
  if (type === 'guest') query = query.eq('is_guest', true);
  if (type === 'member') query = query.eq('is_guest', false);
  if (status && status !== 'all') query = query.eq('scan_status', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data ?? [] });
}

/** Marks a lead contacted, or saves a note. */
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const leadId: string | undefined = body?.leadId;
  if (!leadId) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body?.contacted === 'boolean') update.contacted = body.contacted;
  if (typeof body?.notes === 'string') update.notes = body.notes.slice(0, 2000);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from('leads').update(update).eq('id', leadId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
