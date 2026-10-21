import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Masuk' };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="card p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="mb-3 h-12 w-auto" />
        <h1 className="text-xl font-semibold">Monitoring Penugasan Tutor PJJ</h1>
        <p className="mt-1 text-sm text-muted">Masukkan password untuk melanjutkan.</p>
        <LoginForm />
      </div>
    </main>
  );
}
