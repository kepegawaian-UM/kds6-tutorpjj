'use client';

import { useRouter } from 'next/navigation';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface Slice {
  label: string;
  value: number;
}

const COLORS = ['#2f6b5c', '#e5c690', '#8aa79c', '#b9ad93'];

const shortProdi = (s: string) => s.replace(/^S2 PJJ\s+/i, '');

function labelFromClick(d: unknown): string | undefined {
  const o = d as { label?: string; payload?: { label?: string }; name?: string };
  return o?.payload?.label ?? o?.label ?? o?.name;
}

export function DashboardCharts({ prodi, jenis }: { prodi: Slice[]; jenis: Slice[] }) {
  const router = useRouter();
  const go = (key: 'prodi' | 'jenis', label?: string) => {
    if (label) router.push(`/penugasan?${key}=${encodeURIComponent(label)}`);
  };
  const totalJenis = jenis.reduce((s, x) => s + x.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section className="card p-4 lg:col-span-3" aria-label="Penugasan per prodi">
        <h2 className="mb-1 font-semibold">Penugasan per prodi</h2>
        <p className="mb-3 text-xs text-muted">Klik batang untuk memfilter daftar penugasan.</p>
        <div style={{ height: Math.max(220, prodi.length * 46) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prodi} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={112}
                tickFormatter={shortProdi}
                tick={{ fill: 'var(--fg)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                formatter={(v) => [v, 'Penugasan']}
                labelFormatter={(l) => shortProdi(String(l))}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)' }}
              />
              <Bar
                dataKey="value"
                fill="var(--accent)"
                radius={[0, 6, 6, 0]}
                cursor="pointer"
                label={{ position: 'right', fill: 'var(--fg)', fontSize: 12 }}
                onClick={(d) => go('prodi', labelFromClick(d))}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card p-4 lg:col-span-2" aria-label="Komposisi jenis pegawai">
        <h2 className="mb-1 font-semibold">Komposisi jenis pegawai</h2>
        <p className="mb-3 text-xs text-muted">Klik bagian donat atau keterangan untuk memfilter.</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={jenis}
                dataKey="value"
                nameKey="label"
                innerRadius="58%"
                outerRadius="90%"
                paddingAngle={2}
                stroke="var(--surface)"
                cursor="pointer"
                onClick={(d) => go('jenis', labelFromClick(d))}
              >
                {jenis.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [v, n]}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)' }}
                itemStyle={{ color: 'var(--fg)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 space-y-1">
          {jenis.map((s, i) => (
            <li key={s.label}>
              <button
                onClick={() => go('jenis', s.label)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-2"
              >
                <span className="size-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1">{s.label}</span>
                <span className="tabular-nums text-muted">
                  {s.value} · {totalJenis ? Math.round((s.value / totalJenis) * 100) : 0}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
