import { Panel, CheckLine, MicroHead } from './Primitives';
import { PageFoot } from './ReportPageOne';
import type { AuditResult } from '@/types/audit';

/**
 * The seven on-page checks module1 performs.
 * Keys match the schema_signals dict in modules/module1_aeo_geo.py.
 */
const SIGNALS: { key: string; label: string; fix: string }[] = [
  {
    key: 'has_organization',
    label: 'Organisation Schema',
    fix: 'Add Organization JSON-LD so AI knows what your business is.',
  },
  {
    key: 'meta_tags_quality',
    label: 'Meta Tags',
    fix: 'Write a unique title and description on every page.',
  },
  {
    key: 'has_og_tags',
    label: 'Open Graph Tags',
    fix: 'Add og:title, og:description and og:image.',
  },
  {
    key: 'h1_quality',
    label: 'H1 Heading',
    fix: 'Use exactly one descriptive H1 per page.',
  },
  {
    key: 'has_canonical',
    label: 'Canonical URL',
    fix: 'Add a canonical link tag to avoid duplicate-content confusion.',
  },
  {
    key: 'has_local_business',
    label: 'LocalBusiness Schema',
    fix: 'Add LocalBusiness JSON-LD with your address and hours.',
  },
  {
    key: 'has_faq',
    label: 'FAQ Schema',
    fix: 'Add an FAQ section with FAQPage markup — AI quotes these directly.',
  },
];

/** Page 2 — the evidence behind the AI visibility score. */
export default function ReportPageTwo({ result }: { result: AuditResult }) {
  const m1 = result.module1_aeo_geo;
  const queries = m1.queries_tested ?? [];
  const rivals = m1.competitor_names_appearing_instead ?? [];
  const signals = (m1.schema_signals ?? {}) as Record<string, unknown>;

  const passed = SIGNALS.filter((s) => {
    const v = signals[s.key];
    return v === true || v === 'Good';
  });
  const failed = SIGNALS.filter((s) => !passed.includes(s));

  const platforms = [
    { name: 'Perplexity', hits: m1.perplexity_appearances ?? 0 },
    { name: 'Google AI Overviews', hits: m1.google_ai_overview_appearances ?? 0 },
  ];

  return (
    <div className="ow-report-page rounded-[10px] border border-border bg-ink p-8">
      <div className="ow-report-scale mx-auto">
        <h2 className="mb-5 font-display text-[18px] font-extrabold uppercase tracking-[-.02em] text-brand">
          AI Visibility &mdash; The Evidence
        </h2>

        {/* Platform results */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {platforms.map((p) => (
            <div
              key={p.name}
              className={`rounded-[5px] border p-3.5 ${
                p.hits > 0
                  ? 'border-success/25 bg-success/[0.05]'
                  : 'border-brand/25 bg-brand/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    p.hits > 0
                      ? 'bg-success/20 text-success'
                      : 'bg-brand/20 text-brand-100'
                  }`}
                >
                  {p.hits > 0 ? '✓' : '✕'}
                </span>
                <span className="text-[12.5px] font-semibold text-white">
                  {p.name}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-muted">
                {p.hits > 0
                  ? `Cited in ${p.hits} of ${queries.length} test queries`
                  : `Not cited in any of ${queries.length} test queries`}
              </p>
            </div>
          ))}
        </div>

        {/* Queries and rivals: side by side on screen, stacked for print. */}
        <div className="ow-screen-cols mb-4 gap-4">
        <Panel className="!p-4">
          <MicroHead>Queries we tested</MicroHead>
          <ul className="space-y-1.5">
            {queries.map((q) => (
              <li
                key={q}
                className="rounded-[3px] border border-border bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-white/65"
              >
                {q}
              </li>
            ))}
            {queries.length === 0 && (
              <li className="text-[11.5px] text-muted">No queries recorded.</li>
            )}
          </ul>
        </Panel>

        {rivals.length > 0 && (
          <Panel glow className="!p-4">
            <MicroHead>Appearing instead of you</MicroHead>
            <div className="flex flex-wrap gap-2">
              {rivals.slice(0, 6).map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-2 rounded-[4px] border border-brand/25 bg-brand/[0.06] px-2.5 py-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-brand/20 font-display text-[10px] font-bold text-brand-100">
                    {initials(c)}
                  </span>
                  <span className="text-[11.5px] text-white/85">
                    {cleanDomain(c)}
                  </span>
                </span>
              ))}
            </div>
          </Panel>
        )}
        </div>

        {/* On-page signals */}
        <Panel className="!p-4">
          <MicroHead>On-page signals (40% of this score)</MicroHead>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            <ul className="space-y-2.5">
              {passed.map((s) => (
                <CheckLine key={s.key} ok label={s.label} />
              ))}
            </ul>
            <ul className="space-y-2.5">
              {failed.map((s) => (
                <CheckLine key={s.key} ok={false} label={s.label} detail={s.fix} />
              ))}
            </ul>
          </div>
        </Panel>

        <PageFoot n={2} />
      </div>
    </div>
  );
}

function cleanDomain(d: string): string {
  return d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

function initials(d: string): string {
  const name = cleanDomain(d).split('.')[0];
  return name.slice(0, 2).toUpperCase();
}
