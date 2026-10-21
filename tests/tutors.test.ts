import { describe, expect, it } from 'vitest';
import { areNamesSimilar, assignKeys, findSimilarNames, findTutorByKey, groupTutors, nameKey } from '@/lib/tutors';
import type { Assignment } from '@/lib/types';

let n = 0;
function row(p: Partial<Assignment>): Assignment {
  return {
    id: `id-${++n}`, nip: '', nama: '', pangkat: '', jabatanRutin: '', jabatanTugas: 'Tutor PJJ',
    prodi: 'S2 PJJ Pendidikan Dasar', jenisPegawai: 'Guru Luar UM', unitKerja: '', noSk: 'X/1',
    tanggalSk: null, judulSk: '', tanggalMulai: null, tanggalSelesai: null, ...p,
  };
}

describe('nameKey', () => {
  it('menyamakan M.Pd dan M.Pd.', () => {
    expect(nameKey('Rudy Umardani, M.Pd')).toBe(nameKey('Rudy Umardani, M.Pd.'));
    expect(nameKey('Arbayah, S.Pd., M.Pd')).toBe(nameKey('Arbayah, S.Pd., M.Pd.'));
  });
  it('mengabaikan huruf besar, spasi ganda, dan spasi/koma di ujung', () => {
    expect(nameKey('  WARIADI ,  M.Pd  ,')).toBe(nameKey('Wariadi, M.Pd'));
  });
});

describe('groupTutors', () => {
  const rows = [
    row({ nama: 'Arbayah, S.Pd., M.Pd', unitKerja: 'SMAN Terpadu Unggulan 1 Tana Tidung', tanggalMulai: '2026-02-09' }),
    row({ nama: 'Arbayah, S.Pd., M.Pd.', unitKerja: 'Dinas Pendidikan Kabupaten Tana Tidung', tanggalMulai: '2026-08-21' }),
    row({ nama: 'Rudy Umardani, M.Pd', pangkat: '-' }),
    row({ nama: 'Rudy Umardani, M.Pd.', pangkat: 'Penata, III/c', tanggalMulai: '2026-08-21' }),
    row({ nama: 'Wariadi, M.Pd', pangkat: '-' }),
    row({ nama: 'Wariadi, M.Pd' }),
    row({ nama: 'Mujiono, M.Pd' }),
    row({ nama: 'Mujiono, M.Pd' }),
  ];
  const tutors = groupTutors(rows);

  it('menggabungkan nama yang hanya beda tanda baca', () => {
    expect(tutors).toHaveLength(4);
    expect(tutors.map((t) => t.jumlahPenugasan)).toEqual([2, 2, 2, 2]);
  });
  it('memakai versi nama terpanjang', () => {
    expect(tutors.find((t) => t.nama.startsWith('Arbayah'))!.nama).toBe('Arbayah, S.Pd., M.Pd.');
    expect(tutors.find((t) => t.nama.startsWith('Rudy'))!.nama).toBe('Rudy Umardani, M.Pd.');
  });
  it('mengambil pangkat non-kosong yang bukan "-"', () => {
    expect(tutors.find((t) => t.nama.startsWith('Rudy'))!.pangkat).toBe('Penata, III/c');
    expect(tutors.find((t) => t.nama.startsWith('Wariadi'))!.pangkat).toBe('');
  });
  it('mengambil unit kerja dari penugasan terbaru', () => {
    expect(tutors.find((t) => t.nama.startsWith('Arbayah'))!.unitKerja).toBe('Dinas Pendidikan Kabupaten Tana Tidung');
  });
});

describe('kunci tutor', () => {
  it('memakai NIP sebagai kunci utama walau nama berbeda', () => {
    const a = row({ nip: '198001012005011001', nama: 'Dr. Budi' });
    const b = row({ nip: '198001012005011001', nama: 'Budi Santoso' });
    const keys = assignKeys([a, b]);
    expect(keys.get(a.id)).toBe(keys.get(b.id));
  });
  it('baris tanpa NIP bergabung ke NIP bila nama sama', () => {
    const a = row({ nip: '198001012005011001', nama: 'Mujiono, M.Pd' });
    const b = row({ nama: 'Mujiono, M.Pd.' });
    const t = groupTutors([a, b]);
    expect(t).toHaveLength(1);
    expect(t[0].nip).toBe('198001012005011001');
  });
  it('findTutorByKey mengembalikan riwayat terbaru dulu', () => {
    const a = row({ nama: 'Wariadi, M.Pd', tanggalMulai: '2026-02-09' });
    const b = row({ nama: 'Wariadi, M.Pd', tanggalMulai: '2026-08-21' });
    const key = assignKeys([a, b]).get(a.id)!;
    expect(findTutorByKey([a, b], key)!.rows[0].id).toBe(b.id);
  });
});

describe('nama mirip', () => {
  it('mendeteksi beda ejaan kecil dan mengabaikan gelar', () => {
    expect(areNamesSimilar('Mujiono, M.Pd', 'Mujiyono, M.Pd')).toBe(true);
    expect(areNamesSimilar('Dr. Wariadi', 'Wariadi, M.Pd')).toBe(true);
    expect(areNamesSimilar('Wariadi, M.Pd', 'Warni, M.Pd')).toBe(false);
  });
  it('tidak melaporkan nama identik setelah normalisasi', () => {
    expect(findSimilarNames('Rudy Umardani, M.Pd', ['Rudy Umardani, M.Pd.', 'Rudy Umardany, M.Pd'])).toEqual([
      'Rudy Umardany, M.Pd',
    ]);
  });
});
