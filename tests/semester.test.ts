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

describe('status dengan perkiraan', () => {
  const today = '2026-10-21';
  it('tetap "belum", perkiraan di masa depan tidak ditandai lewat', () => {
    expect(getStatus({ tanggalMulai: '2026-08-21', tanggalSelesai: null }, today)).toMatchObject({
      status: 'belum', estimatedEnd: '2026-12-31', estimateExpired: false,
    });
  });
  it('perkiraan yang sudah lewat hanya ditandai, bukan menjadi berakhir', () => {
    expect(getStatus({ tanggalMulai: '2026-02-09', tanggalSelesai: null }, today)).toMatchObject({
      status: 'belum', estimatedEnd: '2026-06-30', estimateExpired: true,
    });
  });
  it('tanggal selesai terisi: tanpa perkiraan', () => {
    expect(getStatus({ tanggalMulai: '2026-02-09', tanggalSelesai: '2026-12-31' }, today)).toMatchObject({
      estimatedEnd: null, estimateExpired: false,
    });
  });
});
