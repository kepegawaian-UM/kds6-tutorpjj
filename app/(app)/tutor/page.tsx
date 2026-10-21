import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, ErrorState, PageHeader } from '@/components/States';
import { loadViews } from '@/lib/load';
import { groupTutors, nameKey } from '@/lib/tutors';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Daftar tutor' };

export default async function TutorListPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const res = await loadViews();
  if (!res.ok) {
    return (
      <>
        <PageHeader title="Daftar tutor" />
        <ErrorState message={res.message} />
      </>
    );
  }
  const all = groupTutors(res.views);
  const needle = nameKey(q);
  const tutors = needle
    ? all.filter((t) => `${nameKey(t.nama)} ${t.nip} ${t.unitKerja.toLowerCase()}`.includes(needle) || `${t.nama} ${t.unitKerja}`.toLowerCase().includes(q.toLowerCase()))
    : all;

  return (
    <>
      <PageHeader title="Daftar tutor" subtitle={`${all.length} tutor unik dari ${res.views.length} penugasan`} />
      <form className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={q} className="field" placeholder="Cari nama, NIP, atau unit kerja…" aria-label="Cari tutor" />
        <button className="btn">Cari</button>
      </form>

      {tutors.length === 0 ? (
        <EmptyState title="Tutor tidak ditemukan">Coba kata kunci lain.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((t) => (
            <li key={t.key}>
              <Link href={`/tutor/${t.key}`} className="card block h-full p-4 hover:border-accent">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{t.nama}</p>
                  <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                    {t.jumlahPenugasan} penugasan
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{t.jenisPegawai}</p>
                <p className="mt-2 text-sm">{t.unitKerja || <span className="text-muted">Unit kerja belum diisi</span>}</p>
                {t.nip && <p className="mt-1 text-xs text-muted">NIP {t.nip}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
