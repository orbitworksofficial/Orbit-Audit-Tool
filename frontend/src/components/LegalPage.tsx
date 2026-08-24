import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

/**
 * Shared shell for privacy/terms. Content is passed in as children so each
 * page owns its own copy.
 */
export default function LegalPage({
  title,
  updated,
  signedIn,
  children,
}: {
  title: string;
  updated: string;
  signedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader signedIn={signedIn} />

      <main className="relative px-5 pb-24 pt-36 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-[clamp(26px,4vw,40px)] font-bold tracking-[-.03em]">
            {title}
          </h1>
          <p className="mt-3 text-[13px] text-muted">Last updated {updated}</p>

          <div className="mt-10 space-y-8">{children}</div>

          <p className="mt-14 rounded-[14px] border border-white/[0.07] bg-white/[0.02] px-5 py-4 text-[12.5px] leading-relaxed text-muted">
            This page is a plain-language summary prepared for the product. It
            is not legal advice &mdash; have counsel review it before you rely
            on it commercially.
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-[16px] font-semibold">{heading}</h2>
      <div className="space-y-3 text-[14px] leading-[1.8] text-muted">
        {children}
      </div>
    </section>
  );
}
