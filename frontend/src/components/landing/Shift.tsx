'use client';

import Reveal from './Reveal';
import { useCountUp, useReveal } from './hooks';

export default function Shift() {
  const split = useReveal<HTMLDivElement>(0.35);

  return (
    <section
      id="shift"
      className="relative overflow-hidden bg-ink px-5 py-[clamp(84px,10vw,140px)] sm:px-6"
    >
      <div
        className="pointer-events-none absolute -right-36 top-[20%] h-[520px] w-[520px] blur-[24px]"
        style={{
          background:
            'radial-gradient(circle, rgba(243,18,78,.10), transparent 65%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <p className="ow-eyebrow mb-[clamp(32px,4vw,48px)]">
            The shift happening right now
          </p>
        </Reveal>

        <Reveal delay={90}>
          <div
            ref={split.ref}
            className="grid overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.06] md:grid-cols-2"
            style={{ gap: 1 }}
          >
            {/* Traditional search */}
            <div className="bg-[rgba(14,20,36,.7)] p-7">
              <span className="mb-5 inline-block rounded-md bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                Traditional search
              </span>
              <div
                className="flex flex-col gap-4 transition-[opacity,filter] duration-[1600ms]"
                style={{
                  opacity: split.shown ? 0.22 : 1,
                  filter: split.shown ? 'blur(1px)' : 'none',
                }}
              >
                <SerpRow
                  domain="yourcompetitor.com"
                  title="Best [service] provider — Competitor A"
                  desc="Leading provider of quality services. Trusted by hundreds of clients across the region…"
                />
                <SerpRow
                  domain="anothercompetitor.com"
                  title="Professional [service] — Competitor B"
                  desc="Award-winning team with a proven track record. Get a free consultation today…"
                />
                <SerpRow
                  domain="yourbusiness.com"
                  title="[Your business] — position 4"
                  desc="Rarely seen. Rarely clicked. Most users never scroll this far."
                  dim
                />
              </div>
            </div>

            {/* AI search */}
            <div
              className="relative overflow-hidden p-7 transition-colors duration-[1600ms]"
              style={{
                background: split.shown
                  ? 'rgba(0,22,44,.92)'
                  : 'rgba(7,11,20,.85)',
              }}
            >
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-[1600ms]"
                style={{
                  background:
                    'radial-gradient(circle, rgba(243,18,78,.14), transparent 70%)',
                  opacity: split.shown ? 1 : 0,
                }}
              />
              <span className="relative mb-5 inline-block rounded-md bg-brand/[0.12] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-100">
                AI search &mdash; the new reality
              </span>
              <div className="relative rounded-[14px] border border-brand/20 bg-[rgba(0,30,60,.45)] p-5 shadow-[0_18px_50px_rgba(0,0,0,.4)]">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-100">
                  <span className="inline-block h-2 w-2 rotate-45 border border-brand" />
                  AI-generated answer
                </div>
                <p className="text-[12.5px] leading-[1.85] text-white/75">
                  Based on online presence, reviews, and AI visibility signals, I
                  recommend{' '}
                  <span className="font-semibold text-brand-100">Competitor A</span>{' '}
                  as the top option in your area. They have strong digital
                  authority and consistent mentions across AI search platforms.
                  For a reliable alternative,{' '}
                  <span className="font-semibold text-brand-100">Competitor B</span>{' '}
                  also ranks well.
                </p>
                <p className="mt-4 text-[11.5px] text-brand">
                  Your business was not cited in this response.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-[clamp(44px,6vw,68px)] grid gap-6 sm:grid-cols-3">
            <BigStat target={60} suffix="%" label="of searches now end with an AI answer — no click to any website" />
            <BigStat target={2.5} suffix="B" label="daily queries on ChatGPT alone — most are business searches" />
            <BigStat target={55} suffix="%" label="of Google searches now show an AI Overview above all results" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SerpRow({
  domain,
  title,
  desc,
  dim,
}: {
  domain: string;
  title: string;
  desc: string;
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[11px]"
        style={{ color: dim ? 'rgba(16,185,129,.4)' : '#61e2a2' }}
      >
        {domain}
      </span>
      <span
        className="text-[13.5px] font-medium"
        style={{ color: dim ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.85)' }}
      >
        {title}
      </span>
      <span
        className="text-[11.5px] leading-relaxed"
        style={{ color: dim ? 'rgba(255,255,255,.2)' : '#8B91A3' }}
      >
        {desc}
      </span>
    </div>
  );
}

function BigStat({
  target,
  suffix,
  label,
}: {
  target: number;
  suffix: string;
  label: string;
}) {
  const { ref, value } = useCountUp(target);
  const decimals = String(target).includes('.') ? 1 : 0;

  return (
    <div className="text-center">
      <span className="block ow-display-sm">
        <span ref={ref}>{value.toFixed(decimals)}</span>
        <span className="text-brand">{suffix}</span>
      </span>
      <span className="mx-auto mt-3 block max-w-[210px] text-[13px] leading-snug text-muted">
        {label}
      </span>
    </div>
  );
}
