import { createAdminClient } from '@/lib/supabase/admin';
import type { ScanInput } from '@/lib/validation';

/**
 * Lead capture.
 *
 * A lead row is written the moment someone submits the scan form — before the
 * audit runs — so the contact detail survives even when the scan later fails.
 * That is the whole point of the tool: audit_reports holds results, leads holds
 * people.
 */

export interface LeadContext {
  userId: string | null;
  clientIp: string;
  fingerprint: string;
  userAgent: string;
}

/** Writes the lead and returns its id, or null if the write failed. */
export async function captureLead(
  input: ScanInput,
  ctx: LeadContext
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('leads')
      .insert({
        full_name: input.full_name,
        email: input.email.toLowerCase(),
        business_name: input.business_name,
        website_url: input.url,
        city: input.city || null,
        country: input.country || null,
        whatsapp: input.whatsapp || null,
        user_id: ctx.userId,
        is_guest: !ctx.userId,
        client_ip: ctx.clientIp,
        fingerprint: ctx.fingerprint,
        user_agent: ctx.userAgent.slice(0, 500),
        scan_status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Lead capture failed:', error.message);
      return null;
    }
    return data.id;
  } catch (e) {
    // Never let lead capture block a scan — the audit matters more.
    console.error('Lead capture threw:', e);
    return null;
  }
}

/** Marks the lead as finished, linking the report or recording the error. */
export async function completeLead(
  leadId: string | null,
  outcome:
    | { status: 'success'; reportId: string | null }
    | { status: 'failed'; error: string }
): Promise<void> {
  if (!leadId) return;
  try {
    const admin = createAdminClient();
    await admin
      .from('leads')
      .update(
        outcome.status === 'success'
          ? { scan_status: 'success', report_id: outcome.reportId }
          : { scan_status: 'failed', error_message: outcome.error.slice(0, 500) }
      )
      .eq('id', leadId);
  } catch (e) {
    console.error('Lead completion failed:', e);
  }
}
