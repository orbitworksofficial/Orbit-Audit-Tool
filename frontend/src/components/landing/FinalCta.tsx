import Link from 'next/link';
import Reveal from './Reveal';

export default function FinalCta() {
  return (
    <section
      id="cta"
      className="relative flex min-h-[80svh] flex-col items-center justify-center overflow-hidden bg-ink px-5 py-[clamp(90px,10vw,140px)] text-center sm:px-6"
    >
      {/* Concentric pulse rings */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <span className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 animate-ring rounded-full border border-cyan/[0.08]" />
        <span
          className="absolute left-1/2 top-1/2 h-[540px] w-[540px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 animate-ring rounded-full border border-cyan/[0.07]"
          style={{ animationDelay: '.9s' }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-[760px] w-[760px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 animate-ring rounded-full border border-brand/[0.06]"
          style={{ animationDelay: '1.8s' }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-[680px] w-[680px] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 animate-aurora rounded-full blur-[20px]"
          style={{
            background:
              'radial-gradient(circle, rgba(243,18,78,.12), transparent 68%)',
          }}
        />
      </div>

      <div className="relative z-[3] flex max-w-3xl flex-col items-center">
        <Reveal>
          <h2 className="text-balance font-display text-[clamp(28px,5.6vw,62px)] font-bold leading-[1.1] tracking-[-.035em]">
            Is your business visible where your clients are{' '}
            <span className="text-brand">actually searching?</span>
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <p className="mx-auto mb-9 mt-6 max-w-md text-base leading-[1.7] text-muted">
            Fifteen minutes, no commitment. We will show you exactly where you
            stand across all three search territories &mdash; and what to do
            first.
          </p>
        </Reveal>

        <Reveal delay={220}>
          <Link
            href="/scan"
            className="ow-btn animate-glow !px-10 !py-[18px] !text-base"
          >
            <span className="absolute left-0 top-0 h-full w-[38%] animate-sweep bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <span className="relative">Run my free AI visibility scan</span>
          </Link>
        </Reveal>

        <Reveal delay={320}>
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            {[
              'No commitment required',
              '60 seconds, fully automated',
              'No card required',
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-2 text-xs text-white/40"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                {t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
