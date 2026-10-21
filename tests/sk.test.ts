import { describe, expect, it } from 'vitest';
import { summarizeSk } from '@/lib/sk';
import { toViews } from '@/lib/view';
import type { Assignment } from '@/lib/types';

let n = 0;
const mk = (p: Partial<Assignment>): Assignment => ({
  id: `i${++n}`, nip: '', nama: 'A', pangkat: '', jabatanRutin: '', jabatanTugas: '', prodi: 'S2 PJJ Pendidikan Dasar',
  jenisPegawai: 'Guru Luar UM', unitKerja: '', noSk: 'SK/1', tanggalSk: '2026-04-30', judulSk: 'J',
  tanggalMulai: '2026-05-01', tanggalSelesai: '2026-12-31', ...p,
});

describe('summarizeSk', () => {
  const views = toViews(
    [
      mk({ nama: 'Wariadi, M.Pd', prodi: 'S2 PJJ Pendidikan Dasar' }),
      mk({ nama: 'Wariadi, M.Pd', prodi: 'S2 PJJ Pendidikan Nonformal', tanggalSelesai: null }),
      mk({ nama: 'Mujiono, M.Pd', tanggalMulai: null }),
      mk({ noSk: 'SK/2', tanggalSk: '2026-08-21', tanggalSelesai: '2026-01-01', nama: 'B' }),
    ],
    '2026-10-21',
  );
  const s = summarizeSk(views);

  it('mengelompokkan per no SK, terbaru dulu', () => {
    expect(s.map((x) => x.noSk)).toEqual(['SK/2', 'SK/1']);
  });
  it('menghitung tutor unik, penugasan, prodi, dan status', () => {
    const sk1 = s[1];
    expect(sk1).toMatchObject({ tutorCount: 2, assignmentCount: 3, startMissing: 1 });
    expect(sk1.prodi).toHaveLength(2);
    expect(sk1.status).toEqual({ aktif: 2, segera: 0, berakhir: 1, belum: 0 });
    expect(sk1.selesai).toBe('2026-12-31');
  });
});
