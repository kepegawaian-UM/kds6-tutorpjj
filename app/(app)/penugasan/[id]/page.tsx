import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AssignmentForm } from '@/components/AssignmentForm';
import { StartMissingBadge, StatusBadge } from '@/components/StatusBadge';
import { ErrorState, PageHeader } from '@/components/States';
import { buildFormContext, toFormValues } from '@/lib/form-data';
import { loadViews } from '@/lib/load';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ubah penugasan' };

export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await loadViews();
  if (!res.ok) {
    return (
      <>
        <PageHeader title="Ubah penugasan" />
        <ErrorState message={res.message} />
      </>
    );
  }
  const row = res.views.find((v) => v.id === id);
  if (!row) notFound();
  const ctx = buildFormContext(res.views);

  return (
    <>
      <PageHeader title="Ubah penugasan" subtitle={`${row.nama} · ${row.prodi}`} />
      <div className="-mt-3 mb-5 flex flex-wrap gap-1.5">
        <StatusBadge status={row.status} daysLeft={row.daysLeft} estimatedEnd={row.estimatedEnd} estimateExpired={row.estimateExpired} renewal={row.renewal} />
        {row.startMissing && <StartMissingBadge />}
      </div>
      <AssignmentForm
        mode="edit"
        id={row.id}
        initial={toFormValues(row)}
        returnTo="/penugasan"
        deleteInfo={{ nama: row.nama, detail: row.prodi }}
        {...ctx}
      />
    </>
  );
}
