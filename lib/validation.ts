import { z } from 'zod';
import { JENIS_PEGAWAI } from './config';
import type { AssignmentInput } from './types';

const isoOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Format tanggal tidak valid')
  .transform((v) => (v === '' ? null : v));

const text = (max = 500) => z.string().trim().max(max, `Maksimal ${max} karakter`).default('');

/** Judul SK otomatis bila kosong. */
export function composeJudulSk(prodi: string): string {
  const nama = prodi.replace(/^S2 PJJ\s+/i, '').trim();
  return `Penugasan sebagai Tutor Pendidikan Jarak Jauh Program Studi Magister ${nama} Universitas Negeri Malang`;
}

export const assignmentSchema = z
  .object({
    nip: z
      .string()
      .trim()
      .default('')
      .refine((v) => v === '' || /^\d{18}$/.test(v), 'NIP harus 18 digit angka'),
    nama: z.string().trim().min(1, 'Nama wajib diisi').max(200),
    pangkat: text(100),
    jabatanRutin: text(),
    jabatanTugas: text(),
    prodi: z.string().trim().min(1, 'Prodi wajib dipilih').max(200),
    jenisPegawai: z
      .string()
      .trim()
      .refine((v) => (JENIS_PEGAWAI as string[]).includes(v), 'Pilih jenis pegawai yang tersedia'),
    unitKerja: text(),
    noSk: z.string().trim().min(1, 'No SK wajib diisi').max(200),
    tanggalSk: isoOrEmpty.default(null),
    judulSk: text(1000),
    tanggalMulai: isoOrEmpty.default(null),
    tanggalSelesai: isoOrEmpty.default(null),
  })
  .superRefine((v, ctx) => {
    if (v.tanggalMulai && v.tanggalSelesai && v.tanggalSelesai < v.tanggalMulai) {
      ctx.addIssue({
        code: 'custom',
        path: ['tanggalSelesai'],
        message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
      });
    }
  })
  .transform((v): AssignmentInput => ({ ...v, judulSk: v.judulSk || composeJudulSk(v.prodi) }));

/** Bentuk input form (semua string; tanggal "YYYY-MM-DD" atau ""). */
export type AssignmentFormValues = z.input<typeof assignmentSchema>;

/** Ubah ZodError menjadi { field: pesan } (pesan pertama per field). */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? '_');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
