/**
 * Isi kolom P ("Selesai (perkiraan)") untuk baris yang Tanggal Selesai-nya kosong.
 *
 *   npm run backfill                (dry-run: hanya menampilkan rencana)
 *   npm run backfill -- --apply     (menulis ke Google Sheets)
 *
 * Hanya menyentuh kolom P (dan header P1). Kolom lain tidak diubah. Sel P yang sudah terisi tidak ditimpa
 * (kecuali bila Tanggal Selesai sudah diisi: P dikosongkan karena tidak diperlukan lagi).
 */
import dotenv from 'dotenv';
import { writeFileSync } from 'node:fs';
dotenv.config({ path: '.env.local', quiet: true });
import { PERKIRAAN_HEADER } from '../lib/config';
import { isoToSerial, parseDateValue, formatDate } from '../lib/dates';
import { COL } from '../lib/rows';
import { estimateEnd } from '../lib/semester';
import { formatRows, getSheets, quoteTab } from '../lib/sheets';

const APPLY = process.argv.includes('--apply');
const BACKUP = process.argv.find((a) => a.startsWith('--backup='))?.slice(9);

(async () => {
  const { sheets, env } = getSheets();
  const tab = quoteTab(env.tab);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.sheetId, range: `${tab}!A1:P`, valueRenderOption: 'UNFORMATTED_VALUE', dateTimeRenderOption: 'SERIAL_NUMBER',
  });
  const grid = res.data.values ?? [];
  if (APPLY && BACKUP) writeFileSync(BACKUP, JSON.stringify(grid));

  const updates: { range: string; values: (string | number)[][] }[] = [];
  const plan: string[] = [];
  let filled = 0, cleared = 0, unchanged = 0, noBasis = 0;
  for (let i = 1; i < grid.length; i++) {
    const r = grid[i] ?? [];
    if (!r[COL.nama]) continue;
    const selesai = parseDateValue(r[COL.tanggalSelesai]);
    const current = parseDateValue(r[COL.selesaiPerkiraan]);
    const row = i + 1;
    if (selesai) {
      if (current) { updates.push({ range: `${tab}!P${row}`, values: [['']] }); cleared++; }
      continue;
    }
    if (current) { unchanged++; continue; }
    const est = estimateEnd({ tanggalMulai: parseDateValue(r[COL.tanggalMulai]), tanggalSk: parseDateValue(r[COL.tanggalSk]), tanggalSelesai: null });
    if (!est) { noBasis++; continue; }
    updates.push({ range: `${tab}!P${row}`, values: [[isoToSerial(est)!]] });
    plan.push(`baris ${row}: ${String(r[COL.nama])} | ${String(r[COL.noSk])} -> ${formatDate(est)}`);
    filled++;
  }
  const needHeader = String(grid[0]?.[COL.selesaiPerkiraan] ?? '').trim() !== PERKIRAAN_HEADER;
  plan.forEach((l) => console.log('  ' + l));
  console.log(`Diisi: ${filled} | sudah ada (dibiarkan): ${unchanged} | dikosongkan (selesai sudah terisi): ${cleared} | tanpa dasar tanggal: ${noBasis}`);
  console.log(`Header P1 ${needHeader ? 'akan dibuat' : 'sudah ada'}`);

  if (!APPLY) { console.log('(dry-run, tidak ada yang ditulis. Tambahkan --apply untuk menulis.)'); return; }
  if (needHeader) updates.push({ range: `${tab}!P1`, values: [[PERKIRAAN_HEADER]] });
  if (updates.length) await sheets.spreadsheets.values.batchUpdate({ spreadsheetId: env.sheetId, requestBody: { valueInputOption: 'RAW', data: updates } });
  if (grid.length > 1) await formatRows(2, grid.length);
  console.log(`Selesai: ${updates.length} sel ditulis.`);
})().catch((e) => { console.error('Gagal:', e.message); process.exit(1); });
