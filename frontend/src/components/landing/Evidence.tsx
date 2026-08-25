'use client';

import Reveal from './Reveal';
import { useTilt } from './hooks';

const CARDS = [
  {
    platform: 'ChatGPT',
    query: 'Best digital agency in [your city]?',
    glow: 'rgba(243,18,78,.12)',
    lead: 'Here are some highly recommended agencies in the area:',
    hits: ['Vertex Digital — strong SEO and paid campaigns', 'Nova Creative Co. — excellent brand reputation'],
    miss: '[Your business?] — not appearing',
  },
  {
    platform: 'Perplexity',
    query: 'Top providers near me for [your category]',
    glow: 'rgba(243,18,78,.12)',
    lead: 'Based on current search data and citations:',
    hits: ['Apex Solutions consistently ranks as a top choice with a strong online presence and verified reviews…'],
    miss: '[Your business?] — no citations found',
  },
  {
    platform: 'Google AI Overview',
    query: 'best [service] business in [location]',
    glow: 'rgba(243,18,78,.12)',
    lead: 'AI-generated summary',
    hits: ['Leading businesses in this space include Summit Group and CoreBridge, both with strong local presence…'],
    miss: '[Your business?] — not cited',
  },
];

export default function Evidence() {
  return (
    <section
      id="evidence"
      className="relative overflow-hidden bg-panel px-5 py-[clamp(84px,10vw,140px)] sm:px-6"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-[-160px] h-[420px] w-[760px] max-w-[95vw] -translate-x-1/2 blur-[20px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(243,18,78,.10), transparent 70%)',
        }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center">
        <Reveal>
          <p className="ow-eyebrow mb-4">
            Where your next client is searching right now
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h2 className="text-balance text-center ow-display-sm">
            AI is already recommending businesses.
            <br />
            Is yours one of them?
          </h2>
        </Reveal>

        <Reveal delay={170}>
          <p className="mx-auto mb-[clamp(44px,6vw,64px)] mt-4 max-w-lg text-center text-base leading-relaxed text-muted">
            Right now, potential clients are asking AI tools who to hire in your
            category. Here is what they see.
          </p>
        </Reveal>

        <div className="grid w-full gap-4 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <EvidenceCard key={c.platform} card={c} delay={80 + i * 100} />
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-[clamp(40px,5vw,60px)] text-balance text-center font-display text-[clamp(17px,2.8vw,26px)] font-semibold leading-snug tracking-[-.02em]">
            This is where your clients are making decisions.{' '}
            <span className="text-brand">Your name is not there yet.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function EvidenceCard({
  card,
  delay,
}: {
  card: (typeof CARDS)[number];
  delay: number;
}) {
  const tilt = useTilt<HTMLDivElement>();

  return (
    <Reveal delay={delay}>
      <div
        ref={tilt}
        className="relative h-full overflow-hidden rounded-[18px] border border-white/[0.08] bg-gradient-to-b from-[rgba(18,27,48,.9)] to-[rgba(10,15,30,.85)] p-5 backdrop-blur transition-[border-color,box-shadow] duration-300 hover:border-brand/30 hover:shadow-[0_22px_60px_rgba(0,0,0,.55)]"
      >
        <span
          className="pointer-events-none absolute -right-12 -top-12 h-[150px] w-[150px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${card.glow}, transparent 70%)`,
          }}
        />

        <div className="mb-4 flex items-center gap-2.5 border-b border-white/[0.07] pb-3.5">
          <span className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <span className="h-2 w-2 rounded-full bg-[#28C840]" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {card.platform}
          </span>
        </div>

        <div className="mb-4 rounded-[9px] border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 font-mono text-[12px] text-white/60">
          {card.query}
        </div>

        <div className="text-[12.5px] leading-[1.85] text-white/70">
          <span className="text-white/40">{card.lead}</span>
          <ul className="mt-3 space-y-2">
            {card.hits.map((h) => (
              <li key={h}>
                <span className="rounded bg-brand/[0.09] px-1.5 py-0.5 font-semibold text-brand-100">
                  {h.split(' — ')[0]}
                </span>
                {h.includes(' — ') && (
                  <span className="text-white/60"> — {h.split(' — ')[1]}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3.5 border-t border-white/[0.06] pt-3.5">
            <span className="rounded bg-brand/[0.1] px-1.5 py-0.5 font-semibold text-brand line-through decoration-brand">
              {card.miss}
            </span>
          </p>
        </div>
      </div>
    </Reveal>
  );
}
