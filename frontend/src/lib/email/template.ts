import {
  CALENDLY_URL,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  SITE_URL,
} from '@/lib/links';
import { scoreLabel } from '@/lib/scores';
import type { AuditResult, AiAnalysis } from '@/types/audit';

/**
 * Branded HTML email carrying the audit report.
 *
 * Written to 2005-era HTML on purpose: tables for layout, inline styles, no
 * flexbox or grid. Outlook renders with Word's engine and Gmail strips <style>
 * blocks, so anything modern collapses into a single unstyled column.
 *
 * The palette is inverted from the site — dark backgrounds are unreliable in
 * mail clients and many force their own, so the email is light with the
 * crimson accent carried through.
 *
 * The logo is attached and referenced by CID rather than linked to the site.
 * Outlook and most clients block remote images until the reader allows them,
 * which would leave a broken box where the masthead should be; an embedded
 * image renders straight away.
 */

/** Content-ID for the attached logo. Must match the attachment in send.ts. */
export const LOGO_CID = 'orbitworks-logo';

const BRAND = '#f3124e';
const INK = '#0b1220';
const MUTED = '#5b6579';
const BORDER = '#e3e7ef';
const SUCCESS = '#0f9d63';
const WARN = '#c47f0a';

/** Score colours, darkened for legibility on white. */
function emailScoreColor(score: number): string {
  if (score > 70) return SUCCESS;
  if (score >= 40) return WARN;
  return BRAND;
}

export interface ReportEmailInput {
  fullName: string;
  businessName: string;
  result: AuditResult;
  ai?: AiAnalysis;
  reportUrl: string;
}

