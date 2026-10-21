import Link from 'next/link';
import { DashboardCharts, type Slice } from '@/components/DashboardCharts';
import { StartMissingBadge, StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, PageHeader } from '@/components/States';
import { DEFAULT_PRODI, JENIS_PEGAWAI, STATUS_LABEL } from '@/lib/config';
import { formatDate } from '@/lib/dates';
import { loadViews } from '@/lib/load';
import { groupTutors } from '@/lib/tutors';
import type { StatusKey } from '@/lib/types';
import type { AssignmentView } from '@/lib/view';

export const dynamic = 'force-dynamic';

function countBy(rows: AssignmentView[], pick: (r: AssignmentView) => string, order: string[]): Slice[] {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(pick(r), (m.get(pick(r)) ?? 0) + 1));
  const known = order.filter((k) => m.has(k)).map((k) => ({ label: k, value: m.get(k)! }));
  const extra = [...m.entries()].filter(([k]) => k && !order.includes(k)).map(([label, value]) => ({ label, value }));
  return [...known, ...extra];
}

const CARD_STATUS: { key: StatusKey; tone: string }[] = [
  { key: 'aktif', tone: 'text-emerald-700 dark:text-emerald-400' },
  { key: 'segera', tone: 'text-orange-700 dark:text-orange-400' },
  { key: 'berakhir', tone: 'text-slate-600 dark:text-slate-300' },
  { key: 'belum', tone: 'text-yellow-700 dark:text-yellow-400' },
];

function AttentionItem({ r }: { r: AssignmentView }) {
  return (
    <li>
      <Link href={`/penugasan/${r.id}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 hover:bg-surface-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{r.nama}</p>
          <p className="truncate text-xs text-muted">
            {r.prodi} · {r.noSk}
            {r.tanggalSelesai && <> · selesai {formatDate(r.tanggalSelesai)}</>}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={r.status} daysLeft={r.daysLeft} />
          {r.startMissing && <StartMissingBadge />}
        </div>
      </Link>
    </li>
  );
}

export default async function DashboardPage() {
  const res = await loadViews();
  if (!res.ok) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState message={res.message} />
      </>
    );
  }
  const { views, today } = res;
  if (!views.length) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState title="Belum ada data penugasan" action={{ href: '/penugasan/baru', label: 'Tambah penugasan' }}>
          Sheet masih kosong. Jalankan impor (lihat README) atau tambahkan penugasan pertama.
        </EmptyState>
      </>
    );
  }

  const count = (s: StatusKey) => views.filter((v) => v.status === s).length;
  const soon = views.filter((v) => v.status === 'segera').sort((a, b) => a.daysLeft! - b.daysLeft!);
  const unknown = views.filter((v) => v.status === 'belum');

  const summary = [
    { label: 'Tutor unik', value: groupTutors(views).length, href: '/tutor' },
    { label: 'Total penugasan', value: views.length, href: '/penugasan' },
    { label: 'SK unik', value: new Set(views.map((v) => v.noSk).filter(Boolean)).size, href: '/penugasan' },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Posisi per ${formatDate(today)} (WIB)`} />

      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
        {summary.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 hover:border-accent">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
          </Link>
        ))}
        {CARD_STATUS.map(({ key, tone }) => (
          <Link key={key} href={`/penugasan?status=${key}`} className="card p-4 hover:border-accent">
            <p className="text-xs text-muted">{STATUS_LABEL[key]}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{count(key)}</p>
          </Link>
        ))}
      </section>

      <section aria-label="Perlu perhatian" className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Perlu perhatian</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card overflow-hidden">
            <h3 className="border-b border-border px-4 py-2.5 text-sm font-semibold">
              Segera berakhir <span className="font-normal text-muted">({soon.length})</span>
            </h3>
            {soon.length ? (
              <ul className="divide-y divide-border">{soon.map((r) => <AttentionItem key={r.id} r={r} />)}</ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted">Tidak ada penugasan yang segera berakhir.</p>
            )}
          </div>
          <div className="card overflow-hidden border-yellow-300 dark:border-yellow-800">
            <h3 className="border-b border-border px-4 py-2.5 text-sm font-semibold">
              Masa tugas belum diketahui <span className="font-normal text-muted">({unknown.length})</span>
            </h3>
            {unknown.length ? (
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">{unknown.map((r) => <AttentionItem key={r.id} r={r} />)}</ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted">Semua penugasan sudah memiliki tanggal selesai.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6" aria-label="Grafik">
        <DashboardCharts
          prodi={countBy(views, (v) => v.prodi, DEFAULT_PRODI)}
          jenis={countBy(views, (v) => v.jenisPegawai, JENIS_PEGAWAI)}
        />
      </section>
    </>
  );
}
