import { SEMESTER_ENDS } from './config';
import type { IsoDate } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Akhir semester pertama yang jatuh pada atau setelah tanggal `iso`. */
export function semesterEndOnOrAfter(iso: string): string {
  const year = Number(iso.slice(0, 4));
  for (const y of [year, year + 1]) {
    for (const [m, d] of SEMESTER_ENDS) {
      const cand = `${y}-${pad(m)}-${pad(d)}`;
      if (cand >= iso) return cand;
    }
  }
  throw new Error('SEMESTER_ENDS kosong');
}

/** Apakah tanggal tepat di akhir semester. */
export function isSemesterEnd(iso: IsoDate): boolean {
  if (!iso) return false;
  return SEMESTER_ENDS.some(([m, d]) => iso.slice(5) === `${pad(m)}-${pad(d)}`);
}

/**
 * Perkiraan akhir masa tugas, hanya bila Tanggal Selesai kosong.
 * Dasar: tanggal mulai; jika kosong, tanggal SK. Null bila tidak ada dasar.
 */
export function estimateEnd(a: { tanggalMulai: IsoDate; tanggalSk?: IsoDate; tanggalSelesai: IsoDate }): string | null {
  if (a.tanggalSelesai) return null;
  const base = a.tanggalMulai ?? a.tanggalSk ?? null;
  return base ? semesterEndOnOrAfter(base) : null;
}
