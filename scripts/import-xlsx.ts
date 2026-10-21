/**
 * Impor satu kali dari file xlsx lokal ke tab Google Sheets.
 *
 *   npm run import -- --dry-run          (hanya ringkasan, tidak menulis apa pun)
 *   npm run import                       (menulis; menolak bila sheet sudah berisi data)
 *   npm run import -- --force            (menimpa isi sheet)
 *   npm run import -- "path/ke/file.xlsx" (pilih file; default: file Riwayat*.xlsx di folder proyek)
 */
import { randomUUID } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';
import { HEADERS, SHEET_HEADERS } from '../lib/config';
import { AppError, friendlyGoogleError } from '../lib/errors';
import { COL, assignmentToRow, rowToAssignment } from '../lib/rows';
import { formatRows, getEnv, getSheets, getTabId, quoteTab } from '../lib/sheets';
import { areNamesSimilar, assignKeys, cleanNip, groupTutors, nameKey } from '../lib/tutors';
import type { Assignment } from '../lib/types';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true }); // fallback ke .env

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');

function findFile(): string {
  const given = args.find((a) => !a.startsWith('--'));
  if (given) return path.resolve(given);
  const f = readdirSync(process.cwd()).find((n) => /^Riwayat.*\.xlsx$/i.test(n) && !n.startsWith('~$'));
  if (!f) throw new Error('File xlsx tidak ditemukan. Berikan path: npm run import -- "path/file.xlsx"');
  return path.resolve(f);
}

function cellValue(c: ExcelJS.Cell): unknown {
  const v = c.value as unknown;
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const o = v as Record<string, unknown>;
    if ('result' in o) return o.result;
    if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((t) => t.text).join('');
    if ('text' in o) return o.text;
  }
  return v;
}

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();

interface Parsed {
  rows: Assignment[];
  nos: (number | string)[];
}

async function readWorkbook(file: string): Promise<Parsed> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('Workbook tidak memiliki sheet.');

  const rows: Assignment[] = [];
  const nos: (number | string)[] = [];
  ws.eachRow((r, i) => {
    if (i === 1) return; // header
    const raw: unknown[] = [];
    for (let c = 1; c <= HEADERS.length; c++) raw.push(cellValue(r.getCell(c)));
    if (raw.every((v) => v === null || v === undefined || String(v).trim() === '')) return;
    const a = rowToAssignment(raw);
    a.id = randomUUID();
    a.nip = cleanNip(a.nip);
    for (const k of ['nama', 'jabatanRutin', 'jabatanTugas', 'prodi', 'jenisPegawai', 'unitKerja', 'noSk', 'judulSk', 'pangkat'] as const) {
      a[k] = tidy(a[k]);
    }
    rows.push(a);
    const no = raw[COL.no];
    nos.push(typeof no === 'number' ? no : String(no ?? '').trim());
  });

  // Rapikan nama: semua varian penulisan orang yang sama diseragamkan ke versi terbaku (terpanjang).
  const keys = assignKeys(rows);
  const tutors = new Map(groupTutors(rows).map((t) => [t.key, t]));
  for (const a of rows) a.nama = tutors.get(keys.get(a.id)!)!.nama;
  return { rows, nos };
}

