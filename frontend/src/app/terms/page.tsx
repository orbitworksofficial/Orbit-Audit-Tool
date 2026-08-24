import { createClient } from '@/lib/supabase/server';
import LegalPage, { Section } from '@/components/LegalPage';

export const metadata = { title: 'Terms of Service — Orbit Works' };

export default async function TermsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <LegalPage
      title="Terms of Service"
      updated="August 2026"
      signedIn={Boolean(user)}
    >
      <Section heading="The service">
        <p>
          OrbitScanner analyses a business&apos;s visibility across AI search,
          traditional search, reputation and social presence, and returns a
          scored report. Free accounts include three complete scans.
        </p>
      </Section>

      <Section heading="What the scores mean">
        <p>
          Scores are our assessment based on data available at the time of the
          scan. AI search engines change their behaviour frequently and do not
          publish how they rank or cite sources, so results can shift between
          scans without anything changing on your side.
        </p>
        <p>
          A report is a diagnostic, not a guarantee. We do not promise any
          particular ranking, citation, traffic level or business outcome.
        </p>
      </Section>

      <Section heading="Your responsibilities">
        <p>
          Scan businesses you own or are authorised to act for. Do not use the
          service to attack, impersonate or misrepresent anyone, and do not
          attempt to circumvent scan limits or access reports belonging to other
          accounts.
        </p>
        <p>
          You are responsible for keeping your account credentials secure.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          Audits depend on several external providers. If one of them is
          unavailable, a scan can fail or return partial data. Where a scan
          fails, the scan credit is returned to your account automatically.
        </p>
        <p>
          We may change or discontinue parts of the service. Where a change
          materially affects paying customers, we will give notice first.
        </p>
      </Section>

      <Section heading="Ownership">
        <p>
          Your business data and the reports generated for you remain yours. The
          scanner, its scoring methodology and the interface remain ours.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these terms:{' '}
          <span className="text-cyan">hello@orb-itworks.com</span>
        </p>
      </Section>
    </LegalPage>
  );
}
