import { todayJakarta } from './dates';
import { getStatus } from './status';
import { assignKeys } from './tutors';
import type { Assignment, StatusInfo } from './types';

/**
 * Petunjuk perpanjangan untuk penugasan "belum diketahui" yang perkiraannya sudah lewat.
 * - sama: ada SK lebih baru untuk tutor yang sama di prodi yang sama
 * - lain: tidak di prodi ini, tetapi tutor punya SK lebih baru di prodi lain
 * - tidak: tidak ada SK lebih baru sama sekali (perlu verifikasi)
 */
export interface Renewal {
  kind: 'sama' | 'lain' | 'tidak';
  noSk?: string;
  prodi?: string;
}

/** Penugasan beserta status dan kunci tutor (dihitung di server). */
export type AssignmentView = Assignment & StatusInfo & { tutorKey: string; no: number; renewal: Renewal | null };

/** b dianggap lebih baru dari a: tanggal SK lebih akhir, seri dipecah oleh tanggal mulai. */
function isNewer(a: Assignment, b: Assignment): boolean {
  const sk = (b.tanggalSk ?? '').localeCompare(a.tanggalSk ?? '');
  if (sk) return sk > 0;
  return (b.tanggalMulai ?? '') > (a.tanggalMulai ?? '');
}

const latest = (xs: Assignment[]) => xs.reduce((m, x) => (isNewer(m, x) ? x : m));

export function toViews(rows: Assignment[], today: string = todayJakarta()): AssignmentView[] {
  const keys = assignKeys(rows);
  const byTutor = new Map<string, Assignment[]>();
  for (const r of rows) {
    const k = keys.get(r.id)!;
    const g = byTutor.get(k);
    if (g) g.push(r);
    else byTutor.set(k, [r]);
  }

  return rows.map((r, i) => {
    const st = getStatus(r, today);
    let renewal: Renewal | null = null;
    if (st.status === 'belum' && st.estimateExpired) {
      const newer = (byTutor.get(keys.get(r.id)!) ?? []).filter((x) => x.id !== r.id && x.noSk !== r.noSk && isNewer(r, x));
      const same = newer.filter((x) => x.prodi === r.prodi);
      if (same.length) {
        const l = latest(same);
        renewal = { kind: 'sama', noSk: l.noSk, prodi: l.prodi };
      } else if (newer.length) {
        const l = latest(newer);
        renewal = { kind: 'lain', noSk: l.noSk, prodi: l.prodi };
      } else {
        renewal = { kind: 'tidak' };
      }
    }
    return { ...r, ...st, tutorKey: keys.get(r.id)!, no: i + 1, renewal };
  });
}
