import { STATUS_LABEL, shortProdi } from '@/lib/config';
import type { StatusKey } from '@/lib/types';
import { formatDate } from '@/lib/dates';
import type { Renewal } from '@/lib/view';
import { IconClock, IconWarning } from './Icons';

const STYLE: Record<StatusKey, string> = {
  aktif: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  segera: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900',
  berakhir: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  // Sengaja mencolok: belum aktif dan belum berakhir.
  belum: 'bg-yellow-100 text-yellow-900 border-yellow-400 font-semibold dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-600',
};

/** Isi badge untuk penugasan tanpa tanggal selesai: perkiraan akhir semester. */
function belumLabel(estimatedEnd?: string | null, expired?: boolean): string {
  if (!estimatedEnd) return 'Tanggal selesai belum diisi';
  return expired ? `Perkiraan s.d. ${formatDate(estimatedEnd)} · lewat` : `Perkiraan s.d. ${formatDate(estimatedEnd)}`;
}

export function RenewalHint({ renewal }: { renewal: Renewal | null | undefined }) {
  if (!renewal) return null;
  const prodi = renewal.prodi ? shortProdi(renewal.prodi) : undefined;
  if (renewal.kind === 'sama') {
    return <span className="block w-full max-w-[14rem] text-xs text-emerald-700">Sudah ada SK lebih baru di prodi ini: {renewal.noSk}</span>;
  }
  if (renewal.kind === 'lain') {
    return (
      <span className="block w-full max-w-[14rem] text-xs text-muted">
        Bertugas di prodi lain: {prodi} ({renewal.noSk})
      </span>
    );
  }
  return <span className="block w-full max-w-[14rem] text-xs font-medium text-orange-700">Tidak ada SK lebih baru, perlu verifikasi</span>;
}

export function StatusBadge({
  status,
  daysLeft,
  estimatedEnd,
  estimateExpired,
  renewal,
}: {
  status: StatusKey;
  daysLeft: number | null;
  estimatedEnd?: string | null;
  estimateExpired?: boolean;
  renewal?: Renewal | null;
}) {
  return (
    <>
      <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLE[status]}`}>
        {status === 'belum' && (estimatedEnd && !estimateExpired ? <IconClock /> : <IconWarning />)}
        {status === 'segera' && <IconClock />}
        {status === 'belum' ? belumLabel(estimatedEnd, estimateExpired) : STATUS_LABEL[status]}
        {status === 'segera' && daysLeft !== null && <> · {daysLeft === 0 ? 'hari ini' : `${daysLeft} hari lagi`}</>}
      </span>
      {status === 'belum' && estimateExpired && <RenewalHint renewal={renewal} />}
    </>
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
