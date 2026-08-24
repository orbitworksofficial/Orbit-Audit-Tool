import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { readQuota } from '@/lib/quota';
import { scoreColor } from '@/lib/scores';
import SignOutButton from '@/components/SignOutButton';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Dashboard — OrbitScanner' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated users, so user is set here.
  const quota = user
    ? await readQuota(user.id)
    : { remaining: 0, scanLimit: 0, scansUsed: 0, allowed: false };

  const { data: reports } = await supabase
    .from('audit_reports')
    .select('id, business_name, website_url, overall_score, created_at')
    .order('created_at', { ascending: false })
    .limit(25);

  return (
    <>
      <SiteHeader signedIn />
      <main className="relative min-h-screen px-5 pb-20 pt-32 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <header className="ow-card p-7 sm:p-9">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent" />
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Your reports
              </h1>
              <p className="mt-2 flex items-center gap-3 text-[13.5px] text-muted">
                {user?.email}
                <span className="text-faint">&middot;</span>
                <SignOutButton />
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="font-display text-2xl font-bold">
                  {quota.remaining}
                  <span className="text-muted">/{quota.scanLimit}</span>
                </div>
                <div className="text-[11px] text-muted">free scans left</div>
              </div>
              <Link href="/scan" className="ow-btn">
                <span className="relative">New scan</span>
              </Link>
            </div>
          </div>
        </header>

        {reports?.length ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/report/${r.id}`}
                className="ow-card flex items-center justify-between gap-5 p-5 transition hover:border-cyan/30"
              >
                <div className="min-w-0">
                  <div className="truncate font-display text-[15px] font-semibold">
                    {r.business_name || 'Untitled'}
                  </div>
                  <div className="mt-1 truncate text-[12.5px] text-muted">
                    {r.website_url} &middot;{' '}
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className="shrink-0 font-display text-xl font-bold"
                  style={{ color: scoreColor(r.overall_score ?? 0) }}
                >
                  {r.overall_score ?? 0}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="ow-card p-10 text-center">
            <p className="text-[14px] text-muted">
              No reports yet. Run your first scan to see where you stand.
            </p>
            <Link href="/scan" className="ow-btn mt-6 inline-block">
              <span className="relative">Run a free scan</span>
            </Link>
          </div>
        )}
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
