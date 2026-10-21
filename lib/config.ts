/** Ambang "Segera berakhir" (hari). Ubah di sini bila perlu. */
export const EXPIRING_SOON_DAYS = 30;

export const TIME_ZONE = 'Asia/Jakarta';

export const DEFAULT_PRODI = [
  'S2 PJJ Teknologi Pembelajaran',
  'S2 PJJ Pendidikan Nonformal',
  'S2 PJJ Pendidikan Bahasa Indonesia',
  'S2 PJJ Pendidikan Bahasa Inggris',
  'S2 PJJ Pendidikan Matematika',
  'S2 PJJ Pendidikan Dasar',
];

export const JENIS_PEGAWAI = ['Dosen UM', 'Dosen Luar UM', 'Pegawai Luar UM', 'Guru Luar UM'];

/** Kolom A-N persis seperti file asli. Kolom O (ID) ditambahkan oleh aplikasi. */
export const HEADERS = [
  'NO',
  'NIP',
  'NAMA',
  'PANGKAT/GOL',
  'JABATAN RUTIN',
  'JABATAN TUGAS',
  'Prodi Penugasan',
  'Jenis Pegawai',
  'Unit Kerja',
  'No SK Rektor UM/Nomor ST',
  'Tanggal SK Rektor UM/ST',
  'Judul SK Rektor/ST',
  'Tanggal Mulai',
  'Tanggal Selesai',
] as const;

export const ID_HEADER = 'ID';
export const PERKIRAAN_HEADER = 'Selesai (perkiraan)';
export const SHEET_HEADERS = [...HEADERS, ID_HEADER, PERKIRAAN_HEADER];

export const STATUS_LABEL = {
  aktif: 'Aktif',
  segera: 'Segera berakhir',
  berakhir: 'Berakhir',
  belum: 'Tanggal selesai belum diisi',
} as const;

/**
 * Akhir semester (bulan, hari) yang dipakai untuk memperkirakan akhir masa tugas bila Tanggal Selesai kosong.
 * Saat ini semester kalender: 30 Juni dan 31 Desember. Ubah di sini bila memakai kalender akademik lain.
 */
export const SEMESTER_ENDS: [month: number, day: number][] = [
  [6, 30],
  [12, 31],
];

/** Nama prodi tanpa awalan "S2 PJJ ". */
export const shortProdi = (p: string) => p.replace(/^S2 PJJ\s+/i, '');
