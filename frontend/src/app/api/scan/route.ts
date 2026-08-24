import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAudit, PythonApiError } from '@/lib/python-api';
import { scanSchema } from '@/lib/validation';
import { checkScanRateLimit, clientIp, tagReportWithIp } from '@/lib/rate-limit';

/** A full audit runs 30-60s of live API calls in Python. */
export const maxDuration = 300;

/**
 * Runs a free audit. No account required — this is a lead magnet, so the only
 * thing we ask for is the form itself. Abuse is limited by IP and email.
 *
 * If the visitor happens to be signed in, the report is linked to their
 * account so it appears in their dashboard.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = scanSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const ip = clientIp(request);
  const limit = await checkScanRateLimit(parsed.data.email, ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: limit.reason, code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  // Signed in is optional. We only use it to attach the report to an account.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Anonymous visitor — expected, carry on.
  }

  try {
    // Python runs every module, calls Claude/Groq, and writes to Supabase.
    const audit = await runAudit(parsed.data);

    // Python inserts the row without a user_id or IP. Claim the newest
    // matching row so we can link and rate-limit it.
    let reportId: string | null = null;
    try {
      const admin = createAdminClient();
      const { data: rows } = await admin
        .from('audit_reports')
        .select('id')
        .eq('business_name', audit.result.business_name)
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (rows?.length) {
        reportId = rows[0].id;
        if (userId) {
          await admin
            .from('audit_reports')
            .update({ user_id: userId })
            .eq('id', reportId);
        }
        if (reportId) await tagReportWithIp(reportId, ip);
      }
    } catch (e) {
      // Best-effort. The scan itself succeeded, so still return it.
      console.error('Could not link report:', e);
    }

    return NextResponse.json({ ...audit, reportId, signedIn: Boolean(userId) });
  } catch (err) {
    const status = err instanceof PythonApiError ? err.status : 500;
    const message =
      err instanceof PythonApiError ? err.message : 'The scan failed.';

    return NextResponse.json({ error: message }, { status });
  }
}
