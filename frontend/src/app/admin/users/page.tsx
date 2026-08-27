'use client';

import { useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  is_admin: boolean;
  is_active: boolean;
  scan_limit: number;
  scans_used: number;
  bonus_scans: number;
  last_seen_at: string | null;
  deactivated_reason: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    const data = await res.json().catch(() => ({}));
    setUsers(data.users ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function act(userId: string, action: string, extra: object = {}) {
    setBusy(userId);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      alert(data.error ?? 'That did not work.');
      return;
    }
    load();
  }

  function gift(user: User) {
    const input = prompt(
      `Gift extra scans to ${user.email}\n\nThey currently have ${
        user.scan_limit + user.bonus_scans - user.scans_used
      } remaining.\n\nHow many to add?`,
      '2'
    );
    if (!input) return;
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount < 1) {
      alert('Enter a number of 1 or more.');
      return;
    }
    act(user.id, 'gift_scans', { amount });
  }

  function deactivate(user: User) {
    const reason = prompt(`Why are you deactivating ${user.email}?`, '');
    if (reason === null) return;
    act(user.id, 'deactivate', { reason });
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="ow-eyebrow mb-3">03 / USERS</span>
        <h1 className="ow-display-sm">
          <span className="block text-white">Users</span>
        </h1>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by email or name"
        className="ow-input max-w-xs !py-2.5 !text-[13px]"
      />

      {loading ? (
        <p className="py-10 text-center text-[13px] text-muted">Loading…</p>
      ) : users.length === 0 ? (
        <p className="rounded-[0.35rem] border border-border p-10 text-center text-[13px] text-muted">
          No users found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[0.35rem] border border-border">
          <table className="w-full min-w-[860px] text-left">
            <thead className="border-b border-border bg-white/[0.02]">
              <tr>
                {['User', 'Joined', 'Scans', 'Status', 'Role', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const total = u.scan_limit + u.bonus_scans;
                const left = Math.max(0, total - u.scans_used);
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border/60 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-3.5 py-3 text-[12.5px]">
                      {u.full_name || '—'}
                      <span className="block text-[11px] text-muted">
                        {u.email}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3 text-[11.5px] text-muted">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3.5 py-3 text-[12.5px]">
                      <span
                        className={left > 0 ? 'text-success' : 'text-brand'}
                      >
                        {left}
                      </span>
                      <span className="text-muted"> / {total}</span>
                      {u.bonus_scans > 0 && (
                        <span className="block text-[10.5px] text-muted">
                          incl. {u.bonus_scans} gifted
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      <Badge tone={u.is_active ? 'success' : 'accent'}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                      {u.deactivated_reason && (
                        <span className="mt-1 block max-w-[160px] text-[10.5px] text-muted">
                          {u.deactivated_reason}
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      {u.is_admin ? (
                        <Badge tone="accent">Admin</Badge>
                      ) : (
                        <span className="text-[11.5px] text-muted">User</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Btn
                          onClick={() => gift(u)}
                          disabled={busy === u.id}
                        >
                          Gift
                        </Btn>
                        <Btn
                          onClick={() => act(u.id, 'reset_scans')}
                          disabled={busy === u.id}
                        >
                          Reset
                        </Btn>
                        {u.is_active ? (
                          <Btn
                            onClick={() => deactivate(u)}
                            disabled={busy === u.id}
                            danger
                          >
                            Disable
                          </Btn>
                        ) : (
                          <Btn
                            onClick={() => act(u.id, 'activate')}
                            disabled={busy === u.id}
                          >
                            Enable
                          </Btn>
                        )}
                        {u.is_admin ? (
                          <Btn
                            onClick={() => act(u.id, 'revoke_admin')}
                            disabled={busy === u.id}
                            danger
                          >
                            Demote
                          </Btn>
                        ) : (
                          <Btn
                            onClick={() => act(u.id, 'make_admin')}
                            disabled={busy === u.id}
                          >
                            Promote
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[3px] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition disabled:opacity-40 ${
        danger
          ? 'border-brand/30 text-brand-100 hover:bg-brand/[0.12]'
          : 'border-border text-muted hover:border-white/30 hover:text-white'
      }`}
    >
      {children}
    </button>
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
