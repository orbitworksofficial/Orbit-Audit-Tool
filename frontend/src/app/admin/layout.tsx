import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import Logo from '@/components/Logo';
import SignOutButton from '@/components/SignOutButton';

export const metadata = { title: 'Admin — OrbitScanner' };

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: 'Settings' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guarded here rather than in middleware: admin status lives in the database,
  // and middleware runs on the edge without the service-role client.
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin');

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-50 border-b border-border bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3.5 sm:px-6">
          <Logo height={22} href="/admin" />
          <span className="ow-mono !text-[10px] text-brand">ADMIN</span>

          <nav className="flex flex-wrap gap-6">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="text-[13px] text-muted transition hover:text-white"
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-[12px] text-muted sm:inline">
              {admin.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6">{children}</main>
    </div>
  );
}
