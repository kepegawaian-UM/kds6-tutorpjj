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
  /** Kolom P di Sheet: perkiraan akhir semester, hanya terisi bila Tanggal Selesai kosong. */
  selesaiPerkiraan?: IsoDate;
}

/** Input tanpa ID (untuk tambah/ubah). Perkiraan dihitung otomatis, bukan diisi pengguna. */
export type AssignmentInput = Omit<Assignment, 'id' | 'selesaiPerkiraan'>;

export type StatusKey = 'aktif' | 'segera' | 'berakhir' | 'belum';

export interface StatusInfo {
  status: StatusKey;
  /** Sisa hari sampai akhir masa tugas (negatif bila sudah lewat); null bila tidak ada tanggal akhir sama sekali. */
  daysLeft: number | null;
  /** Penanda kualitas data terpisah. */
  startMissing: boolean;
  /** Tanggal akhir yang dipakai: Tanggal Selesai, atau perkiraan akhir semester bila kosong. */
  endDate: string | null;
  endIsEstimate: boolean;
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
