'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/#shift', label: 'The shift' },
  { href: '/#method', label: 'Method' },
  { href: '/#proof', label: 'Results' },
  { href: '/pricing', label: 'Pricing' },
];

export default function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 70);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-[200] transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(7,11,20,.82)' : 'rgba(7,11,20,0)',
        backdropFilter: scrolled ? 'blur(18px)' : 'blur(0px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,.07)' : 'transparent'}`,
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-brand to-brand-deep font-display text-[12px] font-bold text-white shadow-[0_6px_22px_rgba(243,18,78,.35)]">
            OW
          </span>
          <span className="font-display text-[14.5px] font-semibold tracking-tight text-white">
            Orbit<span className="text-brand">Works</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-[13px] text-muted transition hover:text-white"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href={signedIn ? '/dashboard' : '/login'}
            className="text-[13px] text-muted transition hover:text-white"
          >
            {signedIn ? 'Dashboard' : 'Sign in'}
          </Link>
          <Link href="/scan" className="ow-btn !px-5 !py-2.5 !text-[13px]">
            <span className="absolute left-0 top-0 h-full w-[40%] animate-sweep bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <span className="relative">Free scan</span>
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className="h-px w-5 bg-white transition"
            style={{ transform: open ? 'translateY(3px) rotate(45deg)' : 'none' }}
          />
          <span
            className="h-px w-5 bg-white transition"
            style={{ transform: open ? 'translateY(-3px) rotate(-45deg)' : 'none' }}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="border-t border-white/[0.07] bg-ink/95 px-5 py-5 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] text-muted transition hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href={signedIn ? '/dashboard' : '/login'}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[14px] text-muted transition hover:bg-white/5 hover:text-white"
            >
              {signedIn ? 'Dashboard' : 'Sign in'}
            </Link>
            <Link
              href="/scan"
              onClick={() => setOpen(false)}
              className="ow-btn mt-3 block text-center"
            >
              <span className="relative">Free scan</span>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
