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
