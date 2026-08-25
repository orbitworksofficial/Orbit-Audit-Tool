import Link from 'next/link';
import Reveal from './Reveal';

/**
 * The six checks, as a shared-hairline grid. This replaces the long marketing
 * sections — the full pitch lives on the separate landing page, so the tool
 * page only needs to say what the scan covers.
 */
const CHECKS = [
  {
    n: '01',
    title: 'AI visibility',
    weight: '50%',
    body: 'Whether ChatGPT, Perplexity and Google AI name you when asked for a recommendation.',
  },
  {
    n: '02',
    title: 'Website health',
    weight: '10%',
    body: 'Core Web Vitals, accessibility and performance, measured by Google PageSpeed.',
  },
  {
    n: '03',
    title: 'SEO',
    weight: '10%',
    body: 'Domain authority, backlinks and organic traffic against category benchmarks.',
  },
  {
    n: '04',
    title: 'Reputation',
    weight: '10%',
    body: 'Star rating, review volume and how complete your business profile is.',
  },
  {
    n: '05',
    title: 'Competitors',
    weight: '10%',
    body: 'Your authority against the median of the top five in your category.',
  },
  {
    n: '06',
    title: 'Social',
    weight: '10%',
    body: 'Which platforms you are on, and whether those profiles are still active.',
  },
];

export default function WhatWeCheck() {
  return (
    <section id="how" className="ow-section relative bg-ink">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <span className="ow-eyebrow mb-5">02 / WHAT WE CHECK</span>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="ow-display-sm mb-4">
            <span className="block text-white">Six checks.</span>
            <span className="ow-accent-line">One score.</span>
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <p className="mb-12 max-w-lg text-[15px] leading-relaxed text-muted">
            Every score comes with the exact reason behind it &mdash; not just a
            number, but which checks failed and what to do about them.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="ow-grid sm:grid-cols-2 lg:grid-cols-3">
            {CHECKS.map((c) => (
              <div key={c.n} className="ow-grid-card">
                <span className="ow-index">{c.n}</span>
                <div className="mb-2 flex items-baseline gap-2.5">
                  <h3 className="font-display text-[17px] font-extrabold tracking-[-.03em] text-white">
                    {c.title}
                  </h3>
                  <span className="font-mono text-[10px] tracking-[0.12em] text-brand">
                    {c.weight}
                  </span>
                </div>
                <p className="max-w-[34ch] text-[12.5px] leading-relaxed text-muted">
                  {c.body}
                </p>
                <span className="ow-arrow">&rarr;</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={400}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/scan" className="ow-btn">
              <span className="relative">SCAN MY BUSINESS</span>
            </Link>
            <span className="ow-mono">NO ACCOUNT &middot; NO CARD &middot; 60 SECONDS</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
