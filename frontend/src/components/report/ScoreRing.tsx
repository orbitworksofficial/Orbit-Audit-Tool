import { scoreColor, scoreLabel } from '@/lib/scores';

/**
 * Circular score ring with a glow, as used for the overall score and the
 * "at a glance" row. SVG so it prints crisply.
 */
export default function ScoreRing({
  score,
  size = 150,
  label,
  showBadge = true,
  thickness,
}: {
  score: number;
  size?: number;
  /** Caption under the ring. */
  label?: string;
  /** The CRITICAL / STRONG pill. */
  showBadge?: boolean;
  thickness?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = scoreColor(clamped);
  const stroke = thickness ?? Math.max(5, size * 0.055);
  const r = (size - stroke) / 2 - 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,.06)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
            style={{ filter: `drop-shadow(0 0 5px ${color}88)` }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-extrabold leading-none tracking-[-.05em] text-white"
            style={{ fontSize: size * 0.32 }}
          >
            {Math.round(clamped)}
          </span>
          <span
            className="text-muted"
            style={{ fontSize: size * 0.093, marginTop: size * 0.02 }}
          >
            /100
          </span>
        </div>
      </div>

      {label && (
        <span className="mt-2 text-center font-display text-[12px] font-bold text-white">
          {label}
        </span>
      )}

      {showBadge && (
        <span
          className="mt-1.5 rounded-[3px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]"
          style={{
            color,
            borderColor: `${color}55`,
            background: `${color}14`,
          }}
        >
          {scoreLabel(clamped).replace('Needs work', 'Needs work')}
        </span>
      )}
    </div>
  );
}
