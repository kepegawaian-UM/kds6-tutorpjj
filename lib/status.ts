import { EXPIRING_SOON_DAYS } from './config';
import { diffDays, todayJakarta } from './dates';
import { estimateEnd } from './semester';
import type { Assignment, StatusInfo } from './types';

type DatesOnly = Pick<Assignment, 'tanggalMulai' | 'tanggalSelesai'> & Partial<Pick<Assignment, 'tanggalSk' | 'selesaiPerkiraan'>>;

/**
 * Status dari tanggal akhir efektif: Tanggal Selesai bila ada; jika kosong, perkiraan akhir semester
 * (kolom P di Sheet, atau dihitung langsung bila kolom P kosong). "belum" hanya bila tidak ada dasar sama sekali.
 */
export function getStatus(a: DatesOnly, today: string = todayJakarta()): StatusInfo {
  const startMissing = !a.tanggalMulai;
  const estimate = a.tanggalSelesai
    ? null
    : a.selesaiPerkiraan ?? estimateEnd({ tanggalMulai: a.tanggalMulai, tanggalSk: a.tanggalSk ?? null, tanggalSelesai: null });
  const endDate = a.tanggalSelesai ?? estimate;
  const endIsEstimate = !a.tanggalSelesai && !!estimate;
  if (!endDate) return { status: 'belum', daysLeft: null, startMissing, endDate: null, endIsEstimate: false };

  const daysLeft = diffDays(today, endDate);
  const status = daysLeft < 0 ? 'berakhir' : daysLeft <= EXPIRING_SOON_DAYS ? 'segera' : 'aktif';
  return { status, daysLeft, startMissing, endDate, endIsEstimate };
}
