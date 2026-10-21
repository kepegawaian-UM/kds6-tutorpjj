'use client';

import { useState } from 'react';

/** Hanya path internal yang boleh dipakai sebagai tujuan setelah login. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
}

export function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const next = safeNext(new URLSearchParams(window.location.search).get('next'));
        window.location.assign(next);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Gagal masuk. Coba lagi.');
    } catch {
      setError('Tidak dapat terhubung ke server.');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
        />
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading || !password}>
        {loading ? 'Memeriksa…' : 'Masuk'}
      </button>
    </form>
  );
}
