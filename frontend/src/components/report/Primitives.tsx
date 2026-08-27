import { scoreColor, scoreLabel } from '@/lib/scores';

/**
 * The repeating pieces of the report layout: hex icon badges, bordered
 * panels, metric cells, and pass/fail lists.
 */

/** Hexagonal icon frame, the signature shape of this report. */
export function HexIcon({
  children,
  size = 44,
  tone = 'accent',
}: {
  children: React.ReactNode;
  size?: number;
  tone?: 'accent' | 'success' | 'muted';
}) {
  const color =
    tone === 'success' ? '#61e2a2' : tone === 'muted' ? '#9aa8bf' : '#f3124e';

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0"
        style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}
      >
        <polygon
          points="50,3 93,27 93,73 50,97 7,73 7,27"
          fill={`${color}14`}
          stroke={color}
          strokeWidth="4"
        />
      </svg>
      <span
        className="relative font-display font-bold"
        style={{ color, fontSize: size * 0.42 }}
      >
        {children}
      </span>
    </span>
  );
}

/** A bordered panel with the thin accent rule along its top edge. */
export function Panel({
  children,
  className = '',
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section
      className={`relative rounded-[6px] border p-4 ${
        glow
          ? 'border-brand/30 bg-brand/[0.03]'
          : 'border-border bg-white/[0.015]'
      } ${className}`}
    >
      {children}
    </section>
  );
}

/** Section heading: hex icon, title, subtitle, score on the right. */
export function PanelHead({
  icon,
  title,
  subtitle,
  score,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  score?: number;
}) {
  const color = score !== undefined ? scoreColor(score) : undefined;

  return (
    <div className="mb-3.5 flex items-start gap-3">
      <HexIcon size={40}>{icon}</HexIcon>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-[15px] font-extrabold uppercase tracking-[-.01em] text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-[11px] leading-snug text-muted">
            {subtitle}
          </p>
        )}
      </div>

      {score !== undefined && (
        <div className="shrink-0 text-right">
          <div className="flex items-baseline gap-1">
            <span
              className="font-display text-[26px] font-extrabold leading-none tracking-[-.04em]"
              style={{ color }}
            >
              {Math.round(score)}
            </span>
            <span className="text-[11px] text-muted">/100</span>
          </div>
          <span
            className="font-mono text-[9px] uppercase tracking-[0.12em]"
            style={{ color }}
          >
            {scoreLabel(score)}
          </span>
        </div>
      )}
    </div>
  );
}

/** A row of bordered metric cells, sharing hairlines. */
export function MetricRow({
  metrics,
}: {
  metrics: { label: string; value: string | number; note?: string }[];
}) {
  return (
    <div
      className="grid overflow-hidden rounded-[4px] border border-border"
      style={{
        gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
        gap: 1,
        background: '#263653',
      }}
    >
      {metrics.map((m) => (
        <div key={m.label} className="bg-ink px-2.5 py-2.5 text-center">
          <div className="text-[9.5px] uppercase tracking-[0.06em] text-muted">
            {m.label}
          </div>
          <div className="mt-1 font-display text-[17px] font-extrabold leading-none text-white">
            {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
          </div>
          {m.note && (
            <div className="mt-1 text-[9px] leading-tight text-faint">
              {m.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** A pass or fail line, as used for schema checks and issue lists. */
export function CheckLine({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-[1px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
          ok
            ? 'bg-success/15 text-success'
            : 'bg-brand/15 text-brand-100'
        }`}
      >
        {ok ? '✓' : '✕'}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] leading-tight text-white/85">
          {label}
        </span>
        {detail && (
          <span className="mt-0.5 block text-[9.5px] leading-snug text-muted">
            {detail}
          </span>
        )}
      </span>
    </li>
  );
}

/** Small heading above a list, in mono. */
export function MicroHead({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand">
      {children}
    </h4>
  );
}
