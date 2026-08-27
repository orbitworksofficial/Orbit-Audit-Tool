import { createAdminClient } from '@/lib/supabase/admin';

export interface QuotaState {
  allowed: boolean;
  scansUsed: number;
  scanLimit: number;
  remaining: number;
}

/**
 * Atomically spend one scan credit.
 *
 * Uses the consume_scan_credit SQL function rather than a read-then-write in
 * JS, so two scans fired at once cannot both pass the check.
 */
export async function consumeScanCredit(userId: string): Promise<QuotaState> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc('consume_scan_credit', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Quota check failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  const scansUsed = row?.scans_used ?? 0;
  const scanLimit = row?.scan_limit ?? 0;

  return {
    allowed: Boolean(row?.allowed),
    scansUsed,
    scanLimit,
    remaining: Math.max(scanLimit - scansUsed, 0),
  };
}

/** Read quota without spending a credit. */
export async function readQuota(userId: string): Promise<QuotaState> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('profiles')
    .select('scans_used, scan_limit, bonus_scans, is_active')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return { allowed: false, scansUsed: 0, scanLimit: 0, remaining: 0 };
  }

  // Gifted scans count toward the total an admin has granted.
  const total = data.scan_limit + (data.bonus_scans ?? 0);
  const remaining = Math.max(total - data.scans_used, 0);

  return {
    allowed: remaining > 0 && data.is_active !== false,
    scansUsed: data.scans_used,
    scanLimit: total,
    remaining,
  };
}

/**
 * Refund a credit when a scan fails after the credit was taken. Users should
 * not be charged for our outages.
 */
export async function refundScanCredit(userId: string): Promise<void> {
  const admin = createAdminClient();
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
}
