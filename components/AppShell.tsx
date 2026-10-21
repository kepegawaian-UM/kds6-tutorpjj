'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconCalendar, IconDownload, IconHome, IconList, IconLogout, IconMenu, IconPlus, IconSearch, IconUsers } from './Icons';

type Item = { href: string; label: string; icon: React.ReactNode; match?: (p: string) => boolean; download?: boolean };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Data',
    items: [
      { href: '/', label: 'Ringkasan', icon: <IconHome />, match: (p) => p === '/' },
      { href: '/penugasan', label: 'Daftar Penugasan', icon: <IconList />, match: (p) => p.startsWith('/penugasan') && p !== '/penugasan/baru' },
      { href: '/tutor', label: 'Daftar Tutor', icon: <IconUsers />, match: (p) => p.startsWith('/tutor') },
    ],
  },
  {
    title: 'Aksi',
    items: [
      { href: '/penugasan/baru', label: 'Tambah Penugasan', icon: <IconPlus />, match: (p) => p === '/penugasan/baru' },
      { href: '/api/export?format=xlsx', label: 'Ekspor Excel', icon: <IconDownload />, download: true },
    ],
  },
];

export function AppShell({ children, todayLabel }: { children: React.ReactNode; todayLabel: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-cream">
      <div className="flex items-center gap-3 px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-9 w-auto" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">KDS6</p>
          <p className="text-xs text-cream/70">Tutor PJJ</p>
        </div>
      </div>
      <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((g) => (
          <div key={g.title} className="mt-4">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/50">{g.title}</p>
            {g.items.map((i) => {
              const active = i.match?.(pathname) ?? false;
              const cls = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? 'bg-white/10 font-medium text-gold' : 'text-cream/85 hover:bg-white/5 hover:text-white'
              }`;
              return i.download ? (
                <a key={i.href} href={i.href} className={cls}>{i.icon}{i.label}</a>
              ) : (
                <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined} className={cls}>{i.icon}{i.label}</Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-gold/90 text-sm font-semibold text-[#183630]">A</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-white">Admin</p>
            <p className="truncate text-xs text-cream/60">Administrator tunggal</p>
          </div>
          <button onClick={logout} title="Keluar" aria-label="Keluar" className="rounded-md p-2 text-cream/80 hover:bg-white/10 hover:text-white">
            <IconLogout />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/50" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
          <button className="btn !min-h-9 !px-2.5 lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
            <IconMenu />
          </button>
          <form
            role="search"
            className="relative max-w-md flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(q.trim() ? `/penugasan?q=${encodeURIComponent(q.trim())}` : '/penugasan');
            }}
          >
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="field !pl-9"
              placeholder="Cari NIP atau nama tutor…"
              aria-label="Cari penugasan"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
          <span className="ml-auto hidden items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium sm:inline-flex">
            <IconCalendar /> Posisi: {todayLabel}
          </span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
