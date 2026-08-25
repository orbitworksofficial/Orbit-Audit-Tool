import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Hero from '@/components/landing/Hero';
import Ticker from '@/components/landing/Marquee';
import WhatWeCheck from '@/components/landing/WhatWeCheck';
import FinalCta from '@/components/landing/FinalCta';

/**
 * Tool page — deliberately short.
 *
 * The full product pitch (the shift to AI search, territories, method,
 * testimonials) lives on the separate Orbit Works landing page. Here the job
 * is only: say what this does, show what it checks, get them scanning.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main>
        <Hero />
        <Ticker />
        <WhatWeCheck />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
