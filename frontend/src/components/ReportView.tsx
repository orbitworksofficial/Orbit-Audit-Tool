'use client';

import Link from 'next/link';
import ScoreGauge from './ScoreGauge';
import AeoSection from './AeoSection';
import CompetitorTable from './CompetitorTable';
import DownloadPdfButton from './DownloadPdfButton';
import ScoreExplainer from './ScoreExplainer';
import type { AuditResult, AiAnalysis } from '@/types/audit';

export default function ReportView({
  result,
  ai,
  pdfUrl,
}: {
  result: AuditResult;
  ai?: AiAnalysis;
  pdfUrl?: string | null;
}) {
  const deep = ai?.deep_analysis;
  const m2 = result.module2_website_health;
  const m3 = result.module3_seo;
  const m4 = result.module4_reputation;
  const m5 = result.module5_competitors;
  const m6 = result.module6_social;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* Header */}
      <header className="ow-card p-7 sm:p-9">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent" />
        <div className="flex flex-wrap items-center justify-between gap-7">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand">
              AI visibility report
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
              {result.business_name}
            </h1>
            <p className="mt-2 text-[13.5px] text-muted">
              {result.website_url} &middot; {result.location}
            </p>

            <div className="no-print mt-6 flex flex-wrap items-start gap-3">
              {/*
                Printed by the visitor's browser rather than a server-side
                headless Chromium — see DownloadPdfButton. `pdfUrl` still
                works if you re-enable the Python endpoint.
              */}
              <DownloadPdfButton businessName={result.business_name} />
              <Link href="/scan" className="ow-btn-ghost">
                Run another scan
              </Link>
            </div>
          </div>

          <ScoreGauge
            score={result.overall_score}
            label="Overall score"
            size={158}
          />
        </div>

        {deep?.overall_summary && (
          <p className="mt-8 border-t border-white/[0.07] pt-6 text-[14px] leading-[1.75] text-white/75">
            {deep.overall_summary}
          </p>
        )}
      </header>

      {/* AEO/GEO carries 50% of the score, so it gets its own full section. */}
      <AeoSection data={result.module1_aeo_geo} />

      {/* Overview row, then a full breakdown of each score below. */}
      <section className="ow-card p-7 sm:p-9">
        <h2 className="mb-7 font-display text-lg font-semibold tracking-tight">
          The other five sections
          <span className="ml-2 text-[12px] font-normal text-muted">
            10% each
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-7 sm:grid-cols-3 lg:grid-cols-5">
          <ScoreGauge score={m2.website_score} label="Website health" size={104} />
          <ScoreGauge score={m3.seo_score} label="SEO" size={104} />
          <ScoreGauge score={m4.reputation_score} label="Reputation" size={104} />
          <ScoreGauge score={m5.competitor_score} label="Competitors" size={104} />
          <ScoreGauge score={m6.social_score} label="Social" size={104} />
        </div>
      </section>

      <h2 className="px-1 pt-3 font-display text-lg font-semibold tracking-tight">
        Why you scored what you scored
      </h2>

      <ScoreExplainer
        title="Website health"
        score={m2.website_score}
        weight="10%"
        formula="The average of your Performance, Accessibility, Best Practices and SEO scores from Google PageSpeed Insights. A further 10 points are deducted if mobile performance falls below the B2B average of 68."
        metrics={[
          { label: 'Performance', value: m2.performance, benchmark: '68 avg' },
          { label: 'Accessibility', value: m2.accessibility },
          { label: 'Best practices', value: m2.best_practices },
          { label: 'Mobile', value: m2.mobile_score, benchmark: '68 avg' },
          { label: 'Desktop', value: m2.desktop_score },
          { label: 'Largest paint (LCP)', value: `${m2.lcp}s` },
        ]}
        reasons={m2.top_3_issues}
        reasonsLabel="Issues found"
        insight={deep?.section_insights?.website}
      />

      <ScoreExplainer
        title="SEO and search visibility"
        score={m3.seo_score}
        weight="10%"
        formula="Your domain authority measured against a healthy benchmark of 30. Reaching 30 scores 100; half of that scores 50. Backlinks and traffic are reported as supporting evidence."
        metrics={[
          {
            label: 'Domain authority',
            value: m3.domain_authority,
            benchmark: '30 healthy',
          },
          {
            label: 'Backlinks',
            value: m3.backlink_count,
            benchmark: '50+ healthy',
          },
          {
            label: 'Organic traffic',
            value: `${m3.organic_traffic_estimate}/mo`,
            benchmark: '500+ healthy',
          },
        ]}
        reasons={m3.top_3_seo_gaps}
        reasonsLabel="What is holding this back"
        insight={deep?.section_insights?.seo}
      />

      <ScoreExplainer
        title="Reputation"
        score={m4.reputation_score}
        weight="10%"
        formula="Star rating contributes up to 50 points, review count up to 30 (capped at 100 reviews), and Google Business Profile completeness up to 20."
        metrics={[
          {
            label: 'Star rating',
            value: m4.star_rating,
            benchmark: '4.2 avg',
          },
          {
            label: 'Reviews',
            value: m4.review_count,
            benchmark: '100 for full marks',
          },
          {
            label: 'Profile completeness',
            value: `${m4.profile_completeness}%`,
          },
        ]}
        reasons={m4.top_2_gaps}
        reasonsLabel="What is missing"
        insight={deep?.section_insights?.reputation}
      />

      <ScoreExplainer
        title="Competitors"
        score={m5.competitor_score}
        weight="10%"
        formula="Your domain authority (40%), traffic (30%) and backlinks (30%) measured against the median of the top competitors in your category. Matching the median scores 75; beating it earns up to 100."
        metrics={[
          {
            label: 'Your authority',
            value: m5.metrics_comparison.business_domain_authority,
            benchmark: `${m5.metrics_comparison.average_domain_authority} median`,
          },
          {
            label: 'Your traffic',
            value: m5.metrics_comparison.business_traffic,
            benchmark: `${m5.metrics_comparison.average_traffic} median`,
          },
          {
            label: 'Your backlinks',
            value: m5.metrics_comparison.business_backlinks,
            benchmark: `${m5.metrics_comparison.average_backlinks} median`,
          },
          {
            label: 'Competitors ahead of you',
            value: m5.where_behind.length,
          },
        ]}
        reasons={
          m5.where_behind.length
            ? m5.where_behind.map(
                (c) => `${c} outranks you on most authority metrics.`
              )
            : []
        }
        reasonsLabel="Who is ahead"
        insight={deep?.section_insights?.competitors}
      />

      <ScoreExplainer
        title="Social presence"
        score={m6.social_score}
        weight="10%"
        formula="20 points for each active platform found (LinkedIn, Facebook, Instagram, YouTube, X), with deductions for profiles that have not posted in 90 days."
        metrics={[
          { label: 'Platforms found', value: m6.platforms_found.length },
          { label: 'Platforms missing', value: m6.platforms_missing.length },
          { label: 'Activity', value: m6.activity_level || 'Unknown' },
        ]}
        reasons={
          m6.platforms_missing.length
            ? [
                `No link found to: ${m6.platforms_missing.join(', ')}. Each missing platform costs 20 points.`,
              ]
            : []
        }
        reasonsLabel="What is missing"
        insight={deep?.section_insights?.social}
      />

      {deep?.critical_gaps?.length ? (
        <section className="ow-card p-7 sm:p-9">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand to-transparent" />
          <h2 className="mb-5 font-display text-lg font-semibold tracking-tight">
            Your 3 most critical gaps
          </h2>
          <ol className="space-y-3">
            {deep.critical_gaps.map((gap, i) => (
              <li
                key={i}
                className="flex gap-3.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 font-display text-[12px] font-bold text-brand">
                  {i + 1}
                </span>
                <span className="text-[13.5px] leading-relaxed text-white/80">
                  {gap}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="ow-card p-7 sm:p-9">
        <h2 className="mb-6 font-display text-lg font-semibold tracking-tight">
          How you compare
        </h2>
        <CompetitorTable data={m5} businessUrl={result.website_url} />
      </section>

      {/* Platform chips: the explainer states the count, this shows which. */}
      <section className="ow-card p-7 sm:p-9">
        <h3 className="mb-4 font-display text-[15px] font-semibold">
          Social platforms checked
        </h3>
        <div className="flex flex-wrap gap-2">
          {(m6.platforms_found ?? []).map((p) => (
            <span
              key={p}
              className="rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-1.5 text-[12px] text-emerald-400"
            >
              &#10003; {p}
            </span>
          ))}
          {(m6.platforms_missing ?? []).map((p) => (
            <span
              key={p}
              className="rounded-full border border-brand/20 bg-brand/[0.05] px-3 py-1.5 text-[12px] text-brand-soft"
            >
              &#10007; {p}
            </span>
          ))}
        </div>
        {m4.sentiment_summary && (
          <p className="mt-5 border-t border-white/[0.07] pt-4 text-[12.5px] leading-relaxed text-muted">
            <span className="font-semibold text-white/70">Reputation: </span>
            {m4.sentiment_summary}
          </p>
        )}
      </section>

      <section className="ow-card no-print p-9 text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(243,18,78,.13), transparent 68%)',
          }}
        />
        <h2 className="relative font-display text-2xl font-bold tracking-tight">
          Want help closing these gaps?
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">
          Fifteen minutes, no commitment. We will walk you through what to fix
          first and what it is worth.
        </p>
        <a href="#" className="ow-btn relative mt-7 inline-block animate-glow">
          <span className="absolute left-0 top-0 h-full w-[38%] animate-sweep bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <span className="relative">Book a free 15-minute consultation</span>
        </a>
      </section>
    </div>
  );
}
