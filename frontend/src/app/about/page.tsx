import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/landing/Reveal';

export const metadata = {
  title: 'About — Orbit Works',
  description:
    'We make businesses visible inside AI search results, cited by name in ChatGPT, Perplexity and Google AI Overviews.',
};

const BELIEFS = [
  {
    title: 'Measurement over promises',
    body: 'Every engagement starts with a scored audit and is tracked monthly. If visibility is not moving, you will see it in the numbers before we tell you.',
  },
  {
    title: 'The score reflects reality',
    body: 'A business with perfect meta tags but zero AI presence scores low, on purpose. On-page signals are worth 40 points; actual visibility in AI answers is worth 60.',
  },
  {
    title: 'All three territories, not one',
    body: 'SEO still matters. But AEO and GEO decide who gets recommended when the answer arrives without a list of links. We work across all three.',
  },
];

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <main className="relative overflow-hidden px-5 pb-24 pt-36 sm:px-6">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[880px] max-w-[95vw] -translate-x-1/2 animate-aurora blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at 45% 30%, rgba(243,18,78,.11), transparent 62%), radial-gradient(ellipse at 60% 55%, rgba(243,18,78,.10), transparent 64%)',
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-brand">
              About Orbit Works
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-4 text-balance font-display text-[clamp(28px,4.6vw,48px)] font-bold leading-[1.12] tracking-[-.03em]">
              Search changed. Most businesses have not noticed yet.
            </h1>
          </Reveal>

          <Reveal delay={170}>
            <div className="mt-7 space-y-5 text-[15px] leading-[1.8] text-muted">
              <p>
                For twenty years, being found online meant ranking in a list.
                You optimised, you climbed, people clicked. That model is
                quietly breaking. Around 60% of searches now end without a
                click, because the answer arrives before the links do.
              </p>
              <p>
                When someone asks an AI assistant who to hire, they get a short
                list of names &mdash; not ten blue links. Being on page one of
                Google does not put you on that list. Something else does:
                whether AI systems understand what your business is, trust the
                signals around it, and have reason to name it.
              </p>
              <p>
                That is the whole of our work. We audit whether AI engines
                currently cite you, fix the technical and authority gaps that
                keep you out, and track whether it worked &mdash; monthly, in
                numbers you can check yourself.
              </p>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <div className="mt-14 space-y-4">
              {BELIEFS.map((b) => (
                <div
                  key={b.title}
                  className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-6"
                >
                  <h2 className="font-display text-[15px] font-semibold">
                    {b.title}
                  </h2>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-14 rounded-[18px] border border-brand/[0.16] bg-brand/[0.04] p-8 text-center">
              <h2 className="font-display text-xl font-bold tracking-tight">
                See where you stand
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-muted">
                The audit is free and takes about a minute. You will know within
                the hour whether AI search is naming you or your competitors.
              </p>
              <Link href="/scan" className="ow-btn mt-6 inline-block">
                <span className="relative">Run a free scan</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
