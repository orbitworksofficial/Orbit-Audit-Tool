import Link from 'next/link';
import Logo from './Logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/scan', label: 'Free AI scan' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/#how', label: 'What we check' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of service' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo height={26} />
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              We make businesses visible inside AI search results &mdash; cited
              by name in ChatGPT, Perplexity and Google AI Overviews.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-muted transition hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
          <span className="text-[12px] text-muted">
            &copy; {new Date().getFullYear()} Orbit Works LLC. All rights
            reserved.
          </span>
          <span className="flex items-center gap-2 text-[12px] text-muted">
            <span className="h-1.5 w-1.5 animate-dot rounded-full bg-brand" />
            AEO &middot; GEO &middot; SEO
          </span>
        </div>
      </div>
    </footer>
  );
}
