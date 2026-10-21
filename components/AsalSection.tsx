'use client';

import { useRouter } from 'next/navigation';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AsalGroup } from '@/lib/asal';

export function AsalSection({ data }: { data: AsalGroup[] }) {
  const router = useRouter();
  const total = data.reduce((s, g) => s + g.value, 0);
  const go = (label?: string) => label && router.push(`/tutor?asal=${encodeURIComponent(label)}`);
  const labelOf = (d: unknown) => {
    const o = d as { label?: string; payload?: { label?: string } };
    return o?.payload?.label ?? o?.label;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section className="card p-4 lg:col-span-3" aria-label="Sebaran asal tutor">
        <h2 className="mb-1 font-semibold">Sebaran asal tutor</h2>
        <p className="mb-3 text-xs text-muted">Jumlah tutor unik per wilayah ({total} tutor). Klik batang untuk melihat daftar tutornya.</p>
        <div style={{ height: Math.max(220, data.length * 44) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" width={128} tick={{ fill: 'var(--fg)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                formatter={(v) => [v, 'Tutor']}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)' }}
              />
              <Bar
                dataKey="value"
                fill="var(--accent)"
                radius={[0, 6, 6, 0]}
                cursor="pointer"
                label={{ position: 'right', fill: 'var(--fg)', fontSize: 12 }}
                onClick={(d) => go(labelOf(d))}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card p-4 lg:col-span-2" aria-label="Rincian asal institusi">
        <h2 className="mb-1 font-semibold">Rincian institusi asal</h2>
        <p className="mb-3 text-xs text-muted">Berdasarkan unit kerja terbaru tiap tutor.</p>
        <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {data.map((g) => (
            <li key={g.label}>
              <button onClick={() => go(g.label)} className="flex w-full items-baseline justify-between text-left text-sm font-medium hover:text-accent">
                <span>{g.label}</span>
                <span className="tabular-nums text-muted">{g.value}</span>
              </button>
              <ul className="mt-1 space-y-0.5 border-l border-border pl-3">
                {g.units.map((u) => (
                  <li key={u.unit} className="flex justify-between gap-3 text-xs text-muted">
                    <span className="min-w-0">{u.unit}</span>
                    <span className="tabular-nums">{u.count}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
