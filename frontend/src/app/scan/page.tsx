import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ScanForm from '@/components/ScanForm';

export const metadata = {
  title: 'Free AI Visibility Scan — OrbitScanner',
  description:
    'Run a free audit across AEO, GEO, SEO, website health, reputation, competitors and social.',
};

const CHECKS = [
  'AEO + GEO score',
  'Website health',
  'SEO strength',
  'Reputation',
  'Competitor snapshot',
  'Social presence',
];

export default async function ScanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <main className="relative flex min-h-screen flex-col items-center px-5 pb-24 pt-32 sm:px-6">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] max-w-[95vw] -translate-x-1/2 animate-aurora blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at 40% 30%, rgba(243,18,78,.13), transparent 60%), radial-gradient(ellipse at 62% 55%, rgba(243,18,78,.12), transparent 62%)',
          }}
        />

        <div className="relative z-10 flex w-full flex-col items-center">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.05] px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-brand-100">
            <span className="h-1.5 w-1.5 animate-dot rounded-full bg-brand" />
            OrbitScanner &mdash; free audit
          </span>

          <h1 className="max-w-xl text-balance text-center font-display text-[clamp(28px,4.6vw,42px)] font-bold leading-[1.12] tracking-[-.03em]">
            Is your business visible where clients{' '}
            <span className="text-brand-100">actually search?</span>
          </h1>

          <p className="mt-4 max-w-md text-center text-[15px] leading-relaxed text-muted">
            We check six areas of your digital presence and show you exactly
            where you stand across AI search, traditional search and reputation.
          </p>

          <div className="mb-10 mt-6 flex flex-wrap justify-center gap-2">
            {CHECKS.map((c) => (
              <span
                key={c}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11.5px] text-muted"
              >
                {c}
              </span>
            ))}
          </div>

          <ScanForm />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
