'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconFile, IconHome, IconList, IconLogout, IconMenu, IconUsers } from './Icons';

const ITEMS = [
  { href: '/', label: 'Ringkasan', icon: <IconHome />, match: (p: string) => p === '/' },
  { href: '/penugasan', label: 'Penugasan', icon: <IconList />, match: (p: string) => p.startsWith('/penugasan') },
  { href: '/sk', label: 'SK', icon: <IconFile />, match: (p: string) => p.startsWith('/sk') },
  { href: '/tutor', label: 'Tutor', icon: <IconUsers />, match: (p: string) => p.startsWith('/tutor') },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-cream">
      <div className="flex items-center gap-3 px-5 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-9 w-auto" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">KDS6</p>
          <p className="text-xs text-cream/70">Tutor PJJ</p>
        </div>
      </div>
      <nav aria-label="Navigasi utama" className="flex-1 space-y-1 px-3">
        {ITEMS.map((i) => {
          const active = i.match(pathname);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? 'bg-white/10 font-medium text-white' : 'text-cream/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              {i.icon}
              {i.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-cream/80 hover:bg-white/5 hover:text-white"
        >
          <IconLogout />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/50" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-56">
        {/* Bilah atas hanya untuk HP (tombol menu). */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button className="btn !min-h-9 !px-2.5" onClick={() => setOpen(true)} aria-label="Buka menu">
            <IconMenu />
          </button>
          <span className="text-sm font-semibold">KDS6 Tutor PJJ</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-10 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
