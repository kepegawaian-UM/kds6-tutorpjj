'use client';

import { ErrorState } from '@/components/States';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3">
      <ErrorState message="Terjadi kesalahan tak terduga saat menampilkan halaman." />
      <button className="btn" onClick={reset}>Coba lagi</button>
    </div>
  );
}
