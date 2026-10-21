import { TIME_ZONE } from './config';
import type { IsoDate } from './types';

const MS_DAY = 86_400_000;
/** Epoch serial date Excel/Sheets: 30 Des 1899. */
const SERIAL_EPOCH_UTC = Date.UTC(1899, 11, 30);

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function validParts(y: number, m: number, d: number): boolean {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function toIso(y: number, m: number, d: number): IsoDate {
  if (!validParts(y, m, d)) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function serialToIso(serial: number): IsoDate {
  if (!Number.isFinite(serial)) return null;
  const t = new Date(SERIAL_EPOCH_UTC + Math.floor(serial) * MS_DAY);
  return toIso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function isoToSerial(iso: IsoDate): number | null {
  if (!iso) return null;
  const m = ISO_RE.exec(iso);
  if (!m) return null;
  return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - SERIAL_EPOCH_UTC) / MS_DAY);
}

/**
 * Menerima serial number, Date, atau teks (dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd).
 * Mengembalikan null untuk kosong atau tidak terbaca.
 */
export function parseDateValue(v: unknown): IsoDate {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : toIso(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  }
  if (typeof v === 'number') return serialToIso(v);
  const s = String(v).trim();
  if (!s || s === '-') return null;
  if (/^\d+(\.\d+)?$/.test(s)) return serialToIso(Number(s));
  let m = ISO_RE.exec(s);
  if (m) return toIso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s);
  if (m) return toIso(+m[3], +m[2], +m[1]);
  return null;
}

/** Tanggal hari ini di Asia/Jakarta sebagai "YYYY-MM-DD". */
export function todayJakarta(now: Date = new Date()): string {
  // Locale en-CA menghasilkan format YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Selisih hari (b - a) antar dua tanggal ISO. */
export function diffDays(a: string, b: string): number {
  const ma = ISO_RE.exec(a)!;
  const mb = ISO_RE.exec(b)!;
  return Math.round((Date.UTC(+mb[1], +mb[2] - 1, +mb[3]) - Date.UTC(+ma[1], +ma[2] - 1, +ma[3])) / MS_DAY);
}

/** "dd/mm/yyyy" untuk tampilan dan ekspor. */
export function formatDate(iso: IsoDate): string {
  if (!iso) return '';
  const m = ISO_RE.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Tambah (atau kurangi) hari pada tanggal ISO. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return toIso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())!;
}
