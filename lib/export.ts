import ExcelJS from 'exceljs';
import { HEADERS } from './config';
import { formatDate } from './dates';
import type { Assignment, IsoDate } from './types';

const WIDTHS = [6, 22, 38, 18, 30, 30, 36, 18, 36, 28, 16, 60, 14, 14];

/** Baris data persis kolom A-N file asli; NO berurutan mengikuti urutan input. */
function toCells(rows: Assignment[]) {
  return rows.map((r, i) => [
    i + 1, r.nip, r.nama, r.pangkat, r.jabatanRutin, r.jabatanTugas, r.prodi, r.jenisPegawai, r.unitKerja,
    r.noSk, r.tanggalSk, r.judulSk, r.tanggalMulai, r.tanggalSelesai,
  ] as (string | number | IsoDate)[]);
}

const DATE_COLS = [10, 12, 13]; // indeks 0-based kolom tanggal

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function buildXlsx(rows: Assignment[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = HEADERS.map((h, i) => ({ header: h, key: String(i), width: WIDTHS[i] }));
  const header = ws.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: 'middle', wrapText: true };

  for (const cells of toCells(rows)) {
    const row = ws.addRow(
      cells.map((c, i) => (DATE_COLS.includes(i) ? (c ? isoToDate(c as string) : null) : (c ?? ''))),
    );
    DATE_COLS.forEach((i) => {
      row.getCell(i + 1).numFmt = 'dd/mm/yyyy';
      row.getCell(i + 1).alignment = { horizontal: 'center' };
    });
    row.getCell(2).numFmt = '@'; // NIP sebagai teks
  }
  ws.getColumn(1).alignment = { horizontal: 'center' };
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV UTF-8 dengan BOM agar terbaca benar di Excel. */
export function buildCsv(rows: Assignment[]): string {
  const lines = [HEADERS.map(csvCell).join(',')];
  for (const cells of toCells(rows)) {
    lines.push(cells.map((c, i) => csvCell(DATE_COLS.includes(i) ? formatDate(c as IsoDate) : c)).join(','));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

export function exportFilename(today: string, ext: 'xlsx' | 'csv'): string {
  return `Riwayat_Penugasan_Tutor_PJJ_${today}.${ext}`;
}
