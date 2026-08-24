'use client';

import { scoreColor, scoreLabel } from '@/lib/scores';

/**
 * Circular gauge. Drawn with inline SVG rather than Chart.js — a single arc
 * does not justify a chart instance per score, and this stays crisp at any size.
 */
export default function ScoreGauge({
  score,
  label,
  weight,
  size = 132,
}: {
  score: number;
  label: string;
  weight?: string;
  size?: number;
}) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const color = scoreColor(clamped);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,.07)"
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
            style={{
              transition: 'stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)',
              filter: `drop-shadow(0 0 6px ${color}55)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[26px] font-bold leading-none">
            {Math.round(clamped)}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">
            /100
          </span>
        </div>
      </div>

      <span className="mt-3 font-display text-[13.5px] font-semibold">
        {label}
      </span>
      <span className="mt-1 text-[11px]" style={{ color }}>
        {scoreLabel(clamped)}
      </span>
      {weight && (
        <span className="mt-0.5 text-[10.5px] text-faint">{weight} of total</span>
      )}
    </div>
  );
}
