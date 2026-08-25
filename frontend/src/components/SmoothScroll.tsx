'use client';

import { useEffect } from 'react';

/**
 * Lenis smooth scrolling, lerp 0.1 / duration 1.2.
 *
 * Imported dynamically so it never lands in the server bundle, and skipped
 * entirely under prefers-reduced-motion — hijacking scroll is exactly the kind
 * of motion that setting exists to disable.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cancelled = false;

    import('lenis')
      .then(({ default: Lenis }) => {
        if (cancelled) return;
        lenis = new Lenis({ lerp: 0.1, duration: 1.2 });

        const raf = (time: number) => {
          lenis?.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
      })
      .catch(() => {
        // Smooth scroll is a nicety; native scrolling is a fine fallback.
      });

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
