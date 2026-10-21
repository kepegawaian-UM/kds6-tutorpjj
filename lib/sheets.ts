import { randomUUID } from 'node:crypto';
import { google, type sheets_v4 } from 'googleapis';
import { PERKIRAAN_HEADER } from './config';
import { AppError, friendlyGoogleError } from './errors';
import { demoCreate, demoDelete, demoList, demoUpdate, isDemo } from './demo';
import { COL, assignmentToRow, rowToAssignment } from './rows';
import { estimateEnd } from './semester';
import type { Assignment, AssignmentInput } from './types';

/** Seluruh akses Google Sheets ada di sini (hanya dijalankan di server). */

export interface SheetEnv {
  email: string;
  key: string;
  sheetId: string;
  tab: string;
}

export function getEnv(): SheetEnv {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const missing = [
    !email && 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    !rawKey && 'GOOGLE_PRIVATE_KEY',
    !sheetId && 'GOOGLE_SHEET_ID',
  ].filter(Boolean);
  if (missing.length) {
    throw new AppError(`Konfigurasi belum lengkap: ${missing.join(', ')}. Lihat README untuk panduan.`, 500);
  }
  // Private key sering tersimpan dengan "\n" literal dan/atau tanda kutip.
  const key = rawKey!.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  return { email: email!, key, sheetId: sheetId!, tab: process.env.GOOGLE_SHEET_TAB?.trim() || 'Penugasan' };
}

let cached: { sheets: sheets_v4.Sheets; env: SheetEnv } | null = null;

export function getSheets() {
  if (cached) return cached;
  const env = getEnv();
  const auth = new google.auth.JWT({
    email: env.email,
    key: env.key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  cached = { sheets: google.sheets({ version: 'v4', auth }), env };
  return cached;
}

export const quoteTab = (tab: string) => `'${tab.replace(/'/g, "''")}'`;

async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw friendlyGoogleError(e);
  }
}

const sheetIdCache = new Map<string, number>();
export async function getTabId(): Promise<number> {
  const { sheets, env } = getSheets();
  const k = `${env.sheetId}|${env.tab}`;
  const hit = sheetIdCache.get(k);
  if (hit !== undefined) return hit;
  const res = await sheets.spreadsheets.get({
    spreadsheetId: env.sheetId,
    fields: 'sheets.properties(sheetId,title)',
  });
  const found = res.data.sheets?.find((s) => s.properties?.title === env.tab);
  if (found?.properties?.sheetId == null) {
    throw new AppError('Tab sheet tidak ditemukan. Periksa nama tab (GOOGLE_SHEET_TAB, default "Penugasan").', 502);
  }
  sheetIdCache.set(k, found.properties.sheetId);
  return found.properties.sheetId;
}

/** Format sel satu atau beberapa baris: NIP sebagai teks, tanggal dd/mm/yyyy. Baris 1-based, [start, end]. */
export async function formatRows(startRow: number, endRow: number = startRow) {
  const { sheets, env } = getSheets();
  const sheetId = await getTabId();
  const cell = (col: number, numberFormat: { type: string; pattern: string }) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: startRow - 1, endRowIndex: endRow, startColumnIndex: col, endColumnIndex: col + 1 },
      cell: { userEnteredFormat: { numberFormat } },
      fields: 'userEnteredFormat.numberFormat',
    },
  });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: env.sheetId,
    requestBody: {
      requests: [
        cell(COL.nip, { type: 'TEXT', pattern: '@' }),
        cell(COL.tanggalSk, { type: 'DATE', pattern: 'dd/mm/yyyy' }),
        cell(COL.tanggalMulai, { type: 'DATE', pattern: 'dd/mm/yyyy' }),
        cell(COL.tanggalSelesai, { type: 'DATE', pattern: 'dd/mm/yyyy' }),
        cell(COL.selesaiPerkiraan, { type: 'DATE', pattern: 'dd/mm/yyyy' }),
      ],
    },
  });
}

const isBlankRow = (row: unknown[]) =>
  row.slice(0, COL.id).every((c) => c === undefined || c === null || String(c).trim() === '');

/**
 * Membaca semua penugasan terbaru dari Sheets.
 * Baris tanpa ID (atau ber-ID ganda karena disalin) diberi ID baru dan ditulis balik.
 */
