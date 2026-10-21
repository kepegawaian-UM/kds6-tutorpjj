'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { STATUS_LABEL, shortProdi } from '@/lib/config';
import { formatDate } from '@/lib/dates';
import { EMPTY_FILTERS, applyFilters, filtersToParams, parseFilters, type Filters } from '@/lib/filters';
import type { AssignmentView } from '@/lib/view';
import { IconDownload, IconPlus, IconSort } from './Icons';
import { StatusBadge } from './StatusBadge';

interface Props {
  views: AssignmentView[];
  prodiOptions: string[];
  skOptions: string[];
}

function Period({ r }: { r: AssignmentView }) {
  return (
    <span className="tabular-nums">
      {r.tanggalMulai ? formatDate(r.tanggalMulai) : <span className="text-muted">?</span>}
      {' – '}
      {r.endDate ? formatDate(r.endDate) : <span className="text-muted">?</span>}
    </span>
  );
}

function Badges({ r }: { r: AssignmentView }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={r.status} daysLeft={r.daysLeft} />
    </div>
  );
}

export function AssignmentList({ views, prodiOptions, skOptions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const f = parseFilters(sp);
  const [q, setQ] = useState(f.q);

  const update = (patch: Partial<Filters>) => {
    const qs = filtersToParams({ ...f, ...patch }).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Pencarian ditunda sebentar agar URL tidak berubah di setiap ketikan.
  useEffect(() => {
    if (q.trim() === f.q) return;
    const t = setTimeout(() => update({ q: q.trim() }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Sinkron bila URL berubah dari luar (mis. tombol reset).
  useEffect(() => setQ(f.q), [f.q]);

  const rows = useMemo(() => applyFilters(views, f), [views, f.q, f.prodi, f.jenis, f.status, f.sk, f.sort, f.dir]); // eslint-disable-line react-hooks/exhaustive-deps
  const exportQs = filtersToParams(f).toString();
  const exportHref = (fmt: 'xlsx' | 'csv') => `/api/export?format=${fmt}${exportQs ? `&${exportQs}` : ''}`;
  const active = (Object.keys(EMPTY_FILTERS) as (keyof Filters)[]).some(
    (k) => k !== 'sort' && k !== 'dir' && f[k] !== EMPTY_FILTERS[k],
  );

  const sortBy = (key: string) => update({ sort: key, dir: f.sort === key && f.dir === 'asc' ? 'desc' : 'asc' });
  const Th = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <th scope="col" className="px-3 py-3 text-left font-semibold" aria-sort={f.sort === k ? (f.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => sortBy(k)} className="inline-flex items-center gap-1 hover:text-accent">
        {children}
        <IconSort className={f.sort === k ? 'text-accent' : 'opacity-40'} />
      </button>
    </th>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Penugasan</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="btn" href={exportHref('xlsx')}><IconDownload /> Export Excel</a>
          <Link className="btn btn-primary" href="/penugasan/baru"><IconPlus /> Tambah Penugasan</Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_auto] lg:items-end">
        <div>
          <label htmlFor="f-q" className="mb-1 block text-sm">Cari</label>
          <input id="f-q" type="search" className="field" placeholder="Nama, unit kerja, atau no SK" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-prodi" className="mb-1 block text-sm">Prodi</label>
          <select id="f-prodi" className="field" value={f.prodi} onChange={(e) => update({ prodi: e.target.value })}>
            <option value="">Semua</option>
            {prodiOptions.map((o) => <option key={o} value={o}>{shortProdi(o)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="mb-1 block text-sm">Status</label>
          <select id="f-status" className="field" value={f.status} onChange={(e) => update({ status: e.target.value as Filters['status'] })}>
            <option value="">Semua</option>
            {(Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map((k) => (
              <option key={k} value={k}>{STATUS_LABEL[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-sk" className="mb-1 block text-sm">No SK</label>
          <select id="f-sk" className="field" value={f.sk} onChange={(e) => update({ sk: e.target.value })}>
            <option value="">Semua</option>
            {skOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {active && (
          <button className="btn" onClick={() => router.replace(pathname, { scroll: false })}>Reset</button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-medium">Tidak ada penugasan yang cocok</p>
        </div>
      ) : (
        <>
          {/* Tabel (layar lebar) */}
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-[11px] text-muted">
                <tr>
                  <Th k="nama">Nama</Th>
                  <Th k="prodi">Prodi</Th>
                  <Th k="sk">No SK</Th>
                  <Th k="mulai">Periode</Th>
                  <Th k="status">Status</Th>
                  <th className="px-3 py-3"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-surface-2/60">
                    <td className="px-3 py-3.5">
                      <Link href={`/tutor/${r.tutorKey}`} className="font-medium hover:text-accent hover:underline">{r.nama}</Link>
                    </td>
                    <td className="px-3 py-3.5">{shortProdi(r.prodi)}</td>
                    <td className="px-3 py-3.5 text-xs">{r.noSk}</td>
                    <td className="px-3 py-3.5 text-xs"><Period r={r} /></td>
                    <td className="px-3 py-3.5"><Badges r={r} /></td>
                    <td className="px-3 py-3.5">
                      <Link href={`/penugasan/${r.id}`} className="link-text" aria-label={`Ubah penugasan ${r.nama}`}>Ubah</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kartu (HP) */}
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/tutor/${r.tutorKey}`} className="font-medium hover:text-accent">{r.nama}</Link>
                  <Link href={`/penugasan/${r.id}`} className="link-text shrink-0">Ubah</Link>
                </div>
                <p className="mt-1 text-sm text-muted">{shortProdi(r.prodi)}</p>
                <p className="mt-1 text-xs text-muted"><Period r={r} /> · {r.noSk}</p>
                <div className="mt-3"><Badges r={r} /></div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
