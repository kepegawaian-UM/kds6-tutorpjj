/** Tanggal disimpan sebagai string ISO "YYYY-MM-DD" (tanpa zona waktu) atau null. */
export type IsoDate = string | null;

export interface Assignment {
  id: string;
  nip: string;
  nama: string;
  pangkat: string;
  jabatanRutin: string;
  jabatanTugas: string;
  prodi: string;
  jenisPegawai: string;
  unitKerja: string;
  noSk: string;
  tanggalSk: IsoDate;
  judulSk: string;
  tanggalMulai: IsoDate;
  tanggalSelesai: IsoDate;
}

/** Input tanpa ID (untuk tambah/ubah). */
export type AssignmentInput = Omit<Assignment, 'id'>;

export type StatusKey = 'aktif' | 'segera' | 'berakhir' | 'belum';

export interface StatusInfo {
  status: StatusKey;
  /** Sisa hari sampai Tanggal Selesai (negatif bila sudah lewat); null bila tanggal selesai kosong. */
  daysLeft: number | null;
  /** Penanda kualitas data terpisah. */
  startMissing: boolean;
}

export interface Tutor {
  key: string;
  nama: string;
  nip: string;
  pangkat: string;
  jenisPegawai: string;
  jabatanRutin: string;
  unitKerja: string;
  jumlahPenugasan: number;
}
