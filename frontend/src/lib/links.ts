/**
 * External links used across the site.
 *
 * Kept in one file so a change lands everywhere at once. The booking link in
 * particular appears on the report, contact page, pricing page and landing
 * CTA — the previous version had them out of step, with some pointing at a
 * mailto: placeholder.
 */

/**
 * Calendly booking page — the live 30-minute strategy session.
 *
 * Override per environment with NEXT_PUBLIC_CALENDLY_URL. That variable is
 * NEXT_PUBLIC_, so it is baked in at build time: changing it needs a rebuild,
 * not just a restart. The fallback below is the real link, so the buttons work
 * even where the variable was never set.
 */
export const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ??
  'https://calendly.com/orbitworksofficial01/30min';

export const CONTACT_EMAIL = 'hello@orb-itworks.com';

/**
 * WhatsApp, not a landline — so the link opens a chat rather than dialling.
 * A tel: href would start a phone call, which is not what this number is for.
 * wa.me needs the number bare: digits only, no +, spaces, or punctuation.
 */
export const CONTACT_PHONE = '+1 (443) 260-9169';
export const CONTACT_PHONE_HREF = 'https://wa.me/14432609169';

/** Public base URL, used to build absolute links in emails. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://scan.orb-itworks.com';
