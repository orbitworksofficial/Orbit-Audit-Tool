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

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-24 pt-32 sm:px-6"
    >
      <RadarCanvas />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,.028) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage:
            'radial-gradient(ellipse 90% 70% at 50% 45%, #000 35%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 70% at 50% 45%, #000 35%, transparent 100%)',
        }}
      />

      {/* Aurora */}
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] z-[1] h-[70vw] max-h-[900px] w-[70vw] max-w-[900px] -translate-x-1/2 -translate-y-1/2 animate-aurora blur-[30px]"
        style={{
          background:
            'radial-gradient(circle at 38% 40%, rgba(243,18,78,.20), transparent 58%), radial-gradient(circle at 66% 62%, rgba(0,212,255,.16), transparent 60%)',
        }}
      />

      <div className="relative z-[5] grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Copy */}
        <div className="flex max-w-xl flex-col items-start">
          <Reveal>
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/[0.05] px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-cyan">
              <span className="h-1.5 w-1.5 animate-dot rounded-full bg-cyan" />
              AEO + GEO agency &mdash; 2026
            </span>
          </Reveal>

          <h1 className="font-display text-[clamp(29px,5.5vw,50px)] font-bold leading-[1.1] tracking-[-.035em]">
            <span className="block text-white">Be the answer,</span>
            <span className="animate-shift bg-gradient-to-r from-brand via-cyan to-brand bg-[length:200%_auto] bg-clip-text text-transparent">
              {typed}
            </span>
            <span className="ml-0.5 inline-block h-[0.82em] w-[2.5px] animate-pulse bg-brand align-[-.08em] shadow-[0_0_14px_rgba(243,18,78,.8)]" />
          </h1>

          <Reveal delay={520}>
            <p className="mt-5 max-w-md text-[clamp(14.5px,1.6vw,16.5px)] leading-[1.75] text-muted">
              Your clients now ask ChatGPT, Perplexity and Google AI who to
              hire. We put your business{' '}
              <em className="font-semibold not-italic text-white">
                inside those answers
              </em>{' '}
              &mdash; cited by name, in 60 days.
            </p>
          </Reveal>

          <Reveal delay={640}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/scan" className="ow-btn animate-glow">
                <span className="absolute left-0 top-0 h-full w-[38%] animate-sweep bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                <span className="relative">Scan my business free</span>
              </Link>
              <Link href="/#shift" className="ow-btn-ghost">
                See what changed &rarr;
              </Link>
            </div>
          </Reveal>

          <Reveal delay={760}>
            <div className="mt-9 flex w-full max-w-md flex-wrap gap-7 border-t border-white/[0.07] pt-5">
              <Stat value="60%" label="searches end without a click" />
              <Stat value="3×" label="avg. lift in inbound enquiries" />
              <Stat value="60d" label="to measurable AI visibility" />
            </div>
          </Reveal>
        </div>

        {/* Mock AI answer */}
        <Reveal delay={380} className="relative w-full max-w-md justify-self-center">
          <div
            className="pointer-events-none absolute -inset-3.5 rounded-[26px] blur-[26px]"
            style={{
              background:
                'linear-gradient(140deg, rgba(0,212,255,.18), rgba(243,18,78,.16))',
            }}
          />
          <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-[rgba(16,24,44,.95)] to-[rgba(9,13,26,.95)] shadow-[0_34px_90px_rgba(0,0,0,.6)] backdrop-blur-xl">
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />

            <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4.5 py-3.5">
              <span className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
                <span className="h-2 w-2 rounded-full bg-[#28C840]" />
              </span>
              <span className="ml-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                AI answer &mdash; live
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[10.5px] text-cyan">
                <span className="h-1.5 w-1.5 animate-dot rounded-full bg-cyan" />
                cited
              </span>
            </div>

            <div className="p-4.5">
              <div className="min-h-[38px] rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 font-mono text-[11.5px] text-white/60">
                {query}
                <span className="ml-0.5 inline-block h-[11px] w-1.5 animate-pulse bg-cyan align-middle" />
              </div>

              <p className="mt-4 text-[12.5px] leading-[1.9] text-white/75">
                Three providers stand out in your area.{' '}
                <span className="rounded-[5px] bg-gradient-to-r from-cyan/20 to-cyan/[0.06] px-1.5 py-0.5 font-semibold text-white shadow-[0_0_0_1px_rgba(0,212,255,.3)]">
                  Your Business
                </span>{' '}
                is the most consistently recommended, with verified reviews,
                strong entity signals and citations across multiple sources.
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Chip active>yourbusiness.com</Chip>
                <Chip>reviews</Chip>
                <Chip>local directory</Chip>
              </div>
            </div>

            <div className="flex items-center gap-3.5 border-t border-white/[0.07] bg-white/[0.02] px-4.5 py-4">
              <span
                ref={scoreRef}
                className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#00D4FF ${(score * 3.6).toFixed(1)}deg, rgba(255,255,255,.07) 0deg)`,
                }}
              >
                <span className="absolute inset-[5px] flex items-center justify-center rounded-full bg-[#0A0F1E] font-display text-sm font-bold text-white">
                  {Math.round(score)}
                </span>
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-display text-[12.5px] font-semibold text-white">
                  AI visibility score
                </span>
                <span className="text-[11px] text-muted">
                  after 60 days with Orbit Works &mdash; up from 24
                </span>
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="font-display text-[19px] font-bold text-white">
        {value.slice(0, -1)}
        <span className="text-cyan">{value.slice(-1)}</span>
      </span>
      <span className="text-[11px] leading-snug text-muted">{label}</span>
    </span>
  );
}

function Chip({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10.5px] ${
        active
          ? 'border-cyan/25 bg-cyan/[0.06] text-cyan'
          : 'border-white/10 bg-white/[0.03] text-white/50'
      }`}
    >
      {children}
    </span>
  );
}
