import { nameKey } from './tutors';
import type { StatusKey } from './types';
import type { AssignmentView } from './view';

export interface Filters {
  q: string;
  prodi: string;
  jenis: string;
  status: '' | StatusKey;
  sk: string;
  sort: string;
  dir: 'asc' | 'desc';
}

export const EMPTY_FILTERS: Filters = { q: '', prodi: '', jenis: '', status: '', sk: '', sort: '', dir: 'asc' };

const STATUSES = ['aktif', 'segera', 'berakhir', 'belum'];

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function get(p: Params, k: string): string {
  const v = p instanceof URLSearchParams ? p.get(k) : p[k];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

export function parseFilters(p: Params): Filters {
  const status = get(p, 'status');
  return {
    q: get(p, 'q').trim(),
    prodi: get(p, 'prodi'),
    jenis: get(p, 'jenis'),
    status: STATUSES.includes(status) ? (status as StatusKey) : '',
    sk: get(p, 'sk'),
    sort: get(p, 'sort'),
    dir: get(p, 'dir') === 'desc' ? 'desc' : 'asc',
  };
}

export function filtersToParams(f: Partial<Filters>): URLSearchParams {
  const sp = new URLSearchParams();
  (Object.keys(EMPTY_FILTERS) as (keyof Filters)[]).forEach((k) => {
    const v = f[k];
    if (v && v !== EMPTY_FILTERS[k]) sp.set(k, String(v));
  });
  return sp;
}

const STATUS_ORDER: Record<StatusKey, number> = { segera: 0, belum: 1, aktif: 2, berakhir: 3 };

const SORTERS: Record<string, (a: AssignmentView, b: AssignmentView) => number> = {
  no: (a, b) => a.no - b.no,
  nama: (a, b) => a.nama.localeCompare(b.nama, 'id'),
  prodi: (a, b) => a.prodi.localeCompare(b.prodi, 'id'),
  jenis: (a, b) => a.jenisPegawai.localeCompare(b.jenisPegawai, 'id'),
  sk: (a, b) => a.noSk.localeCompare(b.noSk, 'id', { numeric: true }),
  mulai: (a, b) => (a.tanggalMulai ?? '').localeCompare(b.tanggalMulai ?? ''),
  selesai: (a, b) => (a.endDate ?? '9999').localeCompare(b.endDate ?? '9999'),
  status: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (a.daysLeft ?? 0) - (b.daysLeft ?? 0),
};

export function applyFilters(rows: AssignmentView[], f: Filters): AssignmentView[] {
  const q = f.q ? nameKey(f.q) : '';
  const qRaw = f.q.toLowerCase();
  let out = rows.filter((r) => {
    if (f.prodi && r.prodi !== f.prodi) return false;
    if (f.jenis && r.jenisPegawai !== f.jenis) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.sk && r.noSk !== f.sk) return false;
    if (q) {
      const hay = `${nameKey(r.nama)} ${r.nip} ${r.unitKerja.toLowerCase()} ${r.noSk.toLowerCase()}`;
      if (!hay.includes(q) && !hay.includes(qRaw)) return false;
    }
    return true;
  });
  const cmp = SORTERS[f.sort];
  if (cmp) {
    out = [...out].sort(cmp);
    if (f.dir === 'desc') out.reverse();
  }
  return out;
}
