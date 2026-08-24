import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Hero from '@/components/landing/Hero';
import Marquee from '@/components/landing/Marquee';
import Evidence from '@/components/landing/Evidence';
import Shift from '@/components/landing/Shift';
import Territories from '@/components/landing/Territories';
import Method from '@/components/landing/Method';
import Proof from '@/components/landing/Proof';
import FinalCta from '@/components/landing/FinalCta';

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
        <Marquee />
        <Evidence />
        <Shift />
        <Territories />
        <Method />
        <Proof />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
