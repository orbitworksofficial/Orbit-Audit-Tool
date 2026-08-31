import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';
import { sendReportEmail, verifySmtp } from '@/lib/email/send';
import { SITE_URL } from '@/lib/links';
import type { AuditResult, AiAnalysis } from '@/types/audit';

/**
 * Admin-only: checks the SMTP connection, and optionally sends a real report
 * email using the most recent stored scan.
 *
 *   GET  /api/admin/test-email            -> verify credentials only
 *   POST /api/admin/test-email {to}       -> send a real email
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }
  return NextResponse.json(await verifySmtp());
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const to: string | undefined = body?.to;
  if (!to || !/^[^@]+@[^@]+\.[^@]+$/.test(to)) {
    return NextResponse.json({ error: 'A valid "to" is required' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data } = await db
    .from('audit_reports')
    .select('id, raw_data, ai_insights')
    .order('created_at', { ascending: false })
    .limit(1);

  const row = data?.[0];
  if (!row?.raw_data) {
    return NextResponse.json(
      { error: 'No stored report to send' },
      { status: 404 }
    );
  }

  const result = row.raw_data as AuditResult;

  const outcome = await sendReportEmail(to, {
    fullName: 'Kashif Rehman',
    businessName: result.business_name,
    result,
    ai: row.ai_insights
      ? ({ deep_analysis: row.ai_insights } as AiAnalysis)
      : undefined,
    reportUrl: `${SITE_URL}/report/${row.id}`,
  });

  return NextResponse.json(outcome);
}