function summarize(file: string, original: Assignment[], cleaned: Assignment[]) {
  const tutors = groupTutors(cleaned);
  const rawNames = new Map<string, Set<string>>();
  original.forEach((a) => {
    const k = nameKey(a.nama);
    (rawNames.get(k) ?? rawNames.set(k, new Set()).get(k)!).add(a.nama);
  });
  const variants = [...rawNames.values()].filter((s) => s.size > 1).map((s) => [...s]);

  const similar: [string, string][] = [];
  for (let i = 0; i < tutors.length; i++) {
    for (let j = i + 1; j < tutors.length; j++) {
      if (areNamesSimilar(tutors[i].nama, tutors[j].nama)) similar.push([tutors[i].nama, tutors[j].nama]);
    }
  }
  const blank = (f: (a: Assignment) => string | null) => cleaned.filter((a) => !f(a)).length;

  console.log(`File            : ${path.basename(file)}`);
  console.log(`Jumlah baris    : ${cleaned.length}`);
  console.log(`Tutor unik      : ${tutors.length}`);
  console.log(`SK unik         : ${new Set(cleaned.map((a) => a.noSk).filter(Boolean)).size}`);
  console.log(`NIP kosong      : ${blank((a) => a.nip)} baris`);
  console.log(`Pangkat kosong  : ${blank((a) => a.pangkat)} baris (termasuk "-")`);
  console.log(`Tgl mulai kosong: ${blank((a) => a.tanggalMulai)} baris`);
  console.log(`Tgl selesai kosong: ${blank((a) => a.tanggalSelesai)} baris`);
  console.log(`\nNama yang ditulis berbeda tapi dianggap orang yang sama (${variants.length}):`);
  variants.forEach((v) => console.log(`  - ${v.map((x) => `"${x}"`).join('  ≈  ')}`));
  if (!variants.length) console.log('  (tidak ada)');
  console.log(`\nNama mirip tapi dianggap orang berbeda, mohon dicek manual (${similar.length}):`);
  similar.forEach(([a, b]) => console.log(`  - "${a}"  ?  "${b}"`));
  if (!similar.length) console.log('  (tidak ada)');
}

async function ensureTab(): Promise<void> {
  const { sheets, env } = getSheets();
  const res = await sheets.spreadsheets.get({ spreadsheetId: env.sheetId, fields: 'sheets.properties.title' });
  if (res.data.sheets?.some((s) => s.properties?.title === env.tab)) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: env.sheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: env.tab } } }] },
  });
  console.log(`Tab "${env.tab}" belum ada, dibuat otomatis.`);
}

async function main() {
  const file = findFile();
  if (!existsSync(file)) throw new Error(`File tidak ada: ${file}`);

  // Baca dua kali: versi mentah (hanya untuk laporan varian nama) dan versi bersih.
  const { rows, nos } = await readWorkbook(file);
  const rawWb = new ExcelJS.Workbook();
  await rawWb.xlsx.readFile(file);
  const original: Assignment[] = [];
  rawWb.worksheets[0].eachRow((r, i) => {
    if (i === 1) return;
    const raw: unknown[] = [];
    for (let c = 1; c <= HEADERS.length; c++) raw.push(cellValue(r.getCell(c)));
    if (raw.every((v) => v === null || v === undefined || String(v).trim() === '')) return;
    original.push({ ...rowToAssignment(raw), nama: tidy(String(raw[COL.nama] ?? '')), id: '' });
  });

  summarize(file, original, rows);

  if (DRY) {
    console.log('\nMode --dry-run: tidak ada data yang ditulis.');
    return;
  }

  getEnv(); // validasi variabel lingkungan sebelum menyentuh Google
  await ensureTab();
  const { sheets, env } = getSheets();
  const tab = quoteTab(env.tab);

  const existing = await sheets.spreadsheets.values.get({ spreadsheetId: env.sheetId, range: `${tab}!A1:O` });
  const hasData = (existing.data.values ?? []).slice(1).some((r) => r.some((c) => String(c ?? '').trim() !== ''));
  if (hasData && !FORCE) {
    throw new AppError(
      `Tab "${env.tab}" sudah berisi data. Impor dibatalkan agar data tidak tertimpa. Gunakan --force bila memang ingin menimpa.`,
    );
  }
  if (hasData || (existing.data.values ?? []).length) {
    await sheets.spreadsheets.values.clear({ spreadsheetId: env.sheetId, range: `${tab}!A1:O` });
  }

  const values = [SHEET_HEADERS, ...rows.map((a, i) => assignmentToRow(a, nos[i] === '' ? i + 1 : nos[i]))];
  await sheets.spreadsheets.values.update({
    spreadsheetId: env.sheetId,
    range: `${tab}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
  await formatRows(2, rows.length + 1);

  // Header tebal + baris pertama dibekukan.
  const sheetId = await getTabId();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: env.sheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
      ],
    },
  });
  console.log(`\nSelesai: ${rows.length} baris ditulis ke tab "${env.tab}".`);
}

main().catch((e) => {
  const err = e instanceof AppError || !(e as { code?: unknown })?.code ? e : friendlyGoogleError(e);
  console.error(`\nGagal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
