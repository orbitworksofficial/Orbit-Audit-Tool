/**
 * External links used across the site.
 *
 * Kept in one file so a change lands everywhere at once. The booking link in
 * particular appears on the report, contact page, pricing page and landing
 * CTA — the previous version had them out of step, with some pointing at a
 * mailto: placeholder.
 */

/**
 * Calendly booking page.
 *
 * Override per environment with NEXT_PUBLIC_CALENDLY_URL. The fallback is a
 * placeholder: confirm the real slug in your Calendly dashboard, since this
 * one 404s if the account uses a different handle.
 */
export const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ??
  'https://calendly.com/orbitworks/30min';

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
