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
export const SHEET_HEADERS = [...HEADERS, ID_HEADER];

export const STATUS_LABEL = {
  aktif: 'Aktif',
  segera: 'Segera berakhir',
  berakhir: 'Berakhir',
  belum: 'Masa tugas belum diketahui',
} as const;
