'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Lead {
  id: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  business_name: string | null;
  website_url: string | null;
  city: string | null;
  country: string | null;
  is_guest: boolean;
  user_id: string | null;
  client_ip: string | null;
  report_id: string | null;
  scan_status: string;
  contacted: boolean;
  notes: string | null;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type !== 'all') params.set('type', type);
    if (status !== 'all') params.set('status', status);

    const res = await fetch(`/api/admin/leads?${params}`);
    const data = await res.json().catch(() => ({}));
    setLeads(data.leads ?? []);
    setLoading(false);
  }, [q, type, status]);

  useEffect(() => {
    // Debounced so typing in the search box does not fire a request per key.
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function toggleContacted(lead: Lead) {
    await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: lead.id, contacted: !lead.contacted }),
    });
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id ? { ...l, contacted: !l.contacted } : l
      )
    );
  }

  function exportCsv() {
    const head = [
      'Date',
      'Name',
      'Email',
      'Business',
      'Website',
      'City',
      'Country',
      'Type',
      'Status',
      'Contacted',
    ];
    const rows = leads.map((l) => [
      new Date(l.created_at).toISOString(),
      l.full_name ?? '',
      l.email ?? '',
      l.business_name ?? '',
      l.website_url ?? '',
      l.city ?? '',
      l.country ?? '',
      l.is_guest ? 'Guest' : 'Member',
      l.scan_status,
      l.contacted ? 'Yes' : 'No',
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbitscanner-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="ow-eyebrow mb-3">02 / LEADS</span>
          <h1 className="ow-display-sm">
            <span className="block text-white">Leads</span>
          </h1>
        </div>
        <button onClick={exportCsv} className="ow-btn-ghost !py-2.5 !text-[12px]">
          EXPORT CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or business"
          className="ow-input max-w-xs !py-2.5 !text-[13px]"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="ow-input max-w-[150px] !py-2.5 !text-[13px]"
        >
          <option value="all">All types</option>
          <option value="guest">Guests</option>
          <option value="member">Members</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="ow-input max-w-[150px] !py-2.5 !text-[13px]"
        >
          <option value="all">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-[13px] text-muted">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="rounded-[0.35rem] border border-border p-10 text-center text-[13px] text-muted">
          No leads match those filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[0.35rem] border border-border">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-border bg-white/[0.02]">
              <tr>
                {[
                  'When',
                  'Contact',
                  'Business',
                  'Location',
                  'Type',
                  'Status',
                  'IP',
                  'Report',
                  'Done',
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-border/60 transition hover:bg-white/[0.02]"
                >
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[11.5px] text-muted">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-[12.5px]">
                    {l.full_name}
                    <span className="block text-[11px] text-muted">
                      {l.email}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-[12.5px]">
                    {l.business_name}
                    <span className="block text-[11px] text-muted">
                      {l.website_url}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-[12px] text-muted">
                    {[l.city, l.country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <Badge tone={l.is_guest ? 'muted' : 'accent'}>
                      {l.is_guest ? 'Guest' : 'Member'}
                    </Badge>
                  </td>
                  <td className="px-3.5 py-2.5">
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
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted">
                    {l.client_ip ?? '—'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {l.report_id ? (
                      <Link
                        href={`/report/${l.report_id}`}
                        className="text-[12px] text-brand-100 hover:text-brand-200"
                      >
                        View
                      </Link>
                    ) : (
                      <span className="text-[12px] text-faint">—</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <input
                      type="checkbox"
                      checked={l.contacted}
                      onChange={() => toggleContacted(l)}
                      className="h-4 w-4 accent-[#f3124e]"
                      title="Mark as contacted"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11.5px] text-muted">
        Showing {leads.length} lead{leads.length === 1 ? '' : 's'} (newest 300).
      </p>
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
      className={`inline-block whitespace-nowrap rounded-[3px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${cls}`}
    >
      {children}
    </span>
  );
}
