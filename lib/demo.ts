import { randomUUID } from 'node:crypto';
import { addDays, todayJakarta } from './dates';
import { AppError } from './errors';
import type { Assignment, AssignmentInput } from './types';

/**
 * Mode demo (DEMO_MODE=1): data contoh di memori untuk pratinjau tampilan tanpa Google Sheets.
 * Hanya untuk pengembangan lokal; jangan diaktifkan di produksi.
 */
const t = todayJakarta();
const base = {
  nip: '', pangkat: '', jabatanRutin: '', jabatanTugas: 'Tutor PJJ', unitKerja: '',
  judulSk: 'Penugasan sebagai Tutor Pendidikan Jarak Jauh Program Studi Magister Pendidikan Dasar Universitas Negeri Malang',
};
const mk = (p: Partial<AssignmentInput>): Assignment => ({
  id: randomUUID(), ...base, prodi: 'S2 PJJ Pendidikan Dasar', jenisPegawai: 'Guru Luar UM', noSk: '30.4.367/UN32/KP/2026',
  nama: '', tanggalSk: '2026-04-30', tanggalMulai: null, tanggalSelesai: null, ...p,
});

let store: Assignment[] | null = null;
function seed(): Assignment[] {
  return [
    mk({ nama: 'Dr. Made Juniantari, S.Pd., M.Pd.', prodi: 'S2 PJJ Teknologi Pembelajaran', jenisPegawai: 'Dosen Luar UM', jabatanTugas: 'Tutor PJJ Evaluasi Pembelajaran', unitKerja: 'UT Kutai Timur', noSk: '23.2.167/UN32/KP/2026', tanggalSk: '2026-02-23', tanggalMulai: '2026-02-23', tanggalSelesai: addDays(t, 12) }),
    mk({ nama: 'Dr. Handy Ferdiansyah, S.Pd., M.Pd.', prodi: 'S2 PJJ Teknologi Pembelajaran', jenisPegawai: 'Dosen Luar UM', jabatanTugas: 'Tutor PJJ Model Pembelajaran', unitKerja: 'UT Kutai Timur', noSk: '23.2.167/UN32/KP/2026', tanggalSk: '2026-02-23', tanggalMulai: '2026-02-23', tanggalSelesai: addDays(t, 29) }),
    mk({ nama: 'Dr. Anjar Prabowo, S.Pd., M.A', nip: '198603252014041001', pangkat: 'Penata Muda Tk. I, III/b', prodi: 'S2 PJJ Pendidikan Bahasa Inggris', jenisPegawai: 'Dosen UM', unitKerja: 'Jurusan Sastra Inggris', noSk: '9.2.280/UN32/KP/2026', tanggalSk: '2026-02-09', tanggalMulai: '2026-02-09', tanggalSelesai: addDays(t, 140) }),
    mk({ nama: 'Wariadi, M.Pd', prodi: 'S2 PJJ Pendidikan Nonformal', jenisPegawai: 'Pegawai Luar UM', unitKerja: 'YPPSB Sangata Kutai Timur', noSk: '9.2.279/UN32/KP/2026', tanggalSk: '2026-02-09', tanggalMulai: '2026-02-09' }),
    mk({ nama: 'Wariadi, M.Pd', prodi: 'S2 PJJ Pendidikan Matematika', unitKerja: 'Dinas Pendidikan Kabupaten Kutai Timur', noSk: '11.5.213/UN32/KP/2026', tanggalSk: '2026-05-11', tanggalMulai: '2026-05-11', tanggalSelesai: addDays(t, 71) }),
    mk({ nama: 'Wariadi, M.Pd', unitKerja: 'Dinas Pendidikan Kabupaten Kutai Timur', noSk: '21.8.80/UN32.13/KP/2031', tanggalSk: '2026-08-21', tanggalMulai: '2026-08-21' }),
    mk({ nama: 'Arbayah, S.Pd., M.Pd', prodi: 'S2 PJJ Pendidikan Bahasa Indonesia', jenisPegawai: 'Pegawai Luar UM', unitKerja: 'SMPN Terpadu Unggulan 1 Tana Tidung', noSk: '9.2.281/UN32/KP/2026', tanggalSk: '2026-02-09', tanggalMulai: '2026-02-09', tanggalSelesai: addDays(t, -20) }),
    mk({ nama: 'Arbayah, S.Pd., M.Pd.', unitKerja: 'Dinas Pendidikan Kabupaten Tana Tidung', noSk: '21.8.80/UN32.13/KP/2026', tanggalSk: '2026-08-21', tanggalMulai: '2026-08-21', tanggalSelesai: addDays(t, 200) }),
    mk({ nama: 'Mujiono, M.Pd', prodi: 'S2 PJJ Pendidikan Matematika', unitKerja: 'Dinas Pendidikan Kabupaten Kutai Timur', noSk: '11.5.213/UN32/KP/2026', tanggalSk: '2026-05-11', tanggalMulai: '2026-05-11', tanggalSelesai: addDays(t, 71) }),
    mk({ nama: 'Siti Sani, M.Pd', prodi: 'S2 PJJ Pendidikan Dasar', unitKerja: 'SDN 1 Sangatta', noSk: '30.4.367/UN32/KP/2026', tanggalMulai: '2026-04-30', tanggalSelesai: addDays(t, 71) }),
  ];
}

export const isDemo = () => process.env.DEMO_MODE === '1';
const get = () => (store ??= seed());

export const demoList = async () => get().map((a) => ({ ...a }));
export async function demoCreate(input: AssignmentInput) {
  const a = { id: randomUUID(), ...input };
  get().push(a);
  return a;
}
export async function demoUpdate(id: string, input: AssignmentInput) {
  const s = get();
  const i = s.findIndex((a) => a.id === id);
  if (i < 0) throw new AppError('Data tidak ditemukan.', 404);
  s[i] = { id, ...input };
  return s[i];
}
export async function demoDelete(id: string) {
  const s = get();
  const i = s.findIndex((a) => a.id === id);
  if (i < 0) throw new AppError('Data tidak ditemukan.', 404);
  s.splice(i, 1);
}
