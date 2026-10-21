import { EXPIRING_SOON_DAYS } from './config';
import { diffDays, todayJakarta } from './dates';
import { estimateEnd } from './semester';
import type { Assignment, StatusInfo } from './types';

type DatesOnly = Pick<Assignment, 'tanggalMulai' | 'tanggalSelesai'> & Partial<Pick<Assignment, 'tanggalSk'>>;

export function getStatus(a: DatesOnly, today: string = todayJakarta()): StatusInfo {
  const startMissing = !a.tanggalMulai;
  const none = { estimatedEnd: null, estimateExpired: false };
  if (!a.tanggalSelesai) {
    // Kategori tetap terpisah dari Aktif/Berakhir; perkiraan hanya petunjuk.
    const estimatedEnd = estimateEnd({ tanggalMulai: a.tanggalMulai, tanggalSk: a.tanggalSk ?? null, tanggalSelesai: null });
    return { status: 'belum', daysLeft: null, startMissing, estimatedEnd, estimateExpired: !!estimatedEnd && estimatedEnd < today };
  }
  const daysLeft = diffDays(today, a.tanggalSelesai);
  if (daysLeft < 0) return { status: 'berakhir', daysLeft, startMissing, ...none };
  if (daysLeft <= EXPIRING_SOON_DAYS) return { status: 'segera', daysLeft, startMissing, ...none };
  return { status: 'aktif', daysLeft, startMissing, ...none };
}
