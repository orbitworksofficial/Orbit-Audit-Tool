import { createClient } from '@/lib/supabase/server';
import LegalPage, { Section } from '@/components/LegalPage';

export const metadata = { title: 'Privacy Policy — Orbit Works' };

export default async function PrivacyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 2026"
      signedIn={Boolean(user)}
    >
      <Section heading="What we collect">
        <p>
          When you run a scan we collect the details you enter: your name, email
          address, business name, website URL, city and country. If you create
          an account we also store your email and a securely hashed password.
        </p>
        <p>
          We store the results of each audit against your account, including the
          scores, the raw data returned by the analysis providers, and the
          AI-generated commentary.
        </p>
      </Section>

      <Section heading="Why we collect it">
        <p>
          The business details are needed to run the audit &mdash; we cannot
          check whether AI engines recommend you without knowing who you are.
          Your email identifies your account and lets us send you your report.
        </p>
        <p>
          We may contact you about your audit results. You can opt out of that
          at any time by replying to any message or emailing us.
        </p>
      </Section>

      <Section heading="Third parties involved in a scan">
        <p>
          Running an audit sends your business name and website to several
          providers so they can analyse it: Google PageSpeed Insights,
          DataForSEO, Perplexity, Anthropic and Groq. Only the details needed to
          perform the analysis are shared. Each provider handles that data under
          its own privacy policy.
        </p>
        <p>
          Account data and reports are stored with Supabase. We do not sell your
          data to anyone, and we do not share it with advertisers.
        </p>
      </Section>

      <Section heading="Your control over your data">
        <p>
          You can see every report tied to your account from your dashboard. If
          you want your account and all associated reports deleted, email us and
          we will action it &mdash; you do not need to give a reason.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about this policy: <span className="text-cyan">
            hello@orb-itworks.com
          </span>
        </p>
      </Section>
    </LegalPage>
  );
}
