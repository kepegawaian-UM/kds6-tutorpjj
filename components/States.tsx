import Link from 'next/link';

export function ErrorState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div role="alert" className="card border-red-300 p-5 dark:border-red-900">
      <h2 className="font-semibold text-red-700 dark:text-red-400">Data tidak dapat dimuat</h2>
      <p className="mt-1 text-sm">{message}</p>
      <p className="mt-2 text-xs text-muted">{hint ?? 'Muat ulang halaman setelah masalah diperbaiki.'}</p>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 text-sm text-muted">{children}</p>}
      {action && (
        <Link href={action.href} className="btn btn-primary mt-4">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
