import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import './theme.css';
import './print.css';
import ScrollProgress from '@/components/ScrollProgress';
import SmoothScroll from '@/components/SmoothScroll';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

// Small technical labels only: eyebrows, units, table headers.
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OrbitScanner — Free AI Visibility Audit',
  description:
    'See whether AI search engines recommend your business. Free audit across AEO, GEO, SEO, reputation, competitors and social in under 60 seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * Font variables are declared on <html> and the theme class sits on <body>,
     * so --font-body and --font-mono are already resolved by the time any rule
     * inside .ow-theme reads them. Declaring them lower down would let body
     * styles resolve first and fall back to a serif default.
     *
     * --font-display intentionally maps to Inter too: this design uses one
     * family at different weights and tracking rather than two faces.
     */
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      style={{ ['--font-display' as string]: 'var(--font-body)' }}
    >
      <body className="ow-theme font-body">
        <ScrollProgress />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
