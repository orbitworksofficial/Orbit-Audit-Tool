/**
 * Lightweight device fingerprinting.
 *
 * Combines the IP with a handful of stable browser signals — user agent,
 * screen size, timezone, language, platform — into one hash. No third-party
 * library, no canvas or audio probing, so this stays on the right side of the
 * line between "recognising a returning device" and covert tracking.
 *
 * It stops casual abuse (clear cookies, scan again). It will not stop someone
 * determined with a VPN and a fresh browser profile, and it is not meant to.
 */

/** Browser-side signals, collected by the scan form and sent with the request. */
export interface ClientSignals {
  ua?: string;
  screen?: string;
  tz?: string;
  lang?: string;
  platform?: string;
}

/** Collects the signals. Client-side only. */
export function collectSignals(): ClientSignals {
  if (typeof window === 'undefined') return {};
  return {
    ua: navigator.userAgent,
    screen: `${window.screen.width}x${window.screen.height}x${window.devicePixelRatio}`,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: navigator.language,
    platform: (navigator as Navigator & { platform?: string }).platform ?? '',
  };
}

/**
 * Hashes IP + signals into a stable id.
 *
 * SHA-256 via Web Crypto, which exists in both the browser and the Node
 * runtime Next.js route handlers use.
 */
export async function computeFingerprint(
  ip: string,
  signals: ClientSignals
): Promise<string> {
  const raw = [
    ip,
    signals.ua ?? '',
    signals.screen ?? '',
    signals.tz ?? '',
    signals.lang ?? '',
    signals.platform ?? '',
  ].join('|');

  const bytes = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