export function buildReportEmail(input: ReportEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { fullName, businessName, result, ai, reportUrl } = input;
  const overall = Math.round(result.overall_score);
  const firstName = (fullName || '').trim().split(/\s+/)[0] || 'there';

  const sections = [
    { name: 'AI Visibility (AEO + GEO)', score: result.module1_aeo_geo.combined_score, weight: '50%' },
    { name: 'Website Health', score: result.module2_website_health.website_score, weight: '10%' },
    { name: 'SEO & Search', score: result.module3_seo.seo_score, weight: '10%' },
    { name: 'Reputation', score: result.module4_reputation.reputation_score, weight: '10%' },
    { name: 'Competitors', score: result.module5_competitors.competitor_score, weight: '10%' },
    { name: 'Social Presence', score: result.module6_social.social_score, weight: '10%' },
  ];

  const gaps = (ai?.deep_analysis?.critical_gaps ?? []).slice(0, 3);
  const summary = ai?.deep_analysis?.overall_summary ?? '';

  const subject = `${businessName}: your AI visibility score is ${overall}/100`;

  const rows = sections
    .map(
      (s) => `
      <tr>
        <td style="padding:11px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${INK};">
          ${esc(s.name)}
          <span style="color:${MUTED};font-size:12px;">&nbsp;&middot;&nbsp;${s.weight}</span>
        </td>
        <td align="right" style="padding:11px 0;border-bottom:1px solid ${BORDER};white-space:nowrap;">
          <span style="font-size:17px;font-weight:700;color:${emailScoreColor(s.score)};">${Math.round(s.score)}</span>
          <span style="font-size:12px;color:${MUTED};">/100</span>
        </td>
      </tr>`
    )
    .join('');

  const gapsBlock = gaps.length
    ? `
      <tr><td style="padding:26px 32px 0 32px;">
        <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND};">
          Your 3 biggest gaps
        </p>
        ${gaps
          .map(
            (g, i) => `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
            <tr>
              <td width="26" valign="top" style="padding-top:2px;">
                <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;background:${BRAND};color:#ffffff;font-size:11px;font-weight:700;border-radius:3px;">${i + 1}</span>
              </td>
              <td style="font-size:13.5px;line-height:1.6;color:${INK};">${esc(g)}</td>
            </tr>
          </table>`
          )
          .join('')}
      </td></tr>`
    : '';

  const summaryBlock = summary
    ? `
      <tr><td style="padding:22px 32px 0 32px;">
        <p style="margin:0;padding:16px 18px;background:#f6f8fc;border-left:3px solid ${BRAND};font-size:13.5px;line-height:1.7;color:${INK};">
          ${esc(summary)}
        </p>
      </td></tr>`
    : '';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<!-- Preheader: the grey preview line in the inbox. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Your full AI visibility audit for ${esc(businessName)} is ready to view.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:28px 12px;">
<tr><td align="center">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(11,18,32,.08);">

    <!-- Masthead -->
    <tr>
      <td style="background:${INK};padding:24px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <!--
                Alt text carries the brand if images are stripped entirely;
                the fixed width and display:block stop Outlook adding a gap.
              -->
              <img src="cid:${LOGO_CID}" width="150" height="29" alt="Orbit Works"
                   style="display:block;border:0;outline:none;text-decoration:none;width:150px;height:29px;">
            </td>
            <td align="right" style="font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:#8b95a8;">
              AI Visibility Report
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding:32px 32px 0 32px;">
        <p style="margin:0 0 6px 0;font-size:16px;color:${INK};">Hi ${esc(firstName)},</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:${MUTED};">
          Your audit for <strong style="color:${INK};">${esc(businessName)}</strong> is complete.
          Here is how your digital presence scored.
        </p>
      </td>
    </tr>

    <!-- Overall score -->
    <tr>
      <td align="center" style="padding:28px 32px 0 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="border:2px solid ${emailScoreColor(overall)};border-radius:8px;">
          <tr>
            <td align="center" style="padding:20px 44px;">
              <div style="font-size:52px;font-weight:800;line-height:1;color:${emailScoreColor(overall)};">${overall}<span style="font-size:20px;color:${MUTED};">/100</span></div>
              <div style="margin-top:8px;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${emailScoreColor(overall)};">
                ${esc(scoreLabel(overall))}
              </div>
            </td>
          </tr>
        </table>
        <p style="margin:12px 0 0 0;font-size:12.5px;color:${MUTED};">
          Overall score across 6 visibility pillars
        </p>
      </td>
    </tr>

    <!-- Section breakdown -->
    <tr>
      <td style="padding:28px 32px 0 32px;">
        <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND};">
          Section scores
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td>
    </tr>

    ${summaryBlock}
    ${gapsBlock}

    <!-- Primary CTA -->
    <tr>
      <td align="center" style="padding:30px 32px 0 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="background:${BRAND};border-radius:4px;">
              <a href="${esc(reportUrl)}" style="display:inline-block;padding:15px 34px;font-size:13.5px;font-weight:700;letter-spacing:.6px;color:#ffffff;text-decoration:none;">
                VIEW YOUR FULL REPORT
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:12px 0 0 0;font-size:12px;color:${MUTED};">
          Includes every check we ran and how to fix each gap.
        </p>
      </td>
    </tr>

    <!-- Booking -->
    <tr>
      <td style="padding:30px 32px 0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f5;border:1px solid #f7d3dd;border-radius:6px;">
          <tr>
            <td style="padding:20px 22px;">
              <p style="margin:0 0 5px 0;font-size:15px;font-weight:700;color:${INK};">
                Want help closing these gaps?
              </p>
              <p style="margin:0 0 14px 0;font-size:13px;line-height:1.6;color:${MUTED};">
                Book a free 30-minute strategy session and we will walk through
                what to fix first.
              </p>
              <a href="${esc(CALENDLY_URL)}" style="display:inline-block;padding:11px 22px;background:${INK};color:#ffffff;font-size:12.5px;font-weight:700;letter-spacing:.5px;text-decoration:none;border-radius:4px;">
                BOOK A FREE SESSION
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:30px 32px 32px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BORDER};">
          <tr>
            <td style="padding-top:18px;font-size:12px;line-height:1.8;color:${MUTED};">
              <strong style="color:${INK};">Orbit Works</strong><br>
              <a href="mailto:${esc(CONTACT_EMAIL)}" style="color:${MUTED};text-decoration:none;">${esc(CONTACT_EMAIL)}</a>
              &nbsp;&middot;&nbsp;
              <a href="${esc(CONTACT_PHONE_HREF)}" style="color:${MUTED};text-decoration:none;">WhatsApp ${esc(CONTACT_PHONE)}</a><br>
              <a href="${esc(SITE_URL)}" style="color:${BRAND};text-decoration:none;">orb-itworks.com</a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:14px;font-size:11px;line-height:1.6;color:#98a1b2;">
              You are receiving this because you requested a free AI visibility
              audit at orb-itworks.com. Reply to this email if you would rather
              not hear from us again.
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`;

  // Plain-text alternative. Some clients show it, and its absence is itself a
  // spam signal.
  const text = [
    `Hi ${firstName},`,
    ``,
    `Your AI visibility audit for ${businessName} is complete.`,
    ``,
    `OVERALL SCORE: ${overall}/100 (${scoreLabel(overall)})`,
    ``,
    `SECTION SCORES`,
    ...sections.map((s) => `  ${s.name} (${s.weight}): ${Math.round(s.score)}/100`),
    ``,
    ...(summary ? [summary, ``] : []),
    ...(gaps.length
      ? ['YOUR 3 BIGGEST GAPS', ...gaps.map((g, i) => `  ${i + 1}. ${g}`), '']
      : []),
    `View your full report:`,
    reportUrl,
    ``,
    `Book a free 30-minute strategy session:`,
    CALENDLY_URL,
    ``,
    `--`,
    `Orbit Works`,
    `${CONTACT_EMAIL} | WhatsApp ${CONTACT_PHONE}`,
    SITE_URL,
  ].join('\n');

  return { subject, html, text };
}

/** Escapes user-supplied text before it reaches the HTML. */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
