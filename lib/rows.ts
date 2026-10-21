import { isoToSerial, parseDateValue } from './dates';
import type { Assignment } from './types';

/** Indeks kolom (0-based) pada sheet: A..N data, O = ID, P = Selesai (perkiraan). */
export const COL = {
  no: 0, nip: 1, nama: 2, pangkat: 3, jabatanRutin: 4, jabatanTugas: 5, prodi: 6, jenisPegawai: 7,
  unitKerja: 8, noSk: 9, tanggalSk: 10, judulSk: 11, tanggalMulai: 12, tanggalSelesai: 13, id: 14, selesaiPerkiraan: 15,
} as const;

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());

/** Pangkat "-" dianggap kosong. */
export function cleanPangkat(v: unknown): string {
  const s = str(v);
  return s === '-' ? '' : s;
}

export function rowToAssignment(row: unknown[], nipText?: string): Assignment {
  const nipRaw = nipText !== undefined ? nipText : row[COL.nip];
  return {
    id: str(row[COL.id]),
    nip: str(nipRaw).replace(/\s/g, ''),
    nama: str(row[COL.nama]),
    pangkat: cleanPangkat(row[COL.pangkat]),
    jabatanRutin: str(row[COL.jabatanRutin]),
    jabatanTugas: str(row[COL.jabatanTugas]),
    prodi: str(row[COL.prodi]),
    jenisPegawai: str(row[COL.jenisPegawai]),
    unitKerja: str(row[COL.unitKerja]),
    noSk: str(row[COL.noSk]),
    tanggalSk: parseDateValue(row[COL.tanggalSk]),
    judulSk: str(row[COL.judulSk]).replace(/;+\s*$/, '').trim(),
    tanggalMulai: parseDateValue(row[COL.tanggalMulai]),
    tanggalSelesai: parseDateValue(row[COL.tanggalSelesai]),
    selesaiPerkiraan: parseDateValue(row[COL.selesaiPerkiraan]),
  };
}

/** Baris A..P untuk ditulis. Tanggal ditulis sebagai serial date; NIP sebagai teks. */
export function assignmentToRow(a: Assignment, no: number | string = ''): (string | number)[] {
  const d = (iso: string | null) => isoToSerial(iso) ?? '';
  return [
    no, a.nip, a.nama, a.pangkat, a.jabatanRutin, a.jabatanTugas, a.prodi, a.jenisPegawai, a.unitKerja,
    a.noSk, d(a.tanggalSk), a.judulSk, d(a.tanggalMulai), d(a.tanggalSelesai), a.id,
    d(a.tanggalSelesai ? null : (a.selesaiPerkiraan ?? null)),
  ];
}
