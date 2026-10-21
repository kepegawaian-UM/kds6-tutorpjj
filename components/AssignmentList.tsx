'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { STATUS_LABEL } from '@/lib/config';
import { formatDate } from '@/lib/dates';
import { EMPTY_FILTERS, applyFilters, filtersToParams, parseFilters, type Filters } from '@/lib/filters';
import type { AssignmentView } from '@/lib/view';
import { DeleteButton } from './DeleteButton';
import { IconDownload, IconEdit, IconPlus, IconSort } from './Icons';
import { StartMissingBadge, StatusBadge } from './StatusBadge';

interface Props {
  views: AssignmentView[];
  prodiOptions: string[];
  jenisOptions: string[];
  skOptions: string[];
}

function Period({ r }: { r: AssignmentView }) {
  return (
    <span className="whitespace-nowrap tabular-nums">
      {r.tanggalMulai ? formatDate(r.tanggalMulai) : <span className="text-muted">?</span>}
      {' – '}
      {r.tanggalSelesai ? formatDate(r.tanggalSelesai) : <span className="text-muted">?</span>}
    </span>
  );
}

function Badges({ r }: { r: AssignmentView }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={r.status} daysLeft={r.daysLeft} estimatedEnd={r.estimatedEnd} estimateExpired={r.estimateExpired} />
      {r.startMissing && <StartMissingBadge />}
    </div>
  );
}

export function AssignmentList({ views, prodiOptions, jenisOptions, skOptions }: Props) {
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
    <th scope="col" className="px-3 py-2.5 text-left font-medium" aria-sort={f.sort === k ? (f.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => sortBy(k)} className="inline-flex items-center gap-1 hover:text-accent">
        {children}
        <IconSort className={f.sort === k ? 'text-accent' : 'opacity-40'} />
      </button>
    </th>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Daftar penugasan</h1>
          <p className="mt-0.5 text-sm text-muted" aria-live="polite">
            {rows.length === views.length ? `${views.length} penugasan` : `${rows.length} dari ${views.length} penugasan`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn" href={exportHref('xlsx')}><IconDownload /> Ekspor Excel</a>
          <a className="btn" href={exportHref('csv')}><IconDownload /> CSV</a>
          <Link className="btn btn-primary" href="/penugasan/baru"><IconPlus /> Tambah penugasan</Link>
        </div>
      </div>

      <div className="card mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          className="field sm:col-span-2 lg:col-span-5"
          placeholder="Cari nama, NIP, unit kerja, atau no SK…"
          aria-label="Cari"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="field" aria-label="Filter prodi" value={f.prodi} onChange={(e) => update({ prodi: e.target.value })}>
          <option value="">Semua prodi</option>
          {prodiOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className="field" aria-label="Filter jenis pegawai" value={f.jenis} onChange={(e) => update({ jenis: e.target.value })}>
          <option value="">Semua jenis pegawai</option>
          {jenisOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className="field" aria-label="Filter status" value={f.status} onChange={(e) => update({ status: e.target.value as Filters['status'] })}>
          <option value="">Semua status</option>
          {(Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map((k) => (
            <option key={k} value={k}>{STATUS_LABEL[k]}</option>
          ))}
        </select>
        <select className="field" aria-label="Filter nomor SK" value={f.sk} onChange={(e) => update({ sk: e.target.value })}>
          <option value="">Semua no SK</option>
          {skOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <button className="btn" onClick={() => router.replace(pathname, { scroll: false })} disabled={!active}>
          Reset filter
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-medium">Tidak ada penugasan yang cocok</p>
          <p className="mt-1 text-sm text-muted">Ubah kata kunci atau reset filter.</p>
        </div>
      ) : (
        <>
          {/* Tabel (layar lebar) */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs text-muted">
                <tr>
                  <Th k="no">No</Th>
                  <Th k="nama">Nama</Th>
                  <Th k="prodi">Prodi / Jenis</Th>
                  <Th k="sk">No SK</Th>
                  <Th k="mulai">Periode</Th>
                  <Th k="status">Status</Th>
                  <th className="px-3 py-2.5"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-surface-2/60">
                    <td className="px-3 py-3 tabular-nums text-muted">{r.no}</td>
                    <td className="min-w-48 px-3 py-3">
                      <Link href={`/tutor/${r.tutorKey}`} className="font-medium hover:text-accent hover:underline">{r.nama}</Link>
                      <div className="text-xs text-muted">{r.jabatanTugas}</div>
                    </td>
                    <td className="px-3 py-3">{r.prodi.replace(/^S2 PJJ\s+/i, '')}<div className="text-xs text-muted">{r.jenisPegawai}</div></td>
                    <td className="px-3 py-3 text-xs">{r.noSk}</td>
                    <td className="px-3 py-3 text-xs"><Period r={r} /></td>
                    <td className="px-3 py-3"><Badges r={r} /></td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <Link href={`/penugasan/${r.id}`} className="btn !min-h-9 !px-2.5" aria-label={`Ubah penugasan ${r.nama}`} title="Ubah"><IconEdit /></Link>
                        <DeleteButton id={r.id} nama={r.nama} detail={r.prodi} iconOnly />
                      </div>
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
                  <div className="min-w-0">
                    <Link href={`/tutor/${r.tutorKey}`} className="font-medium hover:text-accent">{r.nama}</Link>
                    <p className="text-xs text-muted">{r.jabatanTugas}</p>
                  </div>
                  <span className="text-xs tabular-nums text-muted">#{r.no}</span>
                </div>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted">Prodi</dt><dd>{r.prodi}</dd>
                  <dt className="text-muted">Jenis</dt><dd>{r.jenisPegawai}</dd>
                  <dt className="text-muted">No SK</dt><dd className="break-all">{r.noSk}</dd>
                  <dt className="text-muted">Periode</dt><dd><Period r={r} /></dd>
                </dl>
                <div className="mt-3"><Badges r={r} /></div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/penugasan/${r.id}`} className="btn flex-1"><IconEdit /> Ubah</Link>
                  <DeleteButton id={r.id} nama={r.nama} detail={r.prodi} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
