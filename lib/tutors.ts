import type { Assignment, Tutor } from './types';

/**
 * Normalisasi nama untuk kunci dan perbandingan: huruf kecil, titik dihapus (agar "M.Pd" == "M.Pd."),
 * koma/titik koma menjadi spasi, spasi ganda dan spasi di ujung dirapikan.
 */
export function nameKey(name: string): string {
  return (name ?? '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanNip(nip: string): string {
  return (nip ?? '').replace(/\D/g, '');
}

const TITLE_TOKENS = new Set([
  'dr', 'drs', 'dra', 'prof', 'ir', 'hj', 'sc', 'ed', 'ma', 'mpd', 'mpdsi', 'mp', 'ssi', 'spd', 'spdi',
  'ss', 'msi', 'med', 'mhum', 'mpsi', 'mkom', 'mm', 'msc', 'phd', 'se', 'sh', 'mh', 'skom', 'sag', 'mag',
  'mpdi', 'ssos', 'mt',
]);

/** Nama inti tanpa gelar, dipakai untuk mendeteksi nama mirip. */
export function coreName(name: string): string {
  return nameKey(name)
    .split(' ')
    .filter((t) => t && !TITLE_TOKENS.has(t))
    .join(' ');
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
    }
  }
  return prev[b.length];
}

/** Dua nama dianggap mirip bila nama intinya sama, atau selisih ≤ 2 huruf (nama inti ≥ 6 huruf). */
export function areNamesSimilar(a: string, b: string): boolean {
  const ca = coreName(a);
  const cb = coreName(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;
  if (Math.min(ca.length, cb.length) < 6) return false;
  return levenshtein(ca, cb) <= 2;
}

/** Nama dari daftar yang mirip tetapi tidak identik (setelah normalisasi) dengan `name`. */
export function findSimilarNames(name: string, existing: string[]): string[] {
  const key = nameKey(name);
  const out = new Set<string>();
  for (const e of existing) {
    if (nameKey(e) === key) continue;
    if (areNamesSimilar(name, e)) out.add(e);
  }
  return [...out];
}

export function tutorKeyForNip(nip: string): string {
  return `nip-${cleanNip(nip)}`;
}
export function tutorKeyForName(name: string): string {
  // Hanya ASCII agar aman dipakai di URL.
  const slug = nameKey(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `nama-${slug}`;
}

/**
 * Kunci tutor tiap baris (id baris -> kunci).
 * Kunci utama NIP. Baris tanpa NIP bergabung ke NIP bila namanya (ternormalisasi) sama dengan
 * nama pada baris yang ber-NIP; bila tidak, kuncinya dari nama.
 */
export function assignKeys(rows: Assignment[]): Map<string, string> {
  const nameToNipKey = new Map<string, string>();
  for (const r of rows) {
    if (cleanNip(r.nip)) {
      const nk = nameKey(r.nama);
      if (!nameToNipKey.has(nk)) nameToNipKey.set(nk, tutorKeyForNip(r.nip));
    }
  }
  const out = new Map<string, string>();
  for (const r of rows) {
    const nip = cleanNip(r.nip);
    out.set(r.id, nip ? tutorKeyForNip(nip) : (nameToNipKey.get(nameKey(r.nama)) ?? tutorKeyForName(r.nama)));
  }
  return out;
}

/** Nama terpanjang; bila seri, yang paling banyak muncul. */
function pickName(rows: Assignment[]): string {
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.nama.trim(), (count.get(r.nama.trim()) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[0].length - a[0].length || b[1] - a[1])[0][0];
}

/** Kunci "terbaru": tanggal mulai, lalu tanggal SK, lalu tanggal selesai. */
export function recencyValue(a: Assignment): string {
  return a.tanggalMulai ?? a.tanggalSk ?? a.tanggalSelesai ?? '';
}

/** Urut dari terbaru ke terlama. */
export function sortByRecent(rows: Assignment[]): Assignment[] {
  return [...rows].sort((a, b) => {
    const r = recencyValue(b).localeCompare(recencyValue(a));
    return r || (b.tanggalSk ?? '').localeCompare(a.tanggalSk ?? '');
  });
}

const isRealPangkat = (p: string) => !!p && p.trim() !== '-';

export function groupTutors(rows: Assignment[]): Tutor[] {
  const keys = assignKeys(rows);
  const groups = new Map<string, Assignment[]>();
  for (const r of rows) {
    const k = keys.get(r.id)!;
    const g = groups.get(k);
    if (g) g.push(r);
    else groups.set(k, [r]);
  }
  const tutors: Tutor[] = [];
  for (const [key, list] of groups) {
    const recent = sortByRecent(list);
    const firstFilled = (f: (a: Assignment) => string) => recent.map(f).find((v) => v && v.trim()) ?? '';
    tutors.push({
      key,
      nama: pickName(list),
      nip: cleanNip(firstFilled((a) => a.nip)),
      pangkat: recent.map((a) => a.pangkat).find(isRealPangkat) ?? '',
      jenisPegawai: firstFilled((a) => a.jenisPegawai),
      jabatanRutin: firstFilled((a) => a.jabatanRutin),
      unitKerja: firstFilled((a) => a.unitKerja),
      jumlahPenugasan: list.length,
    });
  }
  return tutors.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
}

export function findTutorByKey(rows: Assignment[], key: string): { tutor: Tutor; rows: Assignment[] } | null {
  const keys = assignKeys(rows);
  const mine = rows.filter((r) => keys.get(r.id) === key);
  if (!mine.length) return null;
  return { tutor: { ...groupTutors(mine)[0], key }, rows: sortByRecent(mine) };
}
