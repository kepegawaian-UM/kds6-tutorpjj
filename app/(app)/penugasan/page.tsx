import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AssignmentList } from '@/components/AssignmentList';
import { EmptyState, ErrorState, PageHeader } from '@/components/States';
import { DEFAULT_PRODI } from '@/lib/config';
import { loadViews } from '@/lib/load';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Daftar penugasan' };

export default async function PenugasanPage() {
  const res = await loadViews();
  if (!res.ok) {
    return (
      <>
        <PageHeader title="Daftar penugasan" />
        <ErrorState message={res.message} />
      </>
    );
  }
  const { views } = res;
  if (!views.length) {
    return (
      <>
        <PageHeader title="Daftar penugasan" />
        <EmptyState title="Belum ada data penugasan" action={{ href: '/penugasan/baru', label: 'Tambah penugasan' }}>
          Sheet masih kosong.
        </EmptyState>
      </>
    );
  }
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))];
  const prodiOptions = [...DEFAULT_PRODI, ...uniq(views.map((v) => v.prodi)).filter((p) => !DEFAULT_PRODI.includes(p))];
  const skOptions = uniq(views.map((v) => v.noSk)).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));

  return (
    <Suspense fallback={null}>
      <AssignmentList views={views} prodiOptions={prodiOptions} skOptions={skOptions} />
    </Suspense>
  );
}
