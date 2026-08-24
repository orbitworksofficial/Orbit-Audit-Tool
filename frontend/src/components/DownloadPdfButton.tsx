'use client';

import { useState } from 'react';

/**
 * Triggers the browser's own print-to-PDF.
 *
 * Every browser can save a page as PDF, so we let the visitor's machine do it
 * instead of running a headless Chromium on the server. That removes the
 * single largest hosting requirement (~1GB RAM) from the backend.
 */
export default function DownloadPdfButton({
  businessName,
}: {
  businessName?: string;
}) {
  const [hint, setHint] = useState(false);

  function print() {
    // The document title becomes the default filename in the save dialog.
    const original = document.title;
    if (businessName) {
      const safe = businessName.replace(/[^\w\s-]/g, '').trim();
      document.title = `AI Visibility Report - ${safe}`;
    }

    window.print();

    // Restore after the dialog closes. Chrome fires this synchronously,
    // Safari needs the timeout.
    setTimeout(() => {
      document.title = original;
    }, 500);

    setHint(true);
  }

  return (
    <span className="no-print inline-flex flex-col gap-1.5">
      <button onClick={print} className="ow-btn">
        <span className="relative">Download PDF</span>
      </button>
      {hint && (
        <span className="text-[11px] leading-snug text-muted">
          Choose <strong className="text-white">Save as PDF</strong> as the
          destination.
        </span>
      )}
    </span>
  );
}
