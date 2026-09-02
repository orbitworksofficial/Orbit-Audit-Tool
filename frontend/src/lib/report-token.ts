import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signed access tokens for report links sent by email.
 *
 * A guest scan is stored with user_id = NULL, so the RLS policy
 * (auth.uid() = user_id) hides it from everyone — including the person who
 * just ran it. Without a token their "view your report" link 404s.
 *
 * The token is an HMAC of the report id. It proves the holder received our
 * email, which is the same bar as a password-reset link. It carries no
 * expiry: a stale link that still works is a better outcome than a dead link
 * in someone's inbox.
 */

function secret(): string {
  // Reuses the service-role key rather than adding another env var to set on
  // the server. It never leaves the server, and the HMAC does not expose it.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to sign report links');
  }
  return key;
}

export function signReportId(reportId: string): string {
  return createHmac('sha256', secret())
    .update(`report:${reportId}`)
    .digest('base64url');
}

/** Constant-time compare, so a wrong token cannot be guessed byte by byte. */
export function verifyReportToken(reportId: string, token: string | undefined): boolean {
  if (!token) return false;

  try {
    const expected = Buffer.from(signReportId(reportId));
    const given = Buffer.from(token);
    if (expected.length !== given.length) return false;
    return timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}
