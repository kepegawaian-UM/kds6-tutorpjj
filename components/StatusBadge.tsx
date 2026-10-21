import { STATUS_LABEL } from '@/lib/config';
import type { StatusKey } from '@/lib/types';
import { IconClock, IconWarning } from './Icons';

const STYLE: Record<StatusKey, string> = {
  aktif: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  segera: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900',
  berakhir: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  // Sengaja mencolok: belum aktif dan belum berakhir.
  belum: 'bg-yellow-100 text-yellow-900 border-yellow-400 font-semibold dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-600',
};

export function StatusBadge({ status, daysLeft }: { status: StatusKey; daysLeft: number | null }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLE[status]}`}>
      {status === 'belum' && <IconWarning />}
      {status === 'segera' && <IconClock />}
      {STATUS_LABEL[status]}
      {status === 'segera' && daysLeft !== null && <> · {daysLeft === 0 ? 'hari ini' : `${daysLeft} hari lagi`}</>}
    </span>
  );
}

/** Penanda kualitas data, terpisah dari status masa tugas. */
export function StartMissingBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted">
      Tanggal mulai kosong
    </span>
  );
}
