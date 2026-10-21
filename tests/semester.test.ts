import { describe, expect, it } from 'vitest';
import { estimateEnd, isSemesterEnd, semesterEndOnOrAfter } from '@/lib/semester';
import { getStatus } from '@/lib/status';

describe('semester', () => {
  it('akhir semester pada atau setelah tanggal', () => {
    expect(semesterEndOnOrAfter('2026-02-09')).toBe('2026-06-30');
    expect(semesterEndOnOrAfter('2026-06-30')).toBe('2026-06-30');
    expect(semesterEndOnOrAfter('2026-07-01')).toBe('2026-12-31');
    expect(semesterEndOnOrAfter('2026-08-21')).toBe('2026-12-31');
    expect(semesterEndOnOrAfter('2026-12-31')).toBe('2026-12-31');
    expect(semesterEndOnOrAfter('2027-01-01')).toBe('2027-06-30');
  });
  it('mengenali akhir semester', () => {
    expect(isSemesterEnd('2026-12-31')).toBe(true);
    expect(isSemesterEnd('2026-06-30')).toBe(true);
    expect(isSemesterEnd('2026-08-21')).toBe(false);
    expect(isSemesterEnd(null)).toBe(false);
  });
  it('perkiraan: dasar mulai, lalu SK; kosong bila selesai ada atau tak ada dasar', () => {
    expect(estimateEnd({ tanggalMulai: '2026-08-21', tanggalSelesai: null })).toBe('2026-12-31');
    expect(estimateEnd({ tanggalMulai: null, tanggalSk: '2026-04-30', tanggalSelesai: null })).toBe('2026-06-30');
    expect(estimateEnd({ tanggalMulai: '2026-08-21', tanggalSelesai: '2026-12-31' })).toBeNull();
    expect(estimateEnd({ tanggalMulai: null, tanggalSk: null, tanggalSelesai: null })).toBeNull();
  });
});

describe('status dari tanggal akhir efektif', () => {
  const today = '2026-10-21';
  it('selesai kosong: pakai perkiraan semester (masih ke depan = aktif)', () => {
    expect(getStatus({ tanggalMulai: '2026-08-21', tanggalSelesai: null }, today)).toMatchObject({
      status: 'aktif', endDate: '2026-12-31', endIsEstimate: true,
    });
  });
  it('perkiraan yang sudah lewat = berakhir', () => {
    expect(getStatus({ tanggalMulai: '2026-02-09', tanggalSelesai: null }, today)).toMatchObject({
      status: 'berakhir', endDate: '2026-06-30', endIsEstimate: true,
    });
  });
  it('kolom perkiraan dari Sheet dipakai lebih dulu daripada hitungan', () => {
    expect(getStatus({ tanggalMulai: '2026-02-09', tanggalSelesai: null, selesaiPerkiraan: '2026-12-31' }, today)).toMatchObject({
      status: 'aktif', endDate: '2026-12-31', endIsEstimate: true,
    });
  });
  it('tanggal selesai asli selalu mengalahkan perkiraan', () => {
    expect(getStatus({ tanggalMulai: '2026-02-09', tanggalSelesai: '2026-11-10', selesaiPerkiraan: '2026-06-30' }, today)).toMatchObject({
      status: 'segera', endDate: '2026-11-10', endIsEstimate: false,
    });
  });
  it('tanpa dasar tanggal sama sekali: belum diisi', () => {
    expect(getStatus({ tanggalMulai: null, tanggalSk: null, tanggalSelesai: null }, today)).toMatchObject({
      status: 'belum', endDate: null,
    });
  });
});
