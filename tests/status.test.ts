import { describe, expect, it } from 'vitest';
import { getStatus } from '@/lib/status';
import { diffDays, formatDate, isoToSerial, parseDateValue, serialToIso, todayJakarta } from '@/lib/dates';

const today = '2026-10-21';
const mk = (s: string | null, m: string | null = '2026-01-01') => ({ tanggalMulai: m, tanggalSelesai: s });

describe('getStatus', () => {
  it('aktif bila > 30 hari', () => expect(getStatus(mk('2026-11-21'), today).status).toBe('aktif'));
  it('batas 30 hari termasuk segera berakhir', () => {
    expect(getStatus(mk('2026-11-20'), today)).toMatchObject({ status: 'segera', daysLeft: 30 });
  });
  it('hari ini = segera (0 hari)', () => {
    expect(getStatus(mk(today), today)).toMatchObject({ status: 'segera', daysLeft: 0 });
  });
  it('berakhir bila sudah lewat', () => expect(getStatus(mk('2026-10-20'), today).status).toBe('berakhir'));
  it('selesai kosong = belum diketahui', () => {
    expect(getStatus(mk(null), today)).toMatchObject({ status: 'belum', daysLeft: null });
  });
  it('menandai tanggal mulai kosong secara terpisah', () => {
    expect(getStatus(mk('2026-12-31', null), today)).toMatchObject({ status: 'aktif', startMissing: true });
  });
});

describe('tanggal', () => {
  it('konversi serial <-> ISO', () => {
    expect(serialToIso(46076)).toBe('2026-02-23');
    expect(isoToSerial('2026-02-23')).toBe(46076);
  });
  it('mengurai teks tanggal', () => {
    expect(parseDateValue('23/02/2026')).toBe('2026-02-23');
    expect(parseDateValue('2026-02-23')).toBe('2026-02-23');
    expect(parseDateValue('31/02/2026')).toBeNull();
    expect(parseDateValue('')).toBeNull();
  });
  it('format dan selisih', () => {
    expect(formatDate('2026-02-09')).toBe('09/02/2026');
    expect(diffDays('2026-10-21', '2026-12-31')).toBe(71);
  });
  it('hari ini memakai zona Asia/Jakarta', () => {
    expect(todayJakarta(new Date('2026-10-20T18:00:00Z'))).toBe('2026-10-21');
  });
});

describe('petunjuk perpanjangan', () => {
  const mk = (p: Partial<import('@/lib/types').Assignment>): import('@/lib/types').Assignment => ({
    id: Math.random().toString(36), nip: '', nama: 'Wariadi, M.Pd', pangkat: '', jabatanRutin: '', jabatanTugas: '',
    prodi: 'S2 PJJ Pendidikan Nonformal', jenisPegawai: 'Guru Luar UM', unitKerja: '', noSk: 'SK/OLD', tanggalSk: '2026-02-09',
    judulSk: '', tanggalMulai: '2026-02-09', tanggalSelesai: null, ...p,
  });
  const today = '2026-10-21';

  it('sama: ada SK lebih baru di prodi yang sama', async () => {
    const { toViews } = await import('@/lib/view');
    const v = toViews([mk({}), mk({ noSk: 'SK/NEW', tanggalSk: '2026-08-21', tanggalMulai: '2026-08-21' })], today);
    expect(v[0].renewal).toMatchObject({ kind: 'sama', noSk: 'SK/NEW' });
  });
  it('lain: SK lebih baru hanya di prodi lain', async () => {
    const { toViews } = await import('@/lib/view');
    const v = toViews([mk({}), mk({ noSk: 'SK/MTK', prodi: 'S2 PJJ Pendidikan Matematika', tanggalSk: '2026-05-11', tanggalMulai: '2026-05-11', tanggalSelesai: '2026-12-31' })], today);
    expect(v[0].renewal).toMatchObject({ kind: 'lain', noSk: 'SK/MTK', prodi: 'S2 PJJ Pendidikan Matematika' });
    expect(v[1].renewal).toBeNull();
  });
  it('tidak: tidak ada SK lebih baru; SK lama tidak dihitung', async () => {
    const { toViews } = await import('@/lib/view');
    const v = toViews([mk({ noSk: 'SK/B', tanggalSk: '2026-05-11' }), mk({ noSk: 'SK/A', tanggalSk: '2026-02-09' })], today);
    expect(v[0].renewal).toEqual({ kind: 'tidak' });
  });
  it('null bila perkiraan belum lewat atau tanggal selesai ada', async () => {
    const { toViews } = await import('@/lib/view');
    const v = toViews([mk({ tanggalMulai: '2026-08-21', tanggalSk: '2026-08-21' }), mk({ tanggalSelesai: '2026-12-31', noSk: 'X' })], today);
    expect(v[0].renewal).toBeNull();
    expect(v[1].renewal).toBeNull();
  });
});
