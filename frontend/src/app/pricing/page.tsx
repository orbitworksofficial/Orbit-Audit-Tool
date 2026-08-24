import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/landing/Reveal';

export const metadata = {
  title: 'Pricing — Orbit Works',
  description:
    'The AI visibility audit is free. Engagements are scoped after your scan.',
};

const TIERS = [
  {
    name: 'Free scan',
    price: 'Free',
    note: 'No card required',
    body: 'The full six-section audit, scored and explained. Yours to keep whether or not we work together.',
    features: [
      'AEO + GEO visibility score',
      'Website health & Core Web Vitals',
      'SEO authority and backlinks',
      'Reputation snapshot',
      'Competitor comparison',
      'PDF export',
    ],
    cta: { href: '/scan', label: 'Run a free scan' },
    highlight: false,
  },
  {
    name: 'Implementation',
    price: 'Scoped',
    note: 'After your audit',
    body: 'We fix what the audit found. Technical work, content restructuring, and entity signals across all three territories.',
    features: [
      'Everything in the free scan',
      'Schema & structured data build-out',
      'Content restructured for extraction',
      'Entity consistency & citation building',
      'Monthly AI visibility tracking',
      'Direct line to your strategist',
    ],
    cta: { href: '/contact', label: 'Book a strategy call' },
    highlight: true,
  },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <main className="relative overflow-hidden px-5 pb-24 pt-36 sm:px-6">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] max-w-[95vw] -translate-x-1/2 animate-aurora blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at 40% 30%, rgba(0,212,255,.12), transparent 60%), radial-gradient(ellipse at 62% 55%, rgba(243,18,78,.11), transparent 62%)',
          }}
        />

        <div className="relative mx-auto max-w-5xl">
          <Reveal>
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.17em] text-brand">
              Pricing
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-4 text-balance text-center font-display text-[clamp(28px,4.6vw,48px)] font-bold leading-[1.12] tracking-[-.03em]">
              Start with the audit. Decide after.
            </h1>
          </Reveal>

          <Reveal delay={170}>
            <p className="mx-auto mb-14 mt-5 max-w-lg text-center text-base leading-relaxed text-muted">
              The scan is genuinely free and genuinely complete. We scope
              engagements only once we both know what needs fixing.
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2">
            {TIERS.map((tier, i) => (
              <Reveal key={tier.name} delay={60 + i * 110}>
                <div
                  className={`relative flex h-full flex-col overflow-hidden rounded-[20px] border p-8 ${
                    tier.highlight
                      ? 'border-cyan/25 bg-gradient-to-b from-cyan/[0.07] to-cyan/[0.02]'
                      : 'border-white/[0.08] bg-white/[0.03]'
                  }`}
                >
                  {tier.highlight && (
                    <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan to-brand" />
                  )}

                  <h2 className="font-display text-lg font-semibold">
                    {tier.name}
                  </h2>
                  <div className="mt-3 flex items-baseline gap-2.5">
                    <span className="font-display text-[38px] font-bold leading-none tracking-tight">
                      {tier.price}
                    </span>
                    <span className="text-[12px] text-muted">{tier.note}</span>
                  </div>

                  <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
                    {tier.body}
                  </p>

                  <ul className="my-7 flex-1 space-y-2.5">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-[13px] text-white/75"
                      >
                        <span className="mt-0.5 text-cyan">&#10003;</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.cta.href}
                    className={
                      tier.highlight
                        ? 'ow-btn text-center'
                        : 'ow-btn-ghost text-center'
                    }
                  >
                    <span className="relative">{tier.cta.label}</span>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={140}>
            <p className="mx-auto mt-12 max-w-xl rounded-[14px] border border-white/[0.07] bg-white/[0.02] px-6 py-5 text-center text-[13px] leading-relaxed text-muted">
              Every free account includes{' '}
              <strong className="font-semibold text-white">
                three complete scans
              </strong>{' '}
              so you can re-check after making changes, or benchmark against a
              competitor. Need more? Just ask.
            </p>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
