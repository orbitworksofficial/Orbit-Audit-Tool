import { scoreColor, scoreLabel } from '@/lib/scores';

/**
 * A score on its own ("SEO 3/100") tells the visitor nothing. This pairs every
 * score with how it was calculated and exactly which checks failed, using the
 * gap fields the Python modules already return — top_3_seo_gaps,
 * top_2_gaps, top_3_issues, platforms_missing, and so on.
 */
export default function ScoreExplainer({
  title,
  score,
  weight,
  formula,
  metrics,
  reasons,
  reasonsLabel = 'Why this score',
  insight,
}: {
  title: string;
  score: number;
  weight: string;
  /** Plain-language description of how the score is derived. */
  formula: string;
  /** The measured values behind the score. */
  metrics?: { label: string; value: string | number; benchmark?: string }[];
  /** The specific failing checks, straight from the Python modules. */
  reasons?: string[];
  reasonsLabel?: string;
  /** The AI's commentary for this section, if present. */
  insight?: string;
}) {
  const color = scoreColor(score);
  const clean = (reasons ?? []).filter(
    (r) => r && !/^no major .* detected\.?$/i.test(r)
  );
  const allClear = (reasons ?? []).length > 0 && clean.length === 0;

  return (
    <section className="ow-card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-[17px] font-semibold tracking-tight">
            {title}
          </h3>
          <p className="mt-1 text-[11.5px] text-muted">
            {weight} of your overall score
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-display text-[30px] font-bold leading-none"
              style={{ color }}
            >
              {Math.round(score)}
            </span>
            <span className="text-[13px] text-muted">/100</span>
          </div>
          <span className="text-[11px]" style={{ color }}>
            {scoreLabel(score)}
          </span>
        </div>
      </div>

      {/* Progress bar gives the number an immediate visual anchor. */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-1000"
          style={{
            width: `${Math.max(0, Math.min(100, score))}%`,
            background: color,
          }}
        />
      </div>

      <p className="mt-4 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[12px] leading-relaxed text-muted">
        <span className="font-semibold text-white/70">How it is scored: </span>
        {formula}
      </p>

      {metrics && metrics.length > 0 && (
        <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-1.5"
            >
              <dt className="text-[12.5px] text-muted">{m.label}</dt>
              <dd className="flex items-baseline gap-2">
                <span className="font-display text-[13px] font-semibold">
                  {typeof m.value === 'number'
                    ? m.value.toLocaleString()
                    : m.value}
                </span>
                {m.benchmark && (
                  <span className="text-[10.5px] text-faint">
                    vs {m.benchmark}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {clean.length > 0 && (
        <div className="mt-5">
          <h4 className="ow-label !mb-2.5">{reasonsLabel}</h4>
          <ul className="space-y-2">
            {clean.map((r, i) => (
              <li
                key={i}
                className="flex gap-2.5 rounded-lg border border-brand/[0.18] bg-brand/[0.05] px-3.5 py-2.5"
              >
                <span className="mt-px shrink-0 text-[13px] text-brand">
                  &#10007;
                </span>
                <span className="text-[12.5px] leading-relaxed text-white/75">
                  {r}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {allClear && (
        <p className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3.5 py-2.5 text-[12.5px] text-emerald-400">
          <span>&#10003;</span> No major issues detected in this section.
        </p>
      )}

      {insight && (
        <p className="mt-4 border-t border-white/[0.07] pt-4 text-[12.5px] leading-[1.75] text-muted">
          {insight}
        </p>
      )}
    </section>
  );
}
