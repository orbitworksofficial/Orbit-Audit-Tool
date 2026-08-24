import type { Config } from 'tailwindcss';

// Tokens lifted directly from the OrbitWorks AEO landing page so the scanner
// reads as the same product, not a bolted-on tool.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070B14',        // page background
        panel: '#0A0F1E',      // alternating section background
        card: '#101828',       // raised surface
        brand: {
          DEFAULT: '#F3124E',  // Orbit crimson
          soft: '#FF5C82',
          deep: '#8C0B32',
        },
        cyan: {
          DEFAULT: '#00D4FF',  // Orbit cyan
          soft: '#7FE9FF',
        },
        muted: '#8B91A3',
        faint: '#454C58',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Space Grotesk', 'sans-serif'],
        body: ['var(--font-body)', 'Manrope', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        dot: {
          '0%,100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(0,212,255,.5)' },
          '50%': { opacity: '.35', boxShadow: '0 0 0 6px rgba(0,212,255,0)' },
        },
        glow: {
          '0%,100%': { boxShadow: '0 6px 30px rgba(243,18,78,.28)' },
          '50%': { boxShadow: '0 10px 60px rgba(243,18,78,.6)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '60%,100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        aurora: {
          '0%,100%': { transform: 'translate3d(-6%,0,0) scale(1)' },
          '50%': { transform: 'translate3d(6%,-4%,0) scale(1.15)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(700%)' },
        },
        shift: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        owMarquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        ring: {
          '0%,100%': {
            opacity: '.32',
            transform: 'translate(-50%,-50%) scale(1)',
          },
          '50%': {
            opacity: '.05',
            transform: 'translate(-50%,-50%) scale(1.08)',
          },
        },
        float: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-18px,0)' },
        },
      },
      animation: {
        dot: 'dot 2.2s ease-in-out infinite',
        glow: 'glow 3.6s ease-in-out infinite',
        sweep: 'sweep 4s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        scan: 'scan 6s linear infinite',
        shift: 'shift 9s linear infinite',
        marquee: 'owMarquee 30s linear infinite',
        ring: 'ring 5s ease-in-out infinite',
        float: 'float 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
