import { describe, expect, it } from 'vitest';
import { assignmentSchema, composeJudulSk } from '@/lib/validation';
import { assignmentToRow, rowToAssignment } from '@/lib/rows';

const base = {
  nama: 'Wariadi, M.Pd', prodi: 'S2 PJJ Pendidikan Dasar', jenisPegawai: 'Guru Luar UM', noSk: '30.4.367/UN32/KP/2026',
};

describe('assignmentSchema', () => {
  it('menyusun judul SK otomatis bila kosong', () => {
    const r = assignmentSchema.parse({ ...base });
    expect(r.judulSk).toBe(
      'Penugasan sebagai Tutor Pendidikan Jarak Jauh Program Studi Magister Pendidikan Dasar Universitas Negeri Malang',
    );
    expect(composeJudulSk('S2 PJJ Teknologi Pembelajaran')).toContain('Magister Teknologi Pembelajaran');
  });
  it('NIP harus 18 digit bila diisi', () => {
    expect(assignmentSchema.safeParse({ ...base, nip: '123' }).success).toBe(false);
    expect(assignmentSchema.safeParse({ ...base, nip: '198001012005011001' }).success).toBe(true);
    expect(assignmentSchema.safeParse({ ...base, nip: '' }).success).toBe(true);
  });
  it('selesai tidak boleh sebelum mulai; kosong diperbolehkan', () => {
    expect(assignmentSchema.safeParse({ ...base, tanggalMulai: '2026-05-01', tanggalSelesai: '2026-04-30' }).success).toBe(false);
    const ok = assignmentSchema.parse({ ...base, tanggalMulai: '', tanggalSelesai: '' });
    expect(ok.tanggalMulai).toBeNull();
    expect(ok.tanggalSelesai).toBeNull();
  });
  it('menolak jenis pegawai di luar daftar', () => {
    expect(assignmentSchema.safeParse({ ...base, jenisPegawai: 'Lainnya' }).success).toBe(false);
  });
});

describe('rows', () => {
  it('membersihkan pangkat "-" dan titik koma di judul, serta konversi serial', () => {
    const row = [1, '', 'X', '-', '', '', 'P', 'Dosen UM', '', 'SK/1', 46076, 'Judul;', 46076, '', 'abc'];
    const a = rowToAssignment(row);
    expect(a).toMatchObject({ pangkat: '', judulSk: 'Judul', tanggalSk: '2026-02-23', tanggalSelesai: null, id: 'abc' });
  });
  it('menulis tanggal sebagai serial dan kosong sebagai string kosong', () => {
    const a = rowToAssignment([1, '', 'X', '', '', '', 'P', 'Dosen UM', '', 'SK/1', 46076, 'J', '', '', 'abc']);
    const out = assignmentToRow(a, 3);
    expect(out[0]).toBe(3);
    expect(out[10]).toBe(46076);
    expect(out[12]).toBe('');
    expect(out).toHaveLength(15);
  });
});
