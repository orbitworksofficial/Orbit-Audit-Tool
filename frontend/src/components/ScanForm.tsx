'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ScanProgress from './ScanProgress';
import type { AuditResponse } from '@/types/audit';

type Phase = 'form' | 'running' | 'error';

export default function ScanForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhase('running');
    setError(null);

    const payload = Object.fromEntries(
      new FormData(e.currentTarget)
    ) as Record<string, string>;

    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as Partial<
      AuditResponse & { error: string; code: string; reportId: string }
    >;

    if (!res.ok) {
      setError(data.error ?? 'The scan failed. Please try again.');
      setPhase('error');
      return;
    }

    // No account needed — the report renders straight from the session.
    sessionStorage.setItem('ow_report', JSON.stringify(data));
    router.push('/report/latest');
  }

  if (phase === 'running') {
    return (
      <div className="flex w-full justify-center">
        <ScanProgress />
      </div>
    );
  }

  return (
    <div className="ow-card relative w-full max-w-2xl p-7 sm:p-9">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand-100 to-brand opacity-70" />

      {error && (
        <p className="mb-5 rounded-lg border border-brand/25 bg-brand/[0.07] px-4 py-3 text-[13px] text-brand-soft">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="ow-label" htmlFor="business_name">
              Business name
            </label>
            <input
              id="business_name"
              name="business_name"
              required
              className="ow-input"
              placeholder="Acme Dental"
            />
          </div>
          <div>
            <label className="ow-label" htmlFor="url">
              Website
            </label>
            <input
              id="url"
              name="url"
              required
              className="ow-input"
              placeholder="acmedental.com"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="ow-label" htmlFor="full_name">
              Your name
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
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="ow-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              name="city"
              className="ow-input"
              placeholder="Baltimore"
            />
          </div>
          <div>
            <label className="ow-label" htmlFor="country">
              Country
            </label>
            <input
              id="country"
              name="country"
              className="ow-input"
              placeholder="US"
            />
          </div>
          <div>
            <label className="ow-label" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              name="category"
              defaultValue="auto-detect"
              className="ow-input"
            />
          </div>
        </div>

        <button type="submit" className="ow-btn w-full animate-glow">
          <span className="absolute left-0 top-0 h-full w-[38%] animate-sweep bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <span className="relative">Run my free audit</span>
        </button>

        <p className="text-center text-[12px] text-muted">
          Takes 30&ndash;60 seconds. No card required.
        </p>
      </form>
    </div>
  );
}
