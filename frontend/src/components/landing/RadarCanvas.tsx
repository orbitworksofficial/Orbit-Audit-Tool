'use client';

import { useEffect, useRef } from 'react';

/**
 * The rotating radar sweep + particle mesh from the original landing page.
 * Purely decorative, so it sits behind content with pointer-events off.
 */
export default function RadarCanvas({ opacity = 0.5 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const host = cv?.parentElement;
    if (!cv || !host) return;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let angle = 0;
    let raf = 0;
    let dots: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    const build = () => {
      const w = host.offsetWidth;
      const h = host.offsetHeight;
      if (!w || !h) return;
      W = w;
      H = h;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const n = Math.min(70, Math.round((w * h) / 22000));
      dots = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.5,
      }));
    };

    build();
    window.addEventListener('resize', build);

    const draw = () => {
      if (W && H) {
        ctx.clearRect(0, 0, W, H);
        const ox = W / 2;
        const oy = H / 2;
        const maxR = Math.hypot(ox, oy) * 0.85;

        // Concentric rings
        for (let i = 1; i <= 5; i++) {
          ctx.beginPath();
          ctx.arc(ox, oy, (maxR / 5) * i, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0,212,255,${i === 3 ? 0.09 : 0.04})`;
          ctx.lineWidth = i === 3 ? 1 : 0.5;
          ctx.stroke();
        }

        // Sweep wedge
        const g = ctx.createLinearGradient(
          ox + Math.cos(angle) * maxR * 0.5,
          oy + Math.sin(angle) * maxR * 0.5,
          ox,
          oy
        );
        g.addColorStop(0, 'rgba(0,212,255,0)');
        g.addColorStop(0.6, 'rgba(0,212,255,.05)');
        g.addColorStop(1, 'rgba(243,18,78,.10)');
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.arc(ox, oy, maxR, angle - Math.PI * 0.55, angle);
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();

        // Sweep line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(angle) * maxR, oy + Math.sin(angle) * maxR);
        ctx.strokeStyle = 'rgba(0,212,255,.38)';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00D4FF';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();

        // Particle mesh
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          d.x += d.vx;
          d.y += d.vy;
          if (d.x < 0 || d.x > W) d.vx *= -1;
          if (d.y < 0 || d.y > H) d.vy *= -1;

          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,.30)';
          ctx.fill();

          for (let j = i + 1; j < dots.length; j++) {
            const o = dots[j];
            const dist = Math.hypot(d.x - o.x, d.y - o.y);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(d.x, d.y);
              ctx.lineTo(o.x, o.y);
              ctx.strokeStyle = `rgba(0,212,255,${(0.1 * (1 - dist / 120)).toFixed(3)})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }

        angle += 0.0055;
        if (angle > Math.PI * 2) angle -= Math.PI * 2;
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', build);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      style={{ opacity }}
    />
  );
}
