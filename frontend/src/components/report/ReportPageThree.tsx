import { Panel, PanelHead, MetricRow, MicroHead, HexIcon } from './Primitives';
import { PageFoot } from './ReportPageOne';
import type { AuditResult } from '@/types/audit';

/** Drops the "no major issues" placeholder the Python modules emit. */
function realIssues(list: string[] | undefined): string[] {
  return (list ?? []).filter((r) => r && !/^no major .* detected\.?$/i.test(r));
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '');
}

/** Page 3 — the five 10%-weighted sections, then what to do next. */
export default function ReportPageThree({ result }: { result: AuditResult }) {
  const m2 = result.module2_website_health;
  const m3 = result.module3_seo;
  const m4 = result.module4_reputation;
  const m5 = result.module5_competitors;
  const m6 = result.module6_social;
  const cmp = m5.metrics_comparison;

  const focus = [
    { title: 'Fix on-page schema', body: 'Add LocalBusiness & FAQ markup.' },
    { title: 'Build authority', body: 'Increase backlinks & internal links.' },
    { title: 'Improve reputation', body: 'Complete profile, get reviews.' },
    { title: 'Beat competitors', body: 'Improve authority and traffic.' },
    { title: 'Be active on social', body: 'Post regularly on your channels.' },
  ];

  return (
    <div className="ow-report-page rounded-[10px] border border-border bg-ink p-8">
      <div className="ow-report-scale mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[18px] font-extrabold uppercase tracking-[-.02em] text-brand">
            Detailed Scores &amp; Insights
          </h2>
          <span className="rounded-[3px] border border-border bg-white/[0.03] px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
            10% weight each
          </span>
        </div>

        <div className="space-y-2.5">
          <Section
            icon="♥"
            title="Website Health"
            subtitle="The foundation of your website performance."
            score={m2.website_score}
            metrics={[
              { label: 'Performance', value: m2.performance, note: 'vs 68 avg' },
              { label: 'Accessibility', value: m2.accessibility },
              { label: 'Best Practices', value: m2.best_practices },
              { label: 'SEO', value: m2.seo, note: 'vs 68 avg' },
            ]}
            issuesLabel="Top issues"
            issues={realIssues(m2.top_3_issues)}
          />

          <Section
            icon="⌕"
            title="SEO & Search Visibility"
            subtitle="Your visibility on traditional search engines."
            score={m3.seo_score}
            metrics={[
              {
                label: 'Domain Authority',
                value: m3.domain_authority,
                note: 'vs 30 healthy',
              },
              {
                label: 'Backlinks',
                value: m3.backlink_count,
                note: 'vs 50+ healthy',
              },
              {
                label: 'Organic Traffic',
                value: `${fmt(m3.organic_traffic_estimate)}/mo`,
                note: 'vs 500+ healthy',
              },
            ]}
            issuesLabel="What's holding this back"
            issues={realIssues(m3.top_3_seo_gaps)}
          />

          <Section
            icon="★"
            title="Reputation"
            subtitle="Your local reputation & trust signals."
            score={m4.reputation_score}
            metrics={[
              {
                label: 'Star Rating',
                value: m4.star_rating.toFixed(1),
                note: 'vs 4.2 avg',
              },
              {
                label: 'Reviews',
                value: m4.review_count,
                note: 'vs 100 for full marks',
              },
              {
                label: 'Profile Complete',
                value: `${m4.profile_completeness}%`,
              },
            ]}
            issuesLabel="What's missing"
            issues={realIssues(m4.top_2_gaps)}
          />

          <Section
            icon="⚑"
            title="Competitors"
            subtitle="How you compare to top competitors."
            score={m5.competitor_score}
            metrics={[
              {
                label: 'Your Authority',
                value: cmp.business_domain_authority,
                note: `vs ${cmp.average_domain_authority} median`,
              },
              {
                label: 'Your Traffic',
                value: fmt(cmp.business_traffic),
                note: `vs ${fmt(cmp.average_traffic)} median`,
              },
              {
                label: 'Your Backlinks',
                value: fmt(cmp.business_backlinks),
                note: `vs ${fmt(cmp.average_backlinks)} median`,
              },
              { label: 'Ahead of You', value: m5.where_behind.length },
            ]}
            issuesLabel="Who is ahead"
            issues={m5.where_behind.slice(0, 3)}
            bullet="●"
          />

          <Section
            icon="⤳"
            title="Social Presence"
            subtitle="Your activity on social platforms."
            score={m6.social_score}
            metrics={[
              {
                label: 'Platforms Found',
                value: `${m6.platforms_found.length}/${
                  m6.platforms_found.length + m6.platforms_missing.length
                }`,
              },
              { label: 'Missing', value: m6.platforms_missing.length },
            ]}
            chips={{
              found: m6.platforms_found,
              missing: m6.platforms_missing,
            }}
          />
        </div>

        {/* ---- Next steps ---- */}
        <Panel glow className="mt-3 !p-4">
          <MicroHead>Focus areas to improve your score</MicroHead>
          <div className="grid grid-cols-5 gap-2">
            {focus.map((f, i) => (
              <div key={f.title} className="text-center">
                <HexIcon size={30}>{String(i + 1)}</HexIcon>
                <h4 className="mt-1.5 font-display text-[10.5px] font-bold leading-tight text-white">
                  {f.title}
                </h4>
                <p className="mt-1 text-[9px] leading-snug text-muted">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        {/* ---- CTA ---- */}
        <div className="mt-3 flex items-center justify-between gap-5 rounded-[6px] border border-brand/30 bg-brand/[0.04] p-4">
          <div className="flex items-center gap-3">
            <HexIcon size={40}>↗</HexIcon>
            <div>
              <h3 className="font-display text-[14px] font-extrabold uppercase leading-tight text-brand">
                Let&apos;s grow your visibility
              </h3>
              <p className="mt-0.5 text-[10.5px] leading-snug text-muted">
                Book a free strategy session and get a custom roadmap.
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[12px] font-semibold text-white">
              +1 (604) 256-2560
            </div>
            <div className="text-[11px] text-muted">hello@orb-itworks.com</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-brand-100">
              orb-itworks.com
            </div>
          </div>
        </div>

        <PageFoot n={3} />
      </div>
    </div>
  );
}

/** One 10%-weighted section: header, metrics, and its issue list. */
function Section({
  icon,
  title,
  subtitle,
  score,
  metrics,
  issues = [],
  issuesLabel,
  bullet = '✕',
  chips,
}: {
  icon: string;
  title: string;
  subtitle: string;
  score: number;
  metrics: { label: string; value: string | number; note?: string }[];
  issues?: string[];
  issuesLabel?: string;
  bullet?: string;
  chips?: { found: string[]; missing: string[] };
}) {
  return (
    <Panel className="!p-3.5">
      <PanelHead icon={icon} title={title} subtitle={subtitle} score={score} />

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <MetricRow metrics={metrics} />

        {issues.length > 0 && issuesLabel && (
          <div className="w-[220px]">
            <MicroHead>{issuesLabel}</MicroHead>
            <ul className="space-y-1">
              {issues.map((i) => (
                <li
                  key={i}
                  className="flex gap-1.5 text-[10px] leading-snug text-white/75"
                >
                  <span className="shrink-0 text-brand">{bullet}</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        )}

        {chips && (
          <div className="w-[220px]">
            <MicroHead>Platforms</MicroHead>
            <div className="flex flex-wrap gap-1">
              {chips.found.map((p) => (
                <span
                  key={p}
                  className="rounded-[3px] border border-success/25 bg-success/[0.06] px-1.5 py-0.5 text-[9px] text-success"
                >
                  {p}
                </span>
              ))}
              {chips.missing.map((p) => (
                <span
                  key={p}
                  className="rounded-[3px] border border-brand/20 bg-brand/[0.05] px-1.5 py-0.5 text-[9px] text-brand-100"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
