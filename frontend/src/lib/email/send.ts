import { readFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { buildReportEmail, LOGO_CID, type ReportEmailInput } from './template';

/**
 * Report delivery over SMTP.
 *
 * Uses the hello@orb-itworks.com mailbox from your Hostinger hosting, so
 * there is no third-party service to sign up for. The trade-off is
 * deliverability: shared-hosting SMTP has weaker reputation than a dedicated
 * sender, so add SPF and DKIM records for the domain or reports will land in
 * spam. See deploy/EMAIL-SETUP.md.
 */

let cached: nodemailer.Transporter | null = null;

function transporter(): nodemailer.Transporter | null {
  if (cached) return cached;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    // Not configured: scans must still work, so this is a soft failure.
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 465);

  cached = nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
  });

  return cached;
}

/**
 * The masthead logo, read once and reused.
 *
 * Resolved from process.cwd() rather than import.meta.url: Next.js bundles
 * server code into .next, so a path relative to this module points somewhere
 * that does not exist at runtime. The app is always started from the project
 * root, both by `next start` and by the systemd unit.
 */
let logoCache: Buffer | null = null;

async function logoAttachment() {
  if (!logoCache) {
    try {
      logoCache = await readFile(
        path.join(process.cwd(), 'src/lib/email/assets/logo-email.png')
      );
    } catch (e) {
      // Send without it rather than losing the email over a missing file.
      console.error('Email logo missing, sending text masthead:', e);
      return null;
    }
  }

  return {
    filename: 'orbitworks.png',
    content: logoCache,
    cid: LOGO_CID,
    // Inline, so clients render it in place instead of listing it as a
    // downloadable attachment.
    contentDisposition: 'inline' as const,
  };
}

export interface SendResult {
  sent: boolean;
  skipped?: string;
  error?: string;
}

/**
 * Sends the report email.
 *
 * Never throws: a failed email must not fail the scan. The caller records the
 * outcome on the lead row so a missed delivery is visible in the admin.
 */
export async function sendReportEmail(
  to: string,
  input: ReportEmailInput
): Promise<SendResult> {
  const tx = transporter();
  if (!tx) {
    return { sent: false, skipped: 'SMTP is not configured' };
  }

  const from = process.env.SMTP_FROM ?? 'Orbit Works <hello@orb-itworks.com>';
  const { subject, html, text } = buildReportEmail(input);

  const logo = await logoAttachment();

  try {
    await tx.sendMail({
      from,
      to,
      subject,
      html,
      text,
      attachments: logo ? [logo] : [],
      // Replies go to the same inbox someone actually reads.
      replyTo: process.env.SMTP_REPLY_TO ?? 'hello@orb-itworks.com',
      headers: {
        // Marks this as transactional, which helps it clear bulk filters.
        'X-Entity-Ref-ID': `orbitscanner-${Date.now()}`,
      },
    });
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Report email failed:', message);
    return { sent: false, error: message };
  }
}

/** Verifies the SMTP credentials. Used by the admin test endpoint. */
export async function verifySmtp(): Promise<SendResult> {
  const tx = transporter();
  if (!tx) return { sent: false, skipped: 'SMTP is not configured' };

  try {
    await tx.verify();
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}
