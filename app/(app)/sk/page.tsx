import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, ErrorState, PageHeader } from '@/components/States';
import { STATUS_LABEL } from '@/lib/config';
import { formatDate } from '@/lib/dates';
import { loadViews } from '@/lib/load';
import { needsAttention, summarizeSk } from '@/lib/sk';
import type { StatusKey } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Daftar SK' };

const CHIP: Record<StatusKey, string> = {
  aktif: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  segera: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900',
  berakhir: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  belum: 'bg-yellow-100 text-yellow-900 border-yellow-400 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-600',
};
const ORDER: StatusKey[] = ['aktif', 'segera', 'belum', 'berakhir'];

export default async function SkPage({ searchParams }: { searchParams: Promise<{ q?: string; perhatian?: string }> }) {
  const { q = '', perhatian } = await searchParams;
  const res = await loadViews();
  if (!res.ok) {
    return (
      <>
        <PageHeader title="Daftar SK" />
        <ErrorState message={res.message} />
      </>
    );
  }

  const all = summarizeSk(res.views);
  if (!all.length) {
    return (
      <>
        <PageHeader title="Daftar SK" />
        <EmptyState title="Belum ada SK">Tambahkan penugasan agar SK-nya muncul di sini.</EmptyState>
      </>
    );
  }

  const needle = q.trim().toLowerCase();
  const onlyAttention = perhatian === '1';
  const list = all.filter(
    (s) =>
      (!onlyAttention || needsAttention(s)) &&
      (!needle || `${s.noSk} ${s.judulSk} ${s.prodi.join(' ')}`.toLowerCase().includes(needle)),
  );

  const withActive = all.filter((s) => s.status.aktif + s.status.segera > 0).length;
  const attention = all.filter(needsAttention).length;
  const summary = [
    { label: 'Total SK', value: all.length, href: '/sk' },
    { label: 'SK dengan tutor bertugas', value: withActive, href: '/sk' },
    { label: 'SK perlu perhatian', value: attention, href: '/sk?perhatian=1' },
  ];

  return (
    <>
      <PageHeader title="Daftar SK" subtitle={`${list.length === all.length ? all.length : `${list.length} dari ${all.length}`} SK, terbaru lebih dulu`} />

      <section aria-label="Ringkasan SK" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summary.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 hover:border-accent">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
          </Link>
        ))}
      </section>

      <form role="search" className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} className="field min-w-0 flex-1" placeholder="Cari no SK, judul, atau prodi…" aria-label="Cari SK" />
        <label className="btn cursor-pointer gap-2 normal-case tracking-normal">
          <input type="checkbox" name="perhatian" value="1" defaultChecked={onlyAttention} /> Perlu perhatian saja
        </label>
        <button className="btn btn-primary">Terapkan</button>
      </form>

      {list.length === 0 ? (
        <EmptyState title="SK tidak ditemukan">Ubah kata kunci atau hilangkan filter.</EmptyState>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((s) => (
            <li key={s.noSk} className={`card flex flex-col p-4 ${needsAttention(s) ? 'border-yellow-300 dark:border-yellow-800' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all font-semibold">{s.noSk}</p>
                  <p className="text-xs text-muted">{s.tanggalSk ? `Tanggal SK ${formatDate(s.tanggalSk)}` : 'Tanggal SK belum diisi'}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted">
                  <p><span className="text-base font-semibold text-fg tabular-nums">{s.tutorCount}</span> tutor</p>
                  <p>{s.assignmentCount} penugasan</p>
                </div>
              </div>

              {s.judulSk && <p className="mt-2 line-clamp-2 text-sm text-muted">{s.judulSk}</p>}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.prodi.map((p) => (
                  <span key={p} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs">{p.replace(/^S2 PJJ\s+/i, '')}</span>
                ))}
              </div>

              <p className="mt-3 text-xs tabular-nums text-muted">
                Masa tugas: {s.mulai ? formatDate(s.mulai) : '?'} – {s.selesai ? formatDate(s.selesai) : '?'}
                {s.startMissing > 0 && <> · {s.startMissing} tanggal mulai kosong</>}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {ORDER.filter((k) => s.status[k] > 0).map((k) => (
                  <span key={k} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${CHIP[k]}`}>
                    {s.status[k]} {STATUS_LABEL[k].toLowerCase()}
                  </span>
                ))}
              </div>

              <Link href={`/penugasan?sk=${encodeURIComponent(s.noSk)}`} className="btn mt-4 self-start">
                Lihat penugasan
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
