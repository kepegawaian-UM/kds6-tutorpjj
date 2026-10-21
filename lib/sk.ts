import type { StatusKey } from './types';
import type { AssignmentView } from './view';

export interface SkSummary {
  noSk: string;
  tanggalSk: string | null;
  judulSk: string;
  prodi: string[];
  tutorCount: number;
  assignmentCount: number;
  status: Record<StatusKey, number>;
  /** Mulai paling awal dan selesai paling akhir dari tanggal yang terisi. */
  mulai: string | null;
  selesai: string | null;
  startMissing: number;
}

const first = <T>(xs: (T | null | undefined)[]): T | null => xs.find((x) => x !== null && x !== undefined && x !== '') ?? null;

/** Ringkasan per nomor SK, terbaru (menurut tanggal SK) lebih dulu. */
export function summarizeSk(views: AssignmentView[]): SkSummary[] {
  const groups = new Map<string, AssignmentView[]>();
  for (const v of views) {
    if (!v.noSk) continue;
    const g = groups.get(v.noSk);
    if (g) g.push(v);
    else groups.set(v.noSk, [v]);
  }
  const out: SkSummary[] = [];
  for (const [noSk, rows] of groups) {
    const status: Record<StatusKey, number> = { aktif: 0, segera: 0, berakhir: 0, belum: 0 };
    rows.forEach((r) => status[r.status]++);
    const mulai = rows.map((r) => r.tanggalMulai).filter((d): d is string => !!d).sort();
    const selesai = rows.map((r) => r.endDate).filter((d): d is string => !!d).sort();
    out.push({
      noSk,
      tanggalSk: first(rows.map((r) => r.tanggalSk)),
      judulSk: first(rows.map((r) => r.judulSk)) ?? '',
      prodi: [...new Set(rows.map((r) => r.prodi).filter(Boolean))],
      tutorCount: new Set(rows.map((r) => r.tutorKey)).size,
      assignmentCount: rows.length,
      status,
      mulai: mulai[0] ?? null,
      selesai: selesai[selesai.length - 1] ?? null,
      startMissing: rows.filter((r) => r.startMissing).length,
    });
  }
  return out.sort(
    (a, b) => (b.tanggalSk ?? '').localeCompare(a.tanggalSk ?? '') || b.noSk.localeCompare(a.noSk, 'id', { numeric: true }),
  );
}
