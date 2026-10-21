import { beforeEach, describe, expect, it, vi } from 'vitest';

// Sheet palsu di memori: baris 1 = header, sisanya data. Kolom A..O.
let grid: unknown[][] = [];
const calls: { type: string; req: any }[] = [];

const rangeRow = (range: string) => Number(/!(?:[A-Z]+)(\d+)/.exec(range)?.[1] ?? 1);

vi.mock('googleapis', () => {
  const values = {
    get: async ({ range, valueRenderOption }: any) => {
      if (/!B1:B$/.test(range)) return { data: { values: grid.map((r) => [String(r[1] ?? '')]) } };
      if (/!O1:O$/.test(range)) return { data: { values: grid.map((r) => [r[14] ?? '']) } };
      void valueRenderOption;
      return { data: { values: grid } };
    },
    batchUpdate: async (req: any) => {
      calls.push({ type: 'values.batchUpdate', req });
      for (const d of req.requestBody.data) {
        const row = rangeRow(d.range) - 1;
        grid[row] = grid[row] ?? [];
        grid[row][14] = d.values[0][0];
      }
      return {};
    },
    update: async (req: any) => {
      calls.push({ type: 'values.update', req });
      return {};
    },
  };
  const spreadsheets = {
    values,
    get: async () => ({ data: { sheets: [{ properties: { title: 'Penugasan', sheetId: 7 } }] } }),
    batchUpdate: async (req: any) => {
      calls.push({ type: 'batchUpdate', req });
      return {};
    },
  };
  return { google: { auth: { JWT: class {} }, sheets: () => ({ spreadsheets }) } };
});

const HEADER = ['NO', 'NIP', 'NAMA', 'PANGKAT/GOL', 'JABATAN RUTIN', 'JABATAN TUGAS', 'Prodi Penugasan', 'Jenis Pegawai', 'Unit Kerja', 'No SK', 'Tgl SK', 'Judul', 'Mulai', 'Selesai', 'ID'];
const row = (nama: string, id?: string) => [1, '', nama, '-', '', '', 'S2 PJJ Pendidikan Dasar', 'Guru Luar UM', '', 'SK/1', 46076, 'Judul;', '', 46400, id];

beforeEach(() => {
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'a@b.iam.gserviceaccount.com';
  process.env.GOOGLE_PRIVATE_KEY = 'x';
  process.env.GOOGLE_SHEET_ID = 'sheet';
  calls.length = 0;
});

describe('sheets', () => {
  it('mengisi ID otomatis, memperbaiki ID ganda, melewati baris kosong', async () => {
    grid = [HEADER.slice(0, 14), row('A', 'id-1'), [], row('B'), row('C', 'id-1')];
    const { listAssignments } = await import('@/lib/sheets');
    const out = await listAssignments();
    expect(out).toHaveLength(3);
    expect(new Set(out.map((a) => a.id)).size).toBe(3);
    expect(out[0].id).toBe('id-1');
    expect(out[0]).toMatchObject({ pangkat: '', judulSk: 'Judul', tanggalSk: '2026-02-23', tanggalMulai: null });
    const written = calls.find((c) => c.type === 'values.batchUpdate')!.req.requestBody.data.map((d: any) => d.range);
    expect(written).toContain("'Penugasan'!O1"); // header ID
    expect(written).toContain("'Penugasan'!O4"); // baris tanpa ID
    expect(written).toContain("'Penugasan'!O5"); // ID ganda
  });

  it('update mencari baris berdasarkan ID, bukan posisi, dan tidak menyentuh kolom NO/ID', async () => {
    grid = [HEADER, row('A', 'id-1'), row('B', 'id-2')];
    const { updateAssignment } = await import('@/lib/sheets');
    // Admin menyisipkan baris di atas setelah halaman dimuat: "B" kini ada di baris 4.
    grid.splice(1, 0, row('Sisipan', 'id-x'));
    await updateAssignment('id-2', {
      nip: '', nama: 'B baru', pangkat: '', jabatanRutin: '', jabatanTugas: '', prodi: 'P', jenisPegawai: 'Dosen UM',
      unitKerja: '', noSk: 'SK/1', tanggalSk: null, judulSk: 'J', tanggalMulai: null, tanggalSelesai: null,
    });
    const u = calls.find((c) => c.type === 'values.update')!.req;
    expect(u.range).toBe("'Penugasan'!B4:N4");
    expect(u.requestBody.values[0]).toHaveLength(13);
    // Kolom P (perkiraan) dihitung ulang: mulai kosong + SK kosong => kosong; dengan mulai => akhir semester.
    const p = calls.filter((c) => c.type === 'values.update').map((c) => c.req).find((r) => /!P4$/.test(r.range));
    expect(p).toBeTruthy();
    expect(p.requestBody.values[0][0]).toBe('');
  });

  it('hapus memakai deleteDimension pada baris yang benar', async () => {
    grid = [HEADER, row('A', 'id-1'), row('B', 'id-2')];
    const { deleteAssignment } = await import('@/lib/sheets');
    await deleteAssignment('id-2');
    const del = calls.find((c) => c.req?.requestBody?.requests?.[0]?.deleteDimension)!;
    expect(del.req.requestBody.requests[0].deleteDimension.range).toMatchObject({ sheetId: 7, startIndex: 2, endIndex: 3 });
  });

  it('ID tidak ditemukan -> pesan ramah 404', async () => {
    grid = [HEADER, row('A', 'id-1')];
    const { deleteAssignment } = await import('@/lib/sheets');
    await expect(deleteAssignment('tidak-ada')).rejects.toMatchObject({ status: 404 });
  });
});
