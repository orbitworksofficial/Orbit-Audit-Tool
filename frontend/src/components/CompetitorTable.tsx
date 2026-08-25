import type { Module5Competitors } from '@/types/audit';

/**
 * The brief calls for a table with ahead/behind indicators, explicitly not a
 * chart.
 */
export default function CompetitorTable({
  data,
  businessUrl,
}: {
  data: Module5Competitors;
  businessUrl: string;
}) {
  const m = data.metrics_comparison;
  const rows = Object.entries(data.competitor_metrics ?? {});

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));

  const yourDomain = businessUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.08]">
            <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Domain
            </th>
            <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Authority
            </th>
            <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Traffic
            </th>
            <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Backlinks
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-brand/15 bg-brand/[0.04]">
            <td className="py-3.5 text-[13px] font-semibold text-brand-100">
              {yourDomain} <span className="text-[11px] text-muted">(you)</span>
            </td>
            <td className="py-3.5 font-display text-[13px]">
              {m.business_domain_authority}
            </td>
            <td className="py-3.5 font-display text-[13px]">
              {fmt(m.business_traffic)}
            </td>
            <td className="py-3.5 font-display text-[13px]">
              {fmt(m.business_backlinks)}
            </td>
          </tr>

          {rows
            .filter(([d]) => d.toLowerCase() !== yourDomain)
            .map(([domain, mets]) => {
              const ahead = data.where_ahead.includes(domain);
              return (
                <tr key={domain} className="border-b border-white/[0.05]">
                  <td className="py-3.5 text-[13px] text-white/80">
                    <span className="flex items-center gap-2">
                      <span
                        className={
                          ahead
                            ? 'text-[11px] text-success'
                            : 'text-[11px] text-brand'
                        }
                      >
                        {ahead ? '▼' : '▲'}
                      </span>
                      {domain}
                    </span>
                  </td>
                  <td className="py-3.5 font-display text-[13px] text-muted">
                    {mets.domain_authority}
                  </td>
                  <td className="py-3.5 font-display text-[13px] text-muted">
                    {fmt(mets.traffic)}
                  </td>
                  <td className="py-3.5 font-display text-[13px] text-muted">
                    {fmt(mets.backlinks)}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">
        <span className="text-success">▼</span> you lead &nbsp;·&nbsp;
        <span className="text-brand">▲</span> they lead &nbsp;·&nbsp; median of
        top {rows.length} competitors: DA {m.average_domain_authority}, traffic{' '}
        {fmt(m.average_traffic)}, backlinks {fmt(m.average_backlinks)}
      </p>
    </div>
  );
}
