import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, ErrorState, PageHeader } from '@/components/States';
import { STATUS_LABEL } from '@/lib/config';
import { formatDate } from '@/lib/dates';
import { loadViews } from '@/lib/load';
import { summarizeSk } from '@/lib/sk';
import type { StatusKey } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SK' };

const CHIP: Record<StatusKey, string> = {
  aktif: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  segera: 'bg-orange-50 text-orange-800 border-orange-200',
  berakhir: 'bg-slate-100 text-slate-600 border-slate-200',
  belum: 'bg-yellow-100 text-yellow-900 border-yellow-400',
};
const ORDER: StatusKey[] = ['aktif', 'segera', 'belum', 'berakhir'];

export default async function SkPage() {
  const res = await loadViews();
  if (!res.ok) {
    return (
      <>
        <PageHeader title="SK" />
        <ErrorState message={res.message} />
      </>
    );
  }

  const list = summarizeSk(res.views);
  if (!list.length) {
    return (
      <>
        <PageHeader title="SK" />
        <EmptyState title="Belum ada SK" />
      </>
    );
  }

  return (
    <>
      <PageHeader title="SK" subtitle={`${list.length} SK, terbaru lebih dulu`} />

      <ul className="grid gap-4 lg:grid-cols-2">
        {list.map((s) => (
          <li key={s.noSk} className="card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all font-semibold">{s.noSk}</p>
                <p className="text-xs text-muted">{s.tanggalSk ? formatDate(s.tanggalSk) : '-'}</p>
              </div>
              <p className="shrink-0 text-right text-xs text-muted">
                <span className="text-lg font-semibold text-fg tabular-nums">{s.tutorCount}</span> tutor
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.prodi.map((p) => (
                <span key={p} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs">{p.replace(/^S2 PJJ\s+/i, '')}</span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {ORDER.filter((k) => s.status[k] > 0).map((k) => (
                <span key={k} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${CHIP[k]}`}>
                  {s.status[k]} {STATUS_LABEL[k].toLowerCase()}
                </span>
              ))}
            </div>

            <Link href={`/penugasan?sk=${encodeURIComponent(s.noSk)}`} className="link-text mt-4 self-start">
              Lihat penugasan
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
