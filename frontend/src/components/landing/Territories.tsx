'use client';

import Reveal from './Reveal';
import { useTilt } from './hooks';

const CARDS = [
  {
    tag: 'Established',
    num: '01',
    title: 'SEO',
    sub: 'Search Engine Optimisation',
    body: 'You rank in a list of results. Clients scroll, then click.',
    chips: ['Google', 'Bing'],
    accent: null,
  },
  {
    tag: 'Growing fast',
    num: '02',
    title: 'AEO',
    sub: 'Answer Engine Optimisation',
    body: 'Your content becomes the direct answer. No link. No scroll. You are the answer.',
    chips: ['Google AI Overviews', 'Bing Copilot'],
    accent: 'cyan' as const,
  },
  {
    tag: 'The frontier',
    num: '03',
    title: 'GEO',
    sub: 'Generative Engine Optimisation',
    body: 'Your brand is recommended by name inside AI-generated responses.',
    chips: ['ChatGPT', 'Perplexity', 'Gemini', 'Claude'],
    accent: 'brand' as const,
  },
];

export default function Territories() {
  return (
    <section className="relative overflow-hidden bg-panel px-5 py-[clamp(84px,10vw,140px)] sm:px-6">
      <div className="relative mx-auto flex max-w-5xl flex-col items-center">
        <Reveal>
          <p className="mb-[clamp(48px,6vw,72px)] text-balance text-center font-display text-[clamp(21px,3.6vw,38px)] font-semibold leading-[1.45] tracking-[-.025em]">
            There are <em className="not-italic text-cyan">three ways</em> to be
            found online in 2026.
            <br />
            Most businesses are{' '}
            <strong className="font-semibold text-brand">
              only using one.
            </strong>
            <br />
            The ones winning right now are using all three.
          </p>
        </Reveal>

        <div className="grid w-full gap-4 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <TerritoryCard key={c.title} card={c} delay={60 + i * 100} />
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-[clamp(36px,4vw,52px)] max-w-xl rounded-[14px] border border-cyan/[0.14] bg-cyan/[0.03] px-6 py-5 text-center text-[13.5px] leading-relaxed text-muted">
            <strong className="font-semibold text-white">
              Most agencies only work on SEO.
            </strong>{' '}
            We are one of the first in the US to offer all three as a unified
            service &mdash; with a proprietary implementation process built for
            measurable results.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function TerritoryCard({
  card,
  delay,
}: {
  card: (typeof CARDS)[number];
  delay: number;
}) {
  const tilt = useTilt<HTMLDivElement>();
  const isCyan = card.accent === 'cyan';
  const isBrand = card.accent === 'brand';

  const border = isCyan
    ? 'border-cyan/25'
    : isBrand
      ? 'border-brand/25'
      : 'border-white/10';
  const bg = isCyan
    ? 'bg-gradient-to-b from-cyan/[0.07] to-cyan/[0.02]'
    : isBrand
      ? 'bg-gradient-to-b from-brand/[0.08] to-brand/[0.02]'
      : 'bg-white/[0.03]';
  const accentText = isCyan
    ? 'text-cyan'
    : isBrand
      ? 'text-brand'
      : 'text-white';

  return (
    <Reveal delay={delay}>
      <div
        ref={tilt}
        className={`relative h-full overflow-hidden rounded-[20px] border ${border} ${bg} p-7 text-center transition-shadow duration-300 hover:shadow-[0_24px_70px_rgba(0,0,0,.5)]`}
      >
        {card.accent && (
          <span
            className="pointer-events-none absolute left-1/2 top-[-60px] h-[160px] w-[200px] -translate-x-1/2 blur-lg"
            style={{
              background: `radial-gradient(ellipse, ${isCyan ? 'rgba(0,212,255,.22)' : 'rgba(243,18,78,.24)'}, transparent 70%)`,
            }}
          />
        )}

        <span
          className={`relative inline-block rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.13em] ${
            isCyan
              ? 'bg-cyan/[0.14] text-cyan'
              : isBrand
                ? 'bg-brand/[0.14] text-brand'
                : 'bg-white/[0.08] text-muted'
          }`}
        >
          {card.tag}
        </span>

        <div
          className={`relative mx-auto my-5 flex h-[46px] w-[46px] items-center justify-center rounded-full border font-display text-[13px] font-bold ${
            isCyan
              ? 'border-cyan/35 text-cyan'
              : isBrand
                ? 'border-brand/40 text-brand'
                : 'border-white/[0.16] text-white/50'
          }`}
        >
          {card.num}
        </div>

        <h3
          className={`relative font-display text-xl font-bold tracking-[-.01em] ${accentText}`}
        >
          {card.title}
        </h3>
        <p className="relative mb-3.5 mt-1.5 text-xs text-muted">{card.sub}</p>
        <p className="relative mb-4.5 text-[12.5px] leading-[1.7] text-muted">
          {card.body}
        </p>

        <div className="relative mt-4 flex flex-wrap justify-center gap-1.5">
          {card.chips.map((chip) => (
            <span
              key={chip}
              className={`rounded-full border px-2.5 py-1 text-[10.5px] ${
                isCyan
                  ? 'border-cyan/25 bg-cyan/[0.06] text-cyan'
                  : isBrand
                    ? 'border-brand/25 bg-brand/[0.06] text-brand-soft'
                    : 'border-white/10 bg-white/[0.04] text-white/50'
              }`}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
