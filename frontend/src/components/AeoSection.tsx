import type { Module1AeoGeo } from '@/types/audit';
import ScoreGauge from './ScoreGauge';
import { scoreColor } from '@/lib/scores';

/**
 * The seven on-page checks module1 performs, with what to do when one fails.
 * Keys must match the schema_signals dict in modules/module1_aeo_geo.py.
 */
const SIGNAL_LABELS: { key: string; label: string; fix: string }[] = [
  {
    key: 'has_organization',
    label: 'Organisation schema',
    fix: 'Add Organization JSON-LD so AI knows what your business is.',
  },
  {
    key: 'has_local_business',
    label: 'LocalBusiness schema',
    fix: 'Add LocalBusiness JSON-LD with your address and hours.',
  },
  {
    key: 'has_faq',
    label: 'FAQ schema',
    fix: 'Add an FAQ section with FAQPage markup — AI quotes these directly.',
  },
  {
    key: 'meta_tags_quality',
    label: 'Meta tags',
    fix: 'Write a unique title and description on every page.',
  },
  {
    key: 'has_og_tags',
    label: 'Open Graph tags',
    fix: 'Add og:title, og:description and og:image.',
  },
  {
    key: 'h1_quality',
    label: 'H1 heading',
    fix: 'Use exactly one descriptive H1 per page.',
  },
  {
    key: 'has_canonical',
    label: 'Canonical URL',
    fix: 'Add a canonical link tag to avoid duplicate-content confusion.',
  },
];

/** One weighted component of the combined AEO/GEO score. */
function ScoreBar({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11.5px] text-muted">{label}</span>
        <span className="font-display text-[12px] font-semibold">
          {Math.round(v)}
          <span className="ml-1 text-[10px] font-normal text-faint">
            {weight}
          </span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-1000"
          style={{ width: `${v}%`, background: scoreColor(v) }}
        />
      </div>
    </div>
  );
}

/**
 * The brief gives AEO/GEO more visual space than any other section: show which
 * platforms were queried, whether the business appeared, and which competitors
 * appeared instead.
 */
export default function AeoSection({ data }: { data: Module1AeoGeo }) {
  const queries = data.queries_tested ?? [];
  const perplexityHits = data.perplexity_appearances ?? 0;
  const googleHits = data.google_ai_overview_appearances ?? 0;
  const rivals = data.competitor_names_appearing_instead ?? [];

  const platforms = [
    { name: 'Perplexity', hits: perplexityHits, total: queries.length },
    { name: 'Google AI Overview', hits: googleHits, total: queries.length },
  ];

  return (
    <section className="ow-card p-7 sm:p-9">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand via-brand-100 to-transparent" />

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-brand">
            Hero section · 50% of your score
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
            AI Search Visibility
          </h2>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
            Whether AI engines name your business when someone asks for a
            recommendation in your category.
          </p>
        </div>

        <ScoreGauge score={data.combined_score} label="AEO + GEO" size={128} />
      </div>

      {/* How the 50%-weighted score is built, so the number is not a mystery. */}
      <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <p className="text-[12px] leading-relaxed text-muted">
          <span className="font-semibold text-white/70">How it is scored: </span>
          On-page signals (schema markup, meta tags) contribute 40%, appearing
          in Perplexity contributes 30%, and appearing in Google AI Overviews
          contributes 30%. Perfect meta tags with no AI visibility caps you at
          about 40.
        </p>
        <div className="mt-3.5 grid gap-2.5 sm:grid-cols-3">
          <ScoreBar
            label="On-page signals"
            value={data.schema_score}
            weight="40%"
          />
          <ScoreBar label="Perplexity" value={data.aeo_score} weight="30%" />
          <ScoreBar
            label="Google AI Overviews"
            value={data.geo_score}
            weight="30%"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {platforms.map((p) => {
          const appeared = p.hits > 0;
          return (
            <div
              key={p.name}
              className={`rounded-xl border p-4 ${
                appeared
                  ? 'border-success/25 bg-success/[0.05]'
                  : 'border-brand/25 bg-brand/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold">{p.name}</span>
                <span
                  className={`text-lg ${appeared ? 'text-success' : 'text-brand'}`}
                >
                  {appeared ? '✓' : '✕'}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                {appeared
                  ? `Cited in ${p.hits} of ${p.total} test queries`
                  : `Not cited in any of ${p.total} test queries`}
              </p>
            </div>
          );
        })}
      </div>

      {/* The 40% on-page component, check by check. */}
      <div className="mt-6">
        <h3 className="ow-label">On-page signals &mdash; 40% of this score</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {SIGNAL_LABELS.map(({ key, label, fix }) => {
            const raw = (data.schema_signals ?? {})[key];
            const ok = raw === true || raw === 'Good';
            return (
              <div
                key={key}
                className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 ${
                  ok
                    ? 'border-success/20 bg-success/[0.05]'
                    : 'border-brand/[0.18] bg-brand/[0.05]'
                }`}
              >
                <span
                  className={`mt-px shrink-0 text-[13px] ${ok ? 'text-success' : 'text-brand'}`}
                >
                  {ok ? '✓' : '✗'}
                </span>
                <span>
                  <span className="block text-[12.5px] text-white/80">
                    {label}
                  </span>
                  {!ok && (
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                      {fix}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-7 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="ow-label">Queries we tested</h3>
          <ul className="space-y-2">
            {queries.map((q) => (
              <li
                key={q}
                className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 font-mono text-[11.5px] text-white/65"
              >
                {q}
              </li>
            ))}
            {queries.length === 0 && (
              <li className="text-[12.5px] text-muted">No queries recorded.</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="ow-label">Appearing instead of you</h3>
          {rivals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {rivals.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-brand/25 bg-brand/[0.07] px-3 py-1.5 text-[12px] text-brand-soft"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-muted">
              No competitors were consistently named in your place.
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
              <div className="font-display text-lg font-bold">
                {data.aeo_score}
              </div>
              <div className="text-[11px] text-muted">AEO score</div>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
              <div className="font-display text-lg font-bold">
                {data.geo_score}
              </div>
              <div className="text-[11px] text-muted">GEO score</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
