import Image from 'next/image';
import ScoreRing from './ScoreRing';
import RadarChart from './RadarChart';
import { Panel, MicroHead } from './Primitives';
import { scoreColor, scoreLabel } from '@/lib/scores';
import type { AuditResult } from '@/types/audit';

/**
 * Page 1 — the headline: overall score, AI search visibility, and how the
 * other five sections look at a glance.
 *
 * Laid out for a 718px column so it prints 1:1 on A4 portrait.
 */
export default function ReportPageOne({ result }: { result: AuditResult }) {
  const m1 = result.module1_aeo_geo;

  const weights = [
    { label: 'On-Page Signals', value: m1.schema_score, weight: '40%' },
    { label: 'Perplexity (AI Citations)', value: m1.aeo_score, weight: '30%' },
    { label: 'Google AI Overviews', value: m1.geo_score, weight: '30%' },
  ];

  const glance = [
    { label: 'Website Health', score: result.module2_website_health.website_score },
    { label: 'SEO & Search', score: result.module3_seo.seo_score },
    { label: 'Reputation', score: result.module4_reputation.reputation_score },
    { label: 'Competitors', score: result.module5_competitors.competitor_score },
    { label: 'Social Presence', score: result.module6_social.social_score },
  ];

  return (
    <div className="ow-report-page rounded-[10px] border border-border bg-ink p-8">
      <div className="ow-report-scale mx-auto">
        {/* ---- Masthead ---- */}
        <div className="mb-7 flex items-center justify-between border-b border-border pb-5">
          <Image
            src="/orbitworks-light.png"
            alt="Orbit Works"
            width={170}
            height={32}
            priority
            className="h-8 w-auto"
          />
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-brand">
              AI Visibility Report
            </div>
            <div className="mt-1 font-display text-[15px] font-extrabold leading-tight text-white">
              {result.business_name}
            </div>
            <div className="text-[10.5px] text-muted">{result.location}</div>
          </div>
        </div>

        {/* ---- Overall score ---- */}
        <div className="mb-7 flex flex-col items-center">
          <ScoreRing score={result.overall_score} size={190} showBadge={false} />
          <span
            className="mt-3 rounded-[3px] border px-4 py-1 font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{
              color: scoreColor(result.overall_score),
              borderColor: `${scoreColor(result.overall_score)}55`,
              background: `${scoreColor(result.overall_score)}14`,
            }}
          >
            {scoreLabel(result.overall_score)}
          </span>
          <p className="mt-3 max-w-[340px] text-center text-[12px] leading-relaxed text-muted">
            Your overall digital presence score across 6 key visibility pillars.
          </p>
        </div>

        {/* ---- AI search visibility ---- */}
        <Panel className="mb-5 !p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-[19px] font-extrabold uppercase tracking-[-.02em] text-white">
                AI Search Visibility
              </h2>
              <p className="mt-1 text-[11.5px] leading-snug text-muted">
                How likely AI engines recommend your business in your category.
              </p>
            </div>
            <span className="shrink-0 rounded-[3px] border border-brand/40 bg-brand/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-100">
              50% Weight
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex shrink-0 flex-col items-center">
              <RadarChart score={m1.combined_score} size={150} />
              <span
                className="mt-1.5 rounded-[3px] border px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em]"
                style={{
                  color: scoreColor(m1.combined_score),
                  borderColor: `${scoreColor(m1.combined_score)}55`,
                  background: `${scoreColor(m1.combined_score)}14`,
                }}
              >
                {scoreLabel(m1.combined_score)}
              </span>
            </div>

            <div className="flex-1 space-y-3.5">
              {weights.map((w) => (
                <div key={w.label}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-semibold text-white/85">
                      {w.label}
                    </span>
                    <span className="flex items-baseline gap-1.5">
                      <span
                        className="font-display text-[15px] font-extrabold"
                        style={{ color: scoreColor(w.value) }}
                      >
                        {Math.round(w.value)}
                      </span>
                      <span className="text-[10px] text-muted">/100</span>
                      <span className="ml-1 font-mono text-[9.5px] text-faint">
                        {w.weight}
                      </span>
                    </span>
                  </div>
                  <div className="h-[6px] overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, w.value))}%`,
                        background: scoreColor(w.value),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* ---- At a glance ---- */}
        <Panel className="!p-5">
          <MicroHead>At a glance (the other 5 sections)</MicroHead>
          <div className="grid grid-cols-5 gap-3">
            {glance.map((g) => (
              <ScoreRing
                key={g.label}
                score={g.score}
                size={98}
                label={g.label}
                thickness={6}
              />
            ))}
          </div>
          <p className="mt-4 text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
            Each section is 10% of your overall score
          </p>
        </Panel>

        <PageFoot n={1} />
      </div>
    </div>
  );
}

export function PageFoot({ n }: { n: number }) {
  return (
    <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
        Orbit Works &middot; orb-itworks.com
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
        Page {n} of 3
      </span>
    </div>
  );
}
