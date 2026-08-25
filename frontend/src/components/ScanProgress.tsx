'use client';

import { useEffect, useState } from 'react';

/**
 * The brief requires an animated progress screen during the 30-60s backend
 * run, and explicitly forbids a blank screen. Python does not stream progress,
 * so these stages are time-based and deliberately never reach 100% until the
 * real response lands.
 */
const STAGES = [
  'Checking website health…',
  'Scanning AI visibility…',
  'Reading search signals…',
  'Analysing competitors…',
  'Checking reputation…',
  'Generating your report…',
];

export default function ScanProgress() {
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 8000);
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(stageTimer);
      clearInterval(tick);
    };
  }, []);

  // Approaches but never reaches 95% while waiting.
  const pct = Math.min(95, Math.round((1 - Math.exp(-elapsed / 22)) * 100));

  return (
    <div className="ow-card relative w-full max-w-lg p-8 text-center">
      <span className="absolute inset-x-0 top-0 h-0.5 animate-scan bg-gradient-to-r from-transparent via-brand-100 to-transparent opacity-70" />

      <div className="relative mx-auto mb-7 h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,.07)"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#f3124e"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 42}
            strokeDashoffset={2 * Math.PI * 42 * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset .6s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold">
          {pct}
          <span className="text-brand-100">%</span>
        </span>
      </div>

      <h2 className="font-display text-lg font-semibold tracking-tight">
        {STAGES[stage]}
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        We are running six live analyses against your business. This usually
        takes 30&ndash;60 seconds.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= stage ? 'w-8 bg-brand' : 'w-4 bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
