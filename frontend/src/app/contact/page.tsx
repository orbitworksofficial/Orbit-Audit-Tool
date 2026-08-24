import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/landing/Reveal';

export const metadata = {
  title: 'Contact — Orbit Works',
  description: 'Book a strategy call or send us a note.',
};

export default async function ContactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <main className="relative overflow-hidden px-5 pb-24 pt-36 sm:px-6">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[860px] max-w-[95vw] -translate-x-1/2 animate-aurora blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at 42% 30%, rgba(243,18,78,.12), transparent 60%), radial-gradient(ellipse at 62% 55%, rgba(0,212,255,.11), transparent 62%)',
          }}
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-brand">
              Contact
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-4 text-balance font-display text-[clamp(28px,4.6vw,46px)] font-bold leading-[1.12] tracking-[-.03em]">
              Book a free 15-minute strategy call
            </h1>
          </Reveal>

          <Reveal delay={170}>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted">
              We will walk through your audit, tell you which gap costs you the
              most, and what fixing it involves. No pressure, no deck.
            </p>
          </Reveal>

          <Reveal delay={230}>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
              <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-6">
                <h2 className="font-display text-[15px] font-semibold">
                  Run the audit first
                </h2>
                <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
                  Calls are far more useful when we can both see your numbers.
                  It takes about a minute.
                </p>
                <Link
                  href="/scan"
                  className="mt-4 inline-block text-[13px] text-cyan transition hover:text-cyan-soft"
                >
                  Run a free scan &rarr;
                </Link>
              </div>

              <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-6">
                <h2 className="font-display text-[15px] font-semibold">
                  Prefer email?
                </h2>
                <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
                  Send us your website and what you are trying to fix. We
                  usually reply within one business day.
                </p>
                <a
                  href="mailto:hello@orb-itworks.com"
                  className="mt-4 inline-block text-[13px] text-cyan transition hover:text-cyan-soft"
                >
                  hello@orb-itworks.com &rarr;
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={300}>
            {/*
              Booking link is a placeholder until the real scheduler URL is
              provided. Swap the href for the Calendly/Cal.com link.
            */}
            <a
              href="mailto:hello@orb-itworks.com?subject=Strategy%20call"
              className="ow-btn mt-10 inline-block animate-glow !px-9 !py-[17px]"
            >
              <span className="absolute left-0 top-0 h-full w-[38%] animate-sweep bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <span className="relative">Request a strategy call</span>
            </a>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
