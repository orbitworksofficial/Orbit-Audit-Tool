'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Fires once when the element scrolls into view. Used for the staggered
 * reveal animations across the landing page.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.1
) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already on screen at mount (e.g. above the fold) — show immediately.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, shown };
}

/** Counts up to `target` once visible. Mirrors the original owCount behaviour. */
export function useCountUp(target: number, durationMs = 1800) {
  const { ref, shown } = useReveal<HTMLSpanElement>(0.35);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!shown) return;

    let raf = 0;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, target, durationMs]);

  return { ref, value };
}

/**
 * Rotating type-on / type-off effect for the hero headline.
 */
export function useTypewriter(
  words: string[],
  { typeMs = 45, deleteMs = 22, holdMs = 2600 } = {}
) {
  const [text, setText] = useState('');
  const state = useRef({ word: 0, char: 0, deleting: false });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      const s = state.current;
      const current = words[s.word];

      if (!s.deleting) {
        if (s.char < current.length) {
          s.char += 1;
          setText(current.slice(0, s.char));
          timer = setTimeout(step, typeMs);
        } else {
          timer = setTimeout(() => {
            s.deleting = true;
            step();
          }, holdMs);
        }
      } else {
        if (s.char > 0) {
          s.char -= 1;
          setText(current.slice(0, s.char));
          timer = setTimeout(step, deleteMs);
        } else {
          s.deleting = false;
          s.word = (s.word + 1) % words.length;
          timer = setTimeout(step, 320);
        }
      }
    };

    timer = setTimeout(step, 700);
    return () => clearTimeout(timer);
  }, [words, typeMs, deleteMs, holdMs]);

  return text;
}

/** Subtle 3D tilt toward the cursor. Disabled on touch devices. */
export function useTilt<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const move = (ev: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (ev.clientX - r.left) / r.width - 0.5;
      const dy = (ev.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-dy * 5).toFixed(2)}deg) rotateY(${(dx * 6).toFixed(2)}deg) translateY(-6px)`;
    };
    const leave = () => {
      el.style.transform = 'translateY(0)';
    };

    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    };
  }, []);

  return ref;
}
