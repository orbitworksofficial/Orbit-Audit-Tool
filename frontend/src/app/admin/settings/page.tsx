'use client';

import { useEffect, useState } from 'react';

type Settings = Record<string, unknown>;

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? {}))
      .finally(() => setLoading(false));
  }, []);

  async function save(key: string, value: unknown) {
    setSaving(key);
    setMessage(null);

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(null);

    if (!res.ok) {
      setMessage(data.error ?? 'Could not save.');
      return;
    }
    setSettings((s) => ({ ...s, [key]: value }));
    setMessage('Saved.');
    setTimeout(() => setMessage(null), 2500);
  }

  if (loading) {
    return <p className="py-10 text-center text-[13px] text-muted">Loading…</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <span className="ow-eyebrow mb-3">04 / SETTINGS</span>
        <h1 className="ow-display-sm">
          <span className="block text-white">Settings</span>
        </h1>
      </div>

      {message && (
        <p className="rounded-[0.35rem] border border-success/25 bg-success/[0.06] px-4 py-2.5 text-[13px] text-success">
          {message}
        </p>
      )}

      <Toggle
        label="Free scans"
        description="The master switch. Turning this off blocks every scan, guest and member alike."
        value={settings.free_scans_enabled === true}
        busy={saving === 'free_scans_enabled'}
        onChange={(v) => save('free_scans_enabled', v)}
      />

      <Toggle
        label="Guest scans"
        description="Allow scanning without an account. Turn off to require signup before any scan."
        value={settings.guest_scans_enabled === true}
        busy={saving === 'guest_scans_enabled'}
        onChange={(v) => save('guest_scans_enabled', v)}
      />

      <NumberSetting
        label="Guest scan limit"
        description="Free scans per device before signup is required."
        value={Number(settings.guest_scan_limit ?? 1)}
        busy={saving === 'guest_scan_limit'}
        min={0}
        max={10}
        onChange={(v) => save('guest_scan_limit', v)}
      />

      <NumberSetting
        label="Member scan limit"
        description="Scans granted on signup. Existing accounts keep their current limit; use Gift on the Users page to top those up."
        value={Number(settings.member_scan_limit ?? 2)}
        busy={saving === 'member_scan_limit'}
        min={0}
        max={100}
        onChange={(v) => save('member_scan_limit', v)}
      />

      <p className="rounded-[0.35rem] border border-border bg-white/[0.02] px-4 py-3.5 text-[12px] leading-relaxed text-muted">
        Each scan costs roughly <strong className="text-white">$0.12</strong> in
        DataForSEO, Perplexity and Claude credits. These limits are the only
        thing standing between the tool and an unbounded bill.
      </p>
    </div>
  );
}

function Toggle({
  label,
  description,
  value,
  busy,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  busy: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-[0.35rem] border border-border p-5">
      <div>
        <h2 className="font-display text-[15px] font-bold">{label}</h2>
        <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <button
        onClick={() => onChange(!value)}
        disabled={busy}
        aria-pressed={value}
        className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
          value ? 'bg-success' : 'bg-white/15'
        }`}
      >
        <span
          className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: value ? 26 : 4 }}
        />
      </button>
    </div>
  );
}

function NumberSetting({
  label,
  description,
  value,
  busy,
  min,
  max,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  busy: boolean;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  return (
    <div className="flex items-start justify-between gap-6 rounded-[0.35rem] border border-border p-5">
      <div>
        <h2 className="font-display text-[15px] font-bold">{label}</h2>
        <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="ow-input w-20 !py-2 !text-center !text-[13px]"
        />
        <button
          onClick={() => onChange(Number(draft))}
          disabled={busy || draft === String(value)}
          className="ow-btn !px-3 !py-2 !text-[11px] disabled:opacity-40"
        >
          SAVE
        </button>
      </div>
    </div>
  );
}
