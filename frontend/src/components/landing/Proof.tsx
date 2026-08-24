'use client';

import Reveal from './Reveal';
import { useTilt } from './hooks';

const QUOTES = [
  {
    body: 'We had no idea our business wasn’t appearing in ChatGPT. After Orbit Works implemented AEO and GEO, enquiries started arriving from clients who said they found us through AI search. That channel didn’t exist for us before.',
    initials: 'JM',
    name: 'James M.',
    role: 'Professional Services, Baltimore MD',
    metric: '3.4×',
    metricLabel: 'increase in inbound enquiries within 60 days',
  },
  {
    body: 'Our competitors were appearing in Google AI Overviews and we weren’t. Orbit Works fixed it in under a month. We now appear in AI summaries for our top service keywords, and the lead quality is noticeably better.',
    initials: 'SR',
    name: 'Sarah R.',
    role: 'Healthcare Clinic, Austin TX',
    metric: '+67%',
    metricLabel: 'improvement in AI search visibility score',
  },
  {
    body: 'I asked ChatGPT to recommend IT companies in our area and our name came up. That had never happened before. Our AEO score went from 31 to 78 in 90 days.',
    initials: 'DK',
    name: 'David K.',
    role: 'Technology Company, Dallas TX',
    metric: '78/100',
    metricLabel: 'AEO visibility score — up from 31 in 90 days',
  },
];

const INDUSTRIES = [
  'Healthcare',
  'Professional Services',
  'Technology',
  'Real Estate',
  'E-Commerce',
  'Hospitality',
];

export default function Proof() {
  return (
    <section
      id="proof"
      className="relative overflow-hidden bg-panel px-5 py-[clamp(84px,10vw,140px)] sm:px-6"
    >
      <div className="relative mx-auto flex max-w-6xl flex-col items-center">
        <Reveal>
          <h2 className="mb-[clamp(40px,5vw,60px)] text-center font-display text-[clamp(23px,3.8vw,38px)] font-bold tracking-[-.03em]">
            Businesses already winning in AI search
          </h2>
        </Reveal>

        <div className="grid w-full gap-4 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <QuoteCard key={q.initials} quote={q} delay={60 + i * 100} />
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-[clamp(34px,4vw,48px)] flex flex-wrap justify-center gap-3 opacity-60">
            {INDUSTRIES.map((ind) => (
              <span
                key={ind}
                className="rounded-[9px] border border-white/[0.08] px-5 py-2.5 font-display text-[13px] font-semibold text-muted"
              >
                {ind}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function QuoteCard({
  quote,
  delay,
}: {
  quote: (typeof QUOTES)[number];
  delay: number;
}) {
  const tilt = useTilt<HTMLDivElement>();

  return (
    <Reveal delay={delay}>
      <div
        ref={tilt}
        className="flex h-full flex-col rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-6 transition-[border-color,box-shadow] duration-300 hover:border-cyan/[0.22] hover:shadow-[0_22px_60px_rgba(0,0,0,.5)]"
      >
        <p className="mb-5 flex-1 text-[13.5px] italic leading-[1.8] text-white/75">
          &ldquo;{quote.body}&rdquo;
        </p>

        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-brand font-display text-[13px] font-bold text-white">
            {quote.initials}
          </span>
          <span className="flex flex-col">
            <span className="text-[13px] font-semibold">{quote.name}</span>
            <span className="text-[11.5px] text-muted">{quote.role}</span>
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-t border-white/[0.07] pt-4">
          <span className="font-display text-xl font-bold text-cyan">
            {quote.metric}
          </span>
          <span className="text-[11.5px] leading-snug text-muted">
            {quote.metricLabel}
          </span>
        </div>
      </div>
    </Reveal>
  );
}