export function listAssignments(): Promise<Assignment[]> {
  if (isDemo()) return demoList();
  return wrap(async () => {
    const { sheets, env } = getSheets();
    const tab = quoteTab(env.tab);
    const [main, nips] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: env.sheetId,
        range: `${tab}!A1:P`,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'SERIAL_NUMBER',
      }),
      // NIP 18 digit melebihi presisi angka, jadi dibaca sebagai teks terformat.
      sheets.spreadsheets.values.get({
        spreadsheetId: env.sheetId,
        range: `${tab}!B1:B`,
        valueRenderOption: 'FORMATTED_VALUE',
      }),
    ]);
    const values = main.data.values ?? [];
    const nipCol = nips.data.values ?? [];

    const out: Assignment[] = [];
    const seen = new Set<string>();
    const fixes: { range: string; values: string[][] }[] = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row || isBlankRow(row)) continue;
      const a = rowToAssignment(row, String(nipCol[i]?.[0] ?? ''));
      if (!a.id || seen.has(a.id)) {
        a.id = randomUUID();
        fixes.push({ range: `${tab}!O${i + 1}`, values: [[a.id]] });
      }
      seen.add(a.id);
      out.push(a);
    }

    if (values.length && String(values[0]?.[COL.id] ?? '').trim() !== 'ID') {
      fixes.push({ range: `${tab}!O1`, values: [['ID']] });
    }
    if (values.length && String(values[0]?.[COL.selesaiPerkiraan] ?? '').trim() !== PERKIRAAN_HEADER) {
      fixes.push({ range: `${tab}!P1`, values: [[PERKIRAAN_HEADER]] });
    }
    if (fixes.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: env.sheetId,
        requestBody: { valueInputOption: 'RAW', data: fixes },
      });
    }
    return out;
  });
}

/** Perkiraan akhir semester untuk kolom P; kosong bila Tanggal Selesai terisi atau tak ada dasar tanggal. */
export function perkiraanFor(input: Pick<AssignmentInput, 'tanggalMulai' | 'tanggalSk' | 'tanggalSelesai'>): string | null {
  return estimateEnd(input);
}

/** Nomor baris (1-based) untuk sebuah ID, dicari ulang dari sheet agar aman terhadap sortir/sisip. */
async function findRowById(id: string): Promise<number> {
  const { sheets, env } = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.sheetId,
    range: `${quoteTab(env.tab)}!O1:O`,
  });
  const idx = (res.data.values ?? []).findIndex((r, i) => i > 0 && String(r?.[0] ?? '').trim() === id);
  if (idx < 0) {
    throw new AppError(
      'Data tidak ditemukan. Mungkin sudah dihapus atau diubah langsung di Google Sheets; muat ulang halaman.',
      404,
    );
  }
  return idx + 1;
}

export function createAssignment(input: AssignmentInput): Promise<Assignment> {
  if (isDemo()) return demoCreate(input);
  return wrap(async () => {
    const { sheets, env } = getSheets();
    const tab = quoteTab(env.tab);
    // Nomor urut dalam SK yang sama (mengikuti kebiasaan file asli).
    const cols = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: env.sheetId,
      ranges: [`${tab}!A2:A`, `${tab}!J2:J`],
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    const nos = cols.data.valueRanges?.[0]?.values ?? [];
    const sks = cols.data.valueRanges?.[1]?.values ?? [];
    let maxNo = 0;
    sks.forEach((r, i) => {
      if (String(r?.[0] ?? '').trim() === input.noSk) maxNo = Math.max(maxNo, Number(nos[i]?.[0]) || 0);
    });

    const a: Assignment = { id: randomUUID(), ...input, selesaiPerkiraan: perkiraanFor(input) };
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: env.sheetId,
      range: `${tab}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [assignmentToRow(a, maxNo + 1)] },
    });
    const m = /!A(\d+)/.exec(res.data.updates?.updatedRange ?? '');
    if (m) await formatRows(Number(m[1]));
    return a;
  });
}

export function updateAssignment(id: string, input: AssignmentInput): Promise<Assignment> {
  if (isDemo()) return demoUpdate(id, input);
  return wrap(async () => {
    const { sheets, env } = getSheets();
    const row = await findRowById(id);
    const a: Assignment = { id, ...input, selesaiPerkiraan: perkiraanFor(input) };
    // Kolom NO (A) dan ID (O) tidak diubah.
    const values = assignmentToRow(a).slice(COL.nip, COL.tanggalSelesai + 1);
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.sheetId,
      range: `${quoteTab(env.tab)}!B${row}:N${row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
    // Kolom P (perkiraan) dihitung ulang dari data terbaru.
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.sheetId,
      range: `${quoteTab(env.tab)}!P${row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[assignmentToRow(a)[COL.selesaiPerkiraan]]] },
    });
    await formatRows(row);
    return a;
  });
}

export function deleteAssignment(id: string): Promise<void> {
  if (isDemo()) return demoDelete(id);
  return wrap(async () => {
    const { sheets, env } = getSheets();
    const row = await findRowById(id);
    const sheetId = await getTabId();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: env.sheetId,
      requestBody: {
        requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: row - 1, endIndex: row } } }],
      },
    });
  });
}
