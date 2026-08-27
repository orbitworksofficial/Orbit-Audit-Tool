import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAudit, PythonApiError } from '@/lib/python-api';
import { scanSchema } from '@/lib/validation';
import { clientIp } from '@/lib/rate-limit';
import { computeFingerprint, type ClientSignals } from '@/lib/fingerprint';
import { captureLead, completeLead } from '@/lib/leads';

/** A full audit runs 100-155s of live API calls in Python. */
export const maxDuration = 300;

/**
 * Runs an audit.
 *
 * Quota: a guest gets 1 scan per device, then must sign up for 2 more —
 * 3 lifetime per person. Signing up is the lead-capture moment.
 *
 * The lead row is written before the audit starts, so the contact detail
 * survives even if the scan fails.
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
  const userAgent = request.headers.get('user-agent') ?? '';
  const signals = (body?.signals ?? {}) as ClientSignals;
  const fingerprint = await computeFingerprint(ip, { ...signals, ua: userAgent });

  // Signed in is optional — it only changes which quota applies.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Anonymous visitor.
  }

  // ---- Quota -------------------------------------------------------------
  const admin = createAdminClient();
  let quota: {
    allowed: boolean;
    reason?: string | null;
    used?: number;
    limit?: number;
  };

  if (userId) {
    const { data } = await admin.rpc('consume_scan_credit', {
      p_user_id: userId,
    });
    const row = Array.isArray(data) ? data[0] : data;
    quota = {
      allowed: Boolean(row?.allowed),
      reason: row?.reason,
      used: row?.scans_used,
      limit: row?.scan_limit,
    };
  } else {
    const { data } = await admin.rpc('consume_guest_scan', {
      p_fingerprint: fingerprint,
      p_client_ip: ip,
      p_email: parsed.data.email.toLowerCase(),
    });
    const row = Array.isArray(data) ? data[0] : data;
    quota = {
      allowed: Boolean(row?.allowed),
      reason: row?.reason,
      used: row?.used,
      limit: row?.guest_limit,
    };
  }

  // Capture the lead even when the quota blocks them — they still told us who
  // they are, and someone who hit the limit is a warm lead.
  const leadId = await captureLead(parsed.data, {
    userId,
    clientIp: ip,
    fingerprint,
    userAgent,
  });

  if (!quota.allowed) {
    await completeLead(leadId, {
      status: 'failed',
      error: quota.reason ?? 'Quota exceeded',
    });
    return NextResponse.json(
      {
        error: quota.reason ?? 'You have used all your free scans.',
        code: userId ? 'QUOTA_EXCEEDED' : 'GUEST_QUOTA_EXCEEDED',
        needsSignup: !userId,
      },
      { status: 402 }
    );
  }

  // ---- Run the audit -----------------------------------------------------
  try {
    const audit = await runAudit(parsed.data);

    // Python inserts the row without a user_id or IP. Claim the newest
    // matching row so it can be linked and rate-limited.
    let reportId: string | null = null;
    try {
      const { data: rows } = await admin
        .from('audit_reports')
        .select('id')
        .eq('business_name', audit.result.business_name)
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (rows?.length) {
        reportId = rows[0].id;
        await admin
          .from('audit_reports')
          .update({
            user_id: userId,
            client_ip: ip,
          })
          .eq('id', reportId);
      }
    } catch (e) {
      // Best effort: the scan succeeded, so still return it.
      console.error('Could not link report:', e);
    }

    await completeLead(leadId, { status: 'success', reportId });

    return NextResponse.json({
      ...audit,
      reportId,
      signedIn: Boolean(userId),
      scansRemaining:
        quota.limit !== undefined && quota.used !== undefined
          ? Math.max(0, quota.limit - quota.used)
          : undefined,
    });
  } catch (err) {
    const status = err instanceof PythonApiError ? err.status : 500;
    const message =
      err instanceof PythonApiError ? err.message : 'The scan failed.';

    await completeLead(leadId, { status: 'failed', error: message });

    // Refund: the user should not lose a credit to our outage.
    try {
      if (userId) {
        const { data } = await admin
          .from('profiles')
          .select('scans_used')
          .eq('id', userId)
          .single();
        if (data && data.scans_used > 0) {
          await admin
            .from('profiles')
            .update({ scans_used: data.scans_used - 1 })
            .eq('id', userId);
        }
      } else {
        const { data } = await admin
          .from('guest_scans')
          .select('scan_count')
          .eq('fingerprint', fingerprint)
          .single();
        if (data && data.scan_count > 0) {
          await admin
            .from('guest_scans')
            .update({ scan_count: data.scan_count - 1 })
            .eq('fingerprint', fingerprint);
        }
      }
    } catch {
      // Refund is best-effort.
    }

    return NextResponse.json({ error: message }, { status });
  }
}
