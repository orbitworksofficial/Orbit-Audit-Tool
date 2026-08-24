import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Anonymous scan rate limiting.
 *
 * Scans are free and need no account, so the only thing standing between a
 * script and our API budget is this. Each audit costs roughly 12 cents in
 * DataForSEO / Perplexity / Claude credits, so the limits are deliberately
 * tight.
 *
 * Counting is done against audit_reports, which the Python service already
 * writes — no extra table, and it survives restarts.
 */

const PER_EMAIL_PER_DAY = Number(process.env.FREE_SCANS_PER_EMAIL ?? 3);
const PER_IP_PER_DAY = Number(process.env.FREE_SCANS_PER_IP ?? 10);

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterHours?: number;
}

/** Best-effort client IP from the usual proxy headers. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function checkScanRateLimit(
  email: string,
  ip: string
): Promise<RateLimitResult> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // No service-role key configured — fail open rather than blocking every
    // scan in a half-configured environment.
    return { allowed: true };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: emailCount, error: emailErr } = await admin
    .from('audit_reports')
    .select('id', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .gte('created_at', since);

  if (!emailErr && (emailCount ?? 0) >= PER_EMAIL_PER_DAY) {
    return {
      allowed: false,
      reason: `You have run ${PER_EMAIL_PER_DAY} scans in the last 24 hours. Try again tomorrow, or contact us for more.`,
      retryAfterHours: 24,
    };
  }

  if (ip !== 'unknown') {
    const { count: ipCount, error: ipErr } = await admin
      .from('audit_reports')
      .select('id', { count: 'exact', head: true })
      .eq('client_ip', ip)
      .gte('created_at', since);

    if (!ipErr && (ipCount ?? 0) >= PER_IP_PER_DAY) {
      return {
        allowed: false,
        reason:
          'Too many scans from this network in the last 24 hours. Please try again later.',
        retryAfterHours: 24,
      };
    }
  }

  return { allowed: true };
}

/**
 * Stamps the IP onto the row the Python service just wrote, so the next
 * rate-limit check can see it.
 */
export async function tagReportWithIp(
  reportId: string,
  ip: string
): Promise<void> {
  if (ip === 'unknown') return;
  try {
    const admin = createAdminClient();
    await admin
      .from('audit_reports')
      .update({ client_ip: ip })
      .eq('id', reportId);
  } catch {
    // Non-fatal: the scan succeeded, this only weakens future IP limiting.
  }
}
