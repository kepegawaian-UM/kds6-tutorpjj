import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IconPlus } from '@/components/Icons';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, PageHeader } from '@/components/States';
import { shortProdi } from '@/lib/config';
import { formatDate } from '@/lib/dates';
import { loadViews } from '@/lib/load';
import { findTutorByKey } from '@/lib/tutors';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Riwayat tutor' };

export default async function TutorDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  const res = await loadViews();
  if (!res.ok) {
    return (
      <>
        <PageHeader title="Riwayat tutor" />
        <ErrorState message={res.message} />
      </>
    );
  }
  const found = findTutorByKey(res.views, key);
  if (!found) notFound();
  const { tutor, rows } = found;
  const byId = new Map(res.views.map((v) => [v.id, v]));

  const profile: [string, string][] = [
    ['NIP', tutor.nip],
    ['Pangkat/Gol', tutor.pangkat],
    ['Jenis pegawai', tutor.jenisPegawai],
    ['Jabatan rutin', tutor.jabatanRutin],
    ['Unit kerja', tutor.unitKerja],
  ];

  return (
    <>
      <p className="mb-3 text-sm"><Link href="/tutor" className="text-muted hover:text-accent">← Tutor</Link></p>
      <PageHeader
        title={tutor.nama}
                actions={
          <Link href={`/penugasan/baru?tutor=${encodeURIComponent(tutor.key)}`} className="btn btn-primary">
            <IconPlus /> Tambah Penugasan
          </Link>
        }
      />

      <section className="card mb-6 p-4" aria-label="Profil tutor">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <h2 className="mb-3 text-lg font-semibold">Riwayat penugasan</h2>
      <ol className="space-y-3">
        {rows.map((r) => {
          const v = byId.get(r.id)!;
          return (
            <li key={r.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">{shortProdi(r.prodi)}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={v.status} daysLeft={v.daysLeft} estimatedEnd={v.estimatedEnd} estimateExpired={v.estimateExpired} />
                </div>
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                <dt className="text-muted">No SK</dt>
                <dd className="break-all">{r.noSk}{r.tanggalSk && <span className="text-muted"> · tgl {formatDate(r.tanggalSk)}</span>}</dd>
                <dt className="text-muted">Periode</dt>
                <dd className="tabular-nums">
                  {r.tanggalMulai ? formatDate(r.tanggalMulai) : '?'} – {r.tanggalSelesai ? formatDate(r.tanggalSelesai) : '?'}
                </dd>
              </dl>
              <Link href={`/penugasan/${r.id}`} className="link-text mt-3 inline-block">Ubah</Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
