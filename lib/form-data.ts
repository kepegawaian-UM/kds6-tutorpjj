import type { SkOption } from '@/components/AssignmentForm';
import { DEFAULT_PRODI } from './config';
import { groupTutors, sortByRecent } from './tutors';
import type { Assignment } from './types';

export type FormValues = {
  nip: string; nama: string; pangkat: string; jabatanRutin: string; jabatanTugas: string; prodi: string;
  jenisPegawai: string; unitKerja: string; noSk: string; tanggalSk: string; judulSk: string;
  tanggalMulai: string; tanggalSelesai: string;
};

export const EMPTY_FORM: FormValues = {
  nip: '', nama: '', pangkat: '', jabatanRutin: '', jabatanTugas: 'Tutor PJJ', prodi: '', jenisPegawai: '',
  unitKerja: '', noSk: '', tanggalSk: '', judulSk: '', tanggalMulai: '', tanggalSelesai: '',
};

export function toFormValues(a: Assignment): FormValues {
  return {
    nip: a.nip, nama: a.nama, pangkat: a.pangkat, jabatanRutin: a.jabatanRutin, jabatanTugas: a.jabatanTugas,
    prodi: a.prodi, jenisPegawai: a.jenisPegawai, unitKerja: a.unitKerja, noSk: a.noSk,
    tanggalSk: a.tanggalSk ?? '', judulSk: a.judulSk, tanggalMulai: a.tanggalMulai ?? '', tanggalSelesai: a.tanggalSelesai ?? '',
  };
}

/** Bahan untuk autocomplete dan dropdown di form. */
export function buildFormContext(rows: Assignment[]) {
  const tutors = groupTutors(rows);
  const skMap = new Map<string, SkOption>();
  for (const r of sortByRecent(rows)) {
    if (r.noSk && !skMap.has(r.noSk)) skMap.set(r.noSk, { noSk: r.noSk, tanggalSk: r.tanggalSk ?? '', judulSk: r.judulSk });
  }
  const extra = [...new Set(rows.map((r) => r.prodi).filter((p) => p && !DEFAULT_PRODI.includes(p)))];
  return { tutors, sks: [...skMap.values()], prodiOptions: [...DEFAULT_PRODI, ...extra] };
}
