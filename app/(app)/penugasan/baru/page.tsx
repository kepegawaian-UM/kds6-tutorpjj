import type { Metadata } from 'next';
import { AssignmentForm } from '@/components/AssignmentForm';
import { ErrorState, PageHeader } from '@/components/States';
import { buildFormContext, EMPTY_FORM } from '@/lib/form-data';
import { loadViews } from '@/lib/load';
import { findTutorByKey } from '@/lib/tutors';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tambah penugasan' };

export default async function NewAssignmentPage({ searchParams }: { searchParams: Promise<{ tutor?: string }> }) {
  const { tutor: tutorKey } = await searchParams;
  const res = await loadViews();
  if (!res.ok) {
    return (
      <>
        <PageHeader title="Tambah penugasan" />
        <ErrorState message={res.message} />
      </>
    );
  }
  const ctx = buildFormContext(res.views);
  const found = tutorKey ? findTutorByKey(res.views, decodeURIComponent(tutorKey)) : null;
  const initial = found
    ? {
        ...EMPTY_FORM,
        nama: found.tutor.nama,
        nip: found.tutor.nip,
        pangkat: found.tutor.pangkat,
        jabatanRutin: found.tutor.jabatanRutin,
        jenisPegawai: found.tutor.jenisPegawai,
        unitKerja: found.tutor.unitKerja,
      }
    : EMPTY_FORM;
  const returnTo = found ? `/tutor/${found.tutor.key}` : '/penugasan';

  return (
    <>
      <PageHeader
        title="Tambah penugasan"
        subtitle={found ? `Untuk ${found.tutor.nama}` : undefined}
      />
      <AssignmentForm mode="create" initial={initial} returnTo={returnTo} {...ctx} />
    </>
  );
}
