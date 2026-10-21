import { describe, expect, it } from 'vitest';
import { ASAL_LAINNYA, asalBreakdown, asalWilayah } from '@/lib/asal';
import type { Tutor } from '@/lib/types';

const t = (unitKerja: string, jenisPegawai = 'Guru Luar UM', jabatanRutin = ''): Tutor => ({
  key: unitKerja + Math.random(), nama: 'X', nip: '', pangkat: '', jenisPegawai, jabatanRutin, unitKerja, jumlahPenugasan: 1,
});

describe('asal tutor', () => {
  it('mengelompokkan per wilayah dari teks unit kerja', () => {
    expect(asalWilayah(t('UT Tana Tidung', 'Dosen Luar UM'))).toBe('Kab. Tana Tidung');
    expect(asalWilayah(t('SMAN 1 Tana Tidung'))).toBe('Kab. Tana Tidung');
    expect(asalWilayah(t('SMK Negeri 2 Sangatta Utara'))).toBe('Kab. Kutai Timur');
    expect(asalWilayah(t('YPPSB Sangata Kutai Timur'))).toBe('Kab. Kutai Timur');
    expect(asalWilayah(t('SMP Negeri 3 Bontang'))).toBe('Kota Bontang');
    expect(asalWilayah(t('Universitas Borneo Tarakan', 'Dosen Luar UM'))).toBe('Kota Tarakan');
    expect(asalWilayah(t('Universitas Terbuka '))).toBe('Universitas Terbuka');
  });
  it('Dosen UM masuk Malang; tak dikenal masuk Lainnya', () => {
    expect(asalWilayah(t('Departemen Sastra Inggris', 'Dosen UM'))).toBe('Kota Malang (UM)');
    expect(asalWilayah(t('Sekolah Antah Berantah'))).toBe(ASAL_LAINNYA);
  });
  it('rincian dihitung per tutor dan terurut', () => {
    const r = asalBreakdown([t('UT Tana Tidung'), t('UT Tana Tidung'), t('SMAN 1 Tana Tidung'), t('SMP Negeri 3 Bontang')]);
    expect(r[0]).toMatchObject({ label: 'Kab. Tana Tidung', value: 3 });
    expect(r[0].units[0]).toEqual({ unit: 'UT Tana Tidung', count: 2 });
    expect(r[1]).toMatchObject({ label: 'Kota Bontang', value: 1 });
  });
});
