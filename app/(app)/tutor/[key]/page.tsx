import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DeleteButton } from '@/components/DeleteButton';
import { IconEdit, IconPlus } from '@/components/Icons';
import { StartMissingBadge, StatusBadge } from '@/components/StatusBadge';
import { ErrorState, PageHeader } from '@/components/States';
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
      <p className="mb-2 text-sm"><Link href="/tutor" className="text-muted hover:text-accent">← Semua tutor</Link></p>
      <PageHeader
        title={tutor.nama}
        subtitle={`${tutor.jumlahPenugasan} penugasan`}
        actions={
          <Link href={`/penugasan/baru?tutor=${encodeURIComponent(tutor.key)}`} className="btn btn-primary">
            <IconPlus /> Tambah penugasan untuk tutor ini
          </Link>
        }
      />

      <section className="card mb-6 p-4" aria-label="Profil tutor">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="text-sm">{v || <span className="text-muted">—</span>}</dd>
            </div>
          ))}
        </dl>
      </section>

      <h2 className="mb-2 text-lg font-semibold">Riwayat penugasan</h2>
      <ol className="space-y-3">
        {rows.map((r) => {
          const v = byId.get(r.id)!;
          return (
            <li key={r.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.prodi}</p>
                  <p className="text-sm text-muted">{r.jabatanTugas || 'Jabatan tugas belum diisi'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={v.status} daysLeft={v.daysLeft} />
                  {v.startMissing && <StartMissingBadge />}
                </div>
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                <dt className="text-muted">No SK</dt>
                <dd className="break-all">{r.noSk}{r.tanggalSk && <span className="text-muted"> · tgl {formatDate(r.tanggalSk)}</span>}</dd>
                <dt className="text-muted">Periode</dt>
                <dd className="tabular-nums">
                  {r.tanggalMulai ? formatDate(r.tanggalMulai) : '?'} – {r.tanggalSelesai ? formatDate(r.tanggalSelesai) : '?'}
                </dd>
                <dt className="text-muted">Unit kerja</dt>
                <dd>{r.unitKerja || '—'}</dd>
              </dl>
              <div className="mt-3 flex gap-2">
                <Link href={`/penugasan/${r.id}`} className="btn !min-h-9"><IconEdit /> Ubah</Link>
                <DeleteButton id={r.id} nama={r.nama} detail={r.prodi} />
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
