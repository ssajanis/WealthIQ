'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/financial-analysis', label: 'Financial Analysis' },
  { href: '/investments', label: 'Investments' },
  { href: '/loans', label: 'Loans' },
  { href: '/goals', label: 'Goals' },
  { href: '/settings', label: 'Settings' },
] as const;

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <nav
      className="w-56 shrink-0 bg-white border-r border-gray-200 min-h-screen flex flex-col"
      aria-label="Main navigation"
    >
      <div className="p-6 border-b border-gray-200">
        <span className="text-lg font-semibold text-gray-900">WealthIQ India</span>
      </div>

      <ul className="flex-1 p-3 space-y-1" role="list">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'block px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
              aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Lock app
        </button>
      </div>
    </nav>
  );
}
