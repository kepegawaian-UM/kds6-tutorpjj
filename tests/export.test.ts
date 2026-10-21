import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { buildCsv, buildXlsx, exportFilename } from '@/lib/export';
import { applyFilters, parseFilters } from '@/lib/filters';
import { toViews } from '@/lib/view';
import type { Assignment } from '@/lib/types';

const mk = (p: Partial<Assignment>): Assignment => ({
  id: Math.random().toString(36), nip: '', nama: 'Wariadi, M.Pd', pangkat: '', jabatanRutin: 'Guru', jabatanTugas: 'Tutor PJJ',
  prodi: 'S2 PJJ Pendidikan Dasar', jenisPegawai: 'Guru Luar UM', unitKerja: 'Dinas', noSk: '30.4.367/UN32/KP/2026',
  tanggalSk: '2026-04-30', judulSk: 'Judul, dengan koma', tanggalMulai: null, tanggalSelesai: '2026-12-31', ...p,
});

describe('ekspor', () => {
  const rows = [mk({}), mk({ nama: 'Mujiono, M.Pd', tanggalMulai: '2026-02-09' })];

  it('xlsx: kolom A-N, header tebal, freeze, tanggal dd/mm/yyyy, NO berurutan', async () => {
    const buf = await buildXlsx(rows);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    expect(ws.columnCount).toBe(14);
    expect(ws.getRow(1).getCell(1).value).toBe('NO');
    expect(ws.getRow(1).getCell(14).value).toBe('Tanggal Selesai');
    expect(ws.getRow(1).font?.bold).toBe(true);
    expect(ws.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
    expect(ws.getRow(2).getCell(1).value).toBe(1);
    expect(ws.getRow(3).getCell(1).value).toBe(2);
    expect(ws.getRow(3).getCell(13).numFmt).toBe('dd/mm/yyyy');
    expect(ws.getRow(2).getCell(13).value).toBeNull();
  });

  it('csv: BOM, kutip untuk koma, tanggal dd/mm/yyyy', () => {
    const csv = buildCsv(rows);
    expect(csv.startsWith('﻿NO,NIP,NAMA')).toBe(true);
    expect(csv).toContain('"Judul, dengan koma"');
    expect(csv).toContain('09/02/2026');
  });

  it('nama file', () => expect(exportFilename('2026-10-21', 'xlsx')).toBe('Riwayat_Penugasan_Tutor_PJJ_2026-10-21.xlsx'));
});

describe('filter', () => {
  const views = toViews(
    [mk({ nama: 'Arbayah, S.Pd., M.Pd' }), mk({ nama: 'Mujiono, M.Pd', prodi: 'S2 PJJ Pendidikan Nonformal', tanggalSelesai: null })],
    '2026-10-21',
  );
  it('mencari tanpa peduli tanda baca', () => {
    expect(applyFilters(views, parseFilters({ q: 'arbayah spd mpd' }))).toHaveLength(1);
  });
  it('memfilter status dan prodi', () => {
    expect(applyFilters(views, parseFilters({ status: 'berakhir' }))).toHaveLength(1); // selesai kosong -> perkiraan 30/06/2026
    expect(applyFilters(views, parseFilters({ prodi: 'S2 PJJ Pendidikan Dasar' }))).toHaveLength(1);
  });
});
