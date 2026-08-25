'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import RadarCanvas from './RadarCanvas';
import Reveal from './Reveal';
import { useCountUp, useTypewriter } from './hooks';

const ROTATING = [
  'not just another result.',
  'not page four of Google.',
  'not a link nobody clicks.',
];

export default function Hero() {
  const typed = useTypewriter(ROTATING);
  const { ref: scoreRef, value: score } = useCountUp(82);
  const [query, setQuery] = useState('');

  // Types the sample question into the mock AI console.
  useEffect(() => {
    const full = 'who should I hire for [your service] near me?';
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (i < full.length) {
        i += 1;
        setQuery(full.slice(0, i));
        timer = setTimeout(step, 38);
      }
    };
    timer = setTimeout(step, 700);
    return () => clearTimeout(timer);
  }, []);

  /*
   * One clean viewport: fixed nav at the top, ticker sitting on the bottom
   * edge, content optically centred between them.
   *
   * min-height is 100svh minus the ticker (~38px), so hero + ticker together
   * fill exactly one screen. svh rather than vh so mobile browser chrome does
   * not push the ticker out of view.
   *
   * Applied only at lg and up: below that the two columns stack and the
   * content is roughly 925px tall, which would overflow a short laptop and
   * push the ticker below the fold anyway. There the section simply sizes to
   * its content.
   */
  return (
    <section
      id="top"
      className="relative flex flex-col items-center justify-center overflow-hidden px-5 pb-14 pt-28 sm:px-6 lg:min-h-[calc(100svh-38px)]"
    >
      <RadarCanvas />
      <div className="ow-grid-overlay" />

      {/* Aurora */}
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] z-[1] h-[60vw] max-h-[720px] w-[60vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 animate-aurora blur-[30px]"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(243,18,78,.18), transparent 60%)',
        }}
      />

      <div className="relative z-[5] grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Copy */}
        <div className="flex max-w-xl flex-col items-start">
          <Reveal>
            <span className="ow-eyebrow mb-5">
              <span className="h-1.5 w-1.5 animate-dot rounded-full bg-success" />
              FREE AI VISIBILITY SCAN
            </span>
          </Reveal>

          {/*
            Two-tone display heading: first line white, second in the accent.
            A span, never a gradient.
          */}
          <h1 className="ow-display-sm">
            <span className="block text-white">Be the answer,</span>
            <span className="ow-accent-line">
              {typed}
              <span className="ml-1 inline-block h-[0.7em] w-[3px] animate-pulse bg-brand align-baseline" />
            </span>
          </h1>

          <Reveal delay={200}>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              See whether ChatGPT, Perplexity and Google AI recommend your
              business &mdash; or your competitors. Six checks, 60 seconds, no
              account needed.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/scan" className="ow-btn">
                <span className="relative">RUN MY FREE SCAN</span>
              </Link>
              <Link href="#how" className="ow-btn-ghost">
                HOW IT WORKS
              </Link>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-8 flex w-full max-w-md flex-wrap gap-8 border-t border-border pt-5">
              <Stat value="60" unit="s" label="to your full report" />
              <Stat value="6" unit="" label="areas analysed" />
              <Stat value="0" unit="$" label="cost, no card" />
            </div>
          </Reveal>
        </div>

        {/* Mock AI answer */}
        <Reveal delay={250} className="relative w-full max-w-md justify-self-center">
          <div
            className="pointer-events-none absolute -inset-3 blur-[26px]"
            style={{
              background:
                'linear-gradient(140deg, rgba(243,18,78,.16), transparent 70%)',
            }}
          />
          <div className="ow-surface relative overflow-hidden shadow-[0_34px_90px_rgba(0,0,0,.6)]">
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />

            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <span className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
                <span className="h-2 w-2 rounded-full bg-[#28C840]" />
              </span>
              <span className="ow-mono !text-[10px]">AI ANSWER &mdash; LIVE</span>
              <span className="ml-auto flex items-center gap-1.5 text-[10.5px] text-success">
                <span className="h-1.5 w-1.5 animate-dot rounded-full bg-success" />
                cited
              </span>
            </div>

            <div className="p-4">
              <div className="min-h-[36px] border border-border bg-white/[0.03] px-3.5 py-2.5 font-mono text-[11.5px] text-white/60">
                {query}
                <span className="ml-0.5 inline-block h-[11px] w-1.5 animate-pulse bg-brand align-middle" />
              </div>

              <p className="mt-4 text-[12.5px] leading-[1.9] text-white/75">
                Three providers stand out in your area.{' '}
                <span className="bg-brand/20 px-1.5 py-0.5 font-semibold text-white shadow-[0_0_0_1px_rgba(243,18,78,.4)]">
                  Your Business
                </span>{' '}
                is the most consistently recommended, with verified reviews and
                strong entity signals.
              </p>
            </div>

            <div className="flex items-center gap-3.5 border-t border-border bg-white/[0.02] px-4 py-4">
              <span
                ref={scoreRef}
                className="relative flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#61e2a2 ${(score * 3.6).toFixed(1)}deg, rgba(255,255,255,.07) 0deg)`,
                }}
              >
                <span className="absolute inset-[5px] flex items-center justify-center rounded-full bg-card font-display text-sm font-extrabold text-white">
                  {Math.round(score)}
                </span>
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-display text-[12.5px] font-bold text-white">
                  AI visibility score
                </span>
                <span className="text-[11px] text-muted">
                  what yours could look like
                </span>
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <span className="flex flex-col gap-1">
      <span className="font-display text-[26px] font-extrabold leading-none tracking-[-.04em] text-white">
        {value}
        <span className="text-brand">{unit}</span>
      </span>
      <span className="text-[11px] leading-snug text-muted">{label}</span>
    </span>
  );
}
