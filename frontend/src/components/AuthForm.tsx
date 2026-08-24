'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Mode = 'signin' | 'signup';

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form) as Record<string, string>;

    const res = await fetch(`/api/auth/${isSignup ? 'signup' : 'signin'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }

    if (data.needsConfirmation) {
      setNotice('Check your email to confirm your account, then sign in.');
      return;
    }

    const next = new URLSearchParams(window.location.search).get('next');
    router.push(next || '/dashboard');
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-20">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] max-w-[90vw]
                   -translate-x-1/2 -translate-y-1/2 animate-aurora rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(243,18,78,.14), transparent 60%), radial-gradient(circle at 65% 60%, rgba(0,212,255,.12), transparent 62%)',
        }}
      />

      <div className="ow-card relative z-10 w-full max-w-md p-8">
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />

        <Link href="/" className="mb-7 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-brand to-brand-deep font-display text-[12px] font-bold">
            OW
          </span>
          <span className="font-display text-[14.5px] font-semibold tracking-tight">
            Orbit<span className="text-brand">Works</span>
          </span>
        </Link>

        <h1 className="font-display text-2xl font-bold tracking-tight">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {isSignup
            ? 'Free to start. No card required.'
            : 'Sign in to view your audit reports.'}
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          {isSignup && (
            <div>
              <label className="ow-label" htmlFor="full_name">
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                required
                autoComplete="name"
                className="ow-input"
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label className="ow-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="ow-input"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="ow-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="ow-input"
              placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-brand/25 bg-brand/[0.07] px-3.5 py-2.5 text-[13px] text-brand-soft">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg border border-cyan/25 bg-cyan/[0.06] px-3.5 py-2.5 text-[13px] text-cyan">
              {notice}
            </p>
          )}

          <button type="submit" disabled={pending} className="ow-btn w-full">
            <span className="relative">
              {pending
                ? 'Please wait…'
                : isSignup
                  ? 'Create account'
                  : 'Sign in'}
            </span>
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            href={isSignup ? '/login' : '/signup'}
            className="text-cyan hover:text-cyan-soft"
          >
            {isSignup ? 'Sign in' : 'Sign up free'}
          </Link>
        </p>
      </div>
    </main>
  );
}
