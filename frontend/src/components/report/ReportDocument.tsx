'use client';

import Link from 'next/link';
import ReportPageOne from './ReportPageOne';
import ReportPageTwo from './ReportPageTwo';
import ReportPageThree from './ReportPageThree';
import DownloadPdfButton from '@/components/DownloadPdfButton';
import type { AuditResult, AiAnalysis } from '@/types/audit';

/**
 * The full three-page report.
 *
 * The same markup serves the screen and the PDF: print.css turns each
 * .ow-report-page into an A4 portrait sheet at 1:1 scale, so what the visitor
 * sees is what they get when they save it.
 */
export default function ReportDocument({
  result,
  ai,
}: {
  result: AuditResult;
  ai?: AiAnalysis;
}) {
  const deep = ai?.deep_analysis;

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      {/* Toolbar — screen only */}
      <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="ow-eyebrow mb-2">AI VISIBILITY REPORT</span>
          <h1 className="font-display text-[26px] font-extrabold tracking-[-.03em] text-white">
            {result.business_name}
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            {result.website_url} &middot; {result.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DownloadPdfButton businessName={result.business_name} />
          <Link href="/scan" className="ow-btn-ghost">
            RUN ANOTHER SCAN
          </Link>
        </div>
      </div>

      {/* AI summary — screen only; the printed pages are the deliverable */}
      {deep?.overall_summary && (
        <p className="no-print mb-5 rounded-[6px] border border-border bg-white/[0.02] p-4 text-[13px] leading-[1.75] text-white/75">
          {deep.overall_summary}
        </p>
      )}

      <div className="space-y-5">
        <ReportPageOne result={result} />
        <ReportPageTwo result={result} />
        <ReportPageThree result={result} />
      </div>

      <p className="no-print mt-5 text-center text-[11px] text-muted">
        Three A4 pages. Use <strong className="text-white">Download PDF</strong>{' '}
        and choose &ldquo;Save as PDF&rdquo;. Portrait is the default, so no
        settings need changing.
      </p>
    </div>
  );
}
