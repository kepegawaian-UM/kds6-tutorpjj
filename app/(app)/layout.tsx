import { AppShell } from '@/components/AppShell';
import { formatDate, todayJakarta } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell todayLabel={formatDate(todayJakarta())}>{children}</AppShell>;
}
