'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReportView from '@/components/ReportView';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import type { AuditResponse } from '@/types/audit';

/**
 * Fallback for when a scan succeeded but we could not link the stored row back
 * to the user (so there is no /report/[id] to visit). The scan response is
 * stashed in sessionStorage by ScanForm, so the visitor still sees results.
 */
export default function LatestReportPage() {
  const [payload, setPayload] = useState<AuditResponse | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('ow_report');
    if (raw) {
      try {
        setPayload(JSON.parse(raw) as AuditResponse);
      } catch {
        // Corrupt payload — fall through to the empty state.
      }
    }
    setReady(true);
  }, []);

  // Render the site chrome immediately rather than a blank page: the report
  // itself lives in sessionStorage, so it can only be read after mount.
  if (!ready) {
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-screen items-center justify-center px-6 pt-24">
          <p className="text-[13.5px] text-muted">Loading your report…</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!payload?.result) {
    return (
      <>
      <SiteHeader />
      <main className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="ow-card max-w-md p-10 text-center">
          <h1 className="font-display text-xl font-bold">
            No report to show
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
            This report is no longer in your session. Run a new scan or open one
            from your dashboard.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/scan" className="ow-btn">
              <span className="relative">Run a scan</span>
            </Link>
            <Link href="/dashboard" className="ow-btn-ghost">
              Dashboard
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
      </>
    );
  }

  const signedIn = Boolean(
    (payload as AuditResponse & { signedIn?: boolean }).signedIn
  );

  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main className="relative min-h-screen px-5 pb-20 pt-32 sm:px-6">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] max-w-[95vw] -translate-x-1/2 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at 45% 25%, rgba(0,212,255,.10), transparent 62%), radial-gradient(ellipse at 60% 50%, rgba(243,18,78,.10), transparent 64%)',
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        {!signedIn && (
          <div className="ow-card mb-5 flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-display text-[14px] font-semibold">
                This report lives in your browser only
              </p>
              <p className="mt-1 text-[12.5px] text-muted">
                Create a free account to keep it, and to re-scan later and
                compare.
              </p>
            </div>
            <Link href="/signup" className="ow-btn shrink-0 !px-6 !py-2.5">
              <span className="relative">Save this report</span>
            </Link>
          </div>
        )}
        <ReportView result={payload.result} ai={payload.ai_analysis} />
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
