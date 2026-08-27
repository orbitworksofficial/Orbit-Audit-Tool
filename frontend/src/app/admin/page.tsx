import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

/** Overview: the numbers an admin wants on opening the dashboard. */
export default async function AdminOverview() {
  const db = createAdminClient();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  const [leads, leads24, guests, members, users, active, reports, failed] =
    await Promise.all([
      db.from('leads').select('id', { count: 'exact', head: true }),
      db
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', dayAgo),
      db
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('is_guest', true),
      db
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('is_guest', false),
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      db.from('audit_reports').select('id', { count: 'exact', head: true }),
      db
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('scan_status', 'failed'),
    ]);

  const { data: recent } = await db
    .from('leads')
    .select('id, created_at, full_name, email, business_name, is_guest, scan_status')
    .order('created_at', { ascending: false })
    .limit(8);

  const stats = [
    { label: 'Total leads', value: leads.count ?? 0, href: '/admin/leads' },
    { label: 'Last 24 hours', value: leads24.count ?? 0, href: '/admin/leads' },
    { label: 'Guest scans', value: guests.count ?? 0, href: '/admin/leads?type=guest' },
    { label: 'Member scans', value: members.count ?? 0, href: '/admin/leads?type=member' },
    { label: 'Registered users', value: users.count ?? 0, href: '/admin/users' },
    { label: 'Active accounts', value: active.count ?? 0, href: '/admin/users' },
    { label: 'Reports stored', value: reports.count ?? 0, href: null },
    { label: 'Failed scans', value: failed.count ?? 0, href: '/admin/leads?status=failed' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <span className="ow-eyebrow mb-3">01 / OVERVIEW</span>
        <h1 className="ow-display-sm">
          <span className="block text-white">Dashboard</span>
        </h1>
      </div>

      <div className="ow-grid sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const inner = (
            <>
              <div className="font-display text-[34px] font-extrabold leading-none tracking-[-.04em] text-white">
                {s.value.toLocaleString()}
              </div>
              <div className="mt-2 text-[12px] text-muted">{s.label}</div>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="ow-grid-card block">
              {inner}
              <span className="ow-arrow">&rarr;</span>
            </Link>
          ) : (
            <div key={s.label} className="ow-grid-card">
              {inner}
            </div>
          );
        })}
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-[17px] font-bold tracking-tight">
            Recent leads
          </h2>
          <Link
            href="/admin/leads"
            className="text-[12.5px] text-brand-100 hover:text-brand-200"
          >
            View all &rarr;
          </Link>
        </div>

        {recent?.length ? (
          <div className="overflow-x-auto rounded-[0.35rem] border border-border">
            <table className="w-full min-w-[640px] text-left">
              <thead className="border-b border-border bg-white/[0.02]">
                <tr>
                  {['When', 'Name', 'Business', 'Type', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((l) => (
                  <tr key={l.id} className="border-b border-border/60">
                    <td className="px-4 py-2.5 text-[12px] text-muted">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-[13px]">
                      {l.full_name}
                      <span className="block text-[11px] text-muted">
                        {l.email}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px]">
                      {l.business_name}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={l.is_guest ? 'muted' : 'accent'}>
                        {l.is_guest ? 'Guest' : 'Member'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        tone={
                          l.scan_status === 'success'
                            ? 'success'
                            : l.scan_status === 'failed'
                              ? 'accent'
                              : 'muted'
                        }
                      >
                        {l.scan_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-[0.35rem] border border-border p-8 text-center text-[13px] text-muted">
            No leads yet. They appear here the moment someone submits the scan
            form.
          </p>
        )}
      </section>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'success' | 'accent' | 'muted';
}) {
  const cls =
    tone === 'success'
      ? 'border-success/25 bg-success/[0.08] text-success'
      : tone === 'accent'
        ? 'border-brand/25 bg-brand/[0.08] text-brand-100'
        : 'border-border bg-white/[0.03] text-muted';
  return (
    <span
      className={`inline-block rounded-[3px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${cls}`}
    >
      {children}
    </span>
  );
}
