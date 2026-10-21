'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconTrash } from './Icons';

interface Props {
  id: string;
  nama: string;
  detail?: string;
  /** Setelah berhasil: refresh halaman ini, atau pindah ke path tertentu. */
  redirectTo?: string;
  iconOnly?: boolean;
}

export function DeleteButton({ id, nama, detail, redirectTo, iconOnly }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  async function confirmDelete() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/penugasan/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Gagal menghapus.');
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`btn btn-danger ${iconOnly ? '!min-h-9 !px-2.5' : ''}`}
        onClick={() => setOpen(true)}
        aria-label={`Hapus penugasan ${nama}`}
        title="Hapus"
      >
        <IconTrash />
        {!iconOnly && 'Hapus'}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(92vw,26rem)] rounded-xl border border-border bg-surface p-5 text-fg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-semibold">Hapus penugasan?</h2>
        <p className="mt-2 text-sm">
          Penugasan <strong>{nama}</strong>
          {detail && <> ({detail})</>} akan dihapus permanen dari Google Sheets. Tindakan ini tidak dapat dibatalkan dari aplikasi.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn" onClick={() => setOpen(false)} disabled={busy}>Batal</button>
          <button type="button" className="btn btn-danger-solid" onClick={confirmDelete} disabled={busy}>
            {busy ? 'Menghapus…' : 'Ya, hapus'}
          </button>
        </div>
      </dialog>
    </>
  );
}
