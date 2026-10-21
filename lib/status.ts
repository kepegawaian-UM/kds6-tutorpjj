import { EXPIRING_SOON_DAYS } from './config';
import { diffDays, todayJakarta } from './dates';
import type { Assignment, StatusInfo } from './types';

type DatesOnly = Pick<Assignment, 'tanggalMulai' | 'tanggalSelesai'>;

export function getStatus(a: DatesOnly, today: string = todayJakarta()): StatusInfo {
  const startMissing = !a.tanggalMulai;
  if (!a.tanggalSelesai) return { status: 'belum', daysLeft: null, startMissing };
  const daysLeft = diffDays(today, a.tanggalSelesai);
  if (daysLeft < 0) return { status: 'berakhir', daysLeft, startMissing };
  if (daysLeft <= EXPIRING_SOON_DAYS) return { status: 'segera', daysLeft, startMissing };
  return { status: 'aktif', daysLeft, startMissing };
}
