'use client';

import Reveal from './Reveal';
import { useTilt } from './hooks';

const STEPS = [
  {
    num: '01',
    title: 'Audit',
    body: 'We scan your business across all three territories and identify exactly where you are invisible — and where competitors are appearing.',
  },
  {
    num: '02',
    title: 'Optimise',
    body: 'Technical fixes and content restructuring that make your business readable, extractable, and trustworthy to AI search engines.',
  },
  {
    num: '03',
    title: 'Build authority',
    body: 'Entity consistency, citations, and external signals that tell AI models your business is a credible recommendation in your category.',
  },
  {
    num: '04',
    title: 'Monitor',
    body: 'Monthly AI visibility tracking across ChatGPT, Perplexity, and Google AI Overviews. You see exactly how visibility grows over time.',
  },
];

export default function Method() {
  return (
    <section
      id="method"
      className="relative overflow-hidden bg-panel px-5 py-[clamp(84px,10vw,140px)] sm:px-6"
    >
      <div className="relative mx-auto flex max-w-6xl flex-col items-center">
        <Reveal>
          <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.17em] text-brand">
            How we do it
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h2 className="text-center font-display text-[clamp(25px,4.2vw,44px)] font-bold leading-[1.15] tracking-[-.03em]">
            Four moves. Measurable AI visibility. 60 days.
          </h2>
        </Reveal>

        <Reveal delay={170}>
          <p className="mx-auto mb-[clamp(44px,6vw,66px)] mt-4 max-w-lg text-center text-base leading-relaxed text-muted">
            No vague strategy documents. No waiting twelve months to find out
            whether something worked.
          </p>
        </Reveal>

        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <StepCard key={s.num} step={s} delay={60 + i * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  delay,
}: {
  step: (typeof STEPS)[number];
  delay: number;
}) {
  const tilt = useTilt<HTMLDivElement>();

  return (
    <Reveal delay={delay}>
      <div
        ref={tilt}
        className="relative h-full overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-6 transition-[border-color,box-shadow] duration-300 hover:border-cyan/[0.28] hover:shadow-[0_22px_60px_rgba(0,0,0,.5)]"
      >
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan to-brand opacity-50" />
        <div className="mb-4 font-display text-[42px] font-bold leading-none text-cyan/20">
          {step.num}
        </div>
        <h3 className="mb-2 font-display text-base font-semibold">
          {step.title}
        </h3>
        <p className="text-[12.5px] leading-[1.7] text-muted">{step.body}</p>
      </div>
    </Reveal>
  );
}
