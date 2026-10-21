import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, ErrorState, PageHeader } from '@/components/States';
import { asalWilayah } from '@/lib/asal';
import { loadViews } from '@/lib/load';
import { groupTutors, nameKey } from '@/lib/tutors';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Daftar tutor' };

export default async function TutorListPage({ searchParams }: { searchParams: Promise<{ q?: string; asal?: string }> }) {
  const { q = '', asal = '' } = await searchParams;
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
  const byQuery = needle
    ? all.filter((t) => `${nameKey(t.nama)} ${t.nip} ${t.unitKerja.toLowerCase()}`.includes(needle) || `${t.nama} ${t.unitKerja}`.toLowerCase().includes(q.toLowerCase()))
    : all;
  const tutors = asal ? byQuery.filter((t) => asalWilayah(t) === asal) : byQuery;

  return (
    <>
      <PageHeader title="Tutor" subtitle={`${all.length} tutor`} />

      {asal && (
        <p className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          Asal: <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-medium">{asal}</span>
          <Link href="/tutor" className="text-muted underline hover:text-accent">Hapus filter</Link>
        </p>
      )}

      {tutors.length === 0 ? (
        <EmptyState title="Tutor tidak ditemukan" />
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
                <p className="mt-2 text-sm text-muted">{t.unitKerja}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
