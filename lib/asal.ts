import type { Tutor } from './types';

/**
 * Asal tutor (wilayah) diturunkan dari teks Unit Kerja / Jabatan Rutin dengan kata kunci.
 * Aturan dicek berurutan, yang pertama cocok dipakai. Tambah atau ubah aturan di sini bila perlu.
 */
const RULES: { label: string; keywords: string[] }[] = [
  { label: 'Kab. Tana Tidung', keywords: ['tana tidung'] },
  { label: 'Kab. Kutai Timur', keywords: ['kutai timur', 'sangatta', 'sangata'] },
  { label: 'Kota Bontang', keywords: ['bontang'] },
  { label: 'Kota Tarakan', keywords: ['tarakan'] },
  { label: 'Kota Samarinda', keywords: ['mulawarman'] },
  { label: 'DKI Jakarta', keywords: ['jakarta'] },
  { label: 'Universitas Terbuka', keywords: ['universitas terbuka'] },
  { label: 'Kota Malang (UM)', keywords: ['malang'] },
];

export const ASAL_LAINNYA = 'Lainnya / belum diketahui';

type Src = Pick<Tutor, 'unitKerja' | 'jabatanRutin' | 'jenisPegawai'>;

export function asalWilayah(t: Src): string {
  const text = `${t.unitKerja} ${t.jabatanRutin}`.toLowerCase();
  for (const r of RULES) if (r.keywords.some((k) => text.includes(k))) return r.label;
  if (t.jenisPegawai === 'Dosen UM') return 'Kota Malang (UM)';
  return ASAL_LAINNYA;
}

export interface AsalGroup {
  label: string;
  value: number;
  /** Rincian institusi asal (unit kerja) dan jumlah tutornya. */
  units: { unit: string; count: number }[];
}

/** Sebaran tutor unik per wilayah, terbanyak lebih dulu. */
export function asalBreakdown(tutors: Tutor[]): AsalGroup[] {
  const groups = new Map<string, Map<string, number>>();
  for (const t of tutors) {
    const w = asalWilayah(t);
    const unit = t.unitKerja || '(unit kerja kosong)';
    const m = groups.get(w) ?? groups.set(w, new Map()).get(w)!;
    m.set(unit, (m.get(unit) ?? 0) + 1);
  }
  return [...groups.entries()]
    .map(([label, m]) => ({
      label,
      value: [...m.values()].reduce((a, b) => a + b, 0),
      units: [...m.entries()].map(([unit, count]) => ({ unit, count })).sort((a, b) => b.count - a.count || a.unit.localeCompare(b.unit, 'id')),
    }))
    .sort((a, b) => (a.label === ASAL_LAINNYA ? 1 : b.label === ASAL_LAINNYA ? -1 : b.value - a.value || a.label.localeCompare(b.label, 'id')));
}
