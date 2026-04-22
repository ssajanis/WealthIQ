import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const SECTIONS = [
  {
    href: '/investments',
    title: 'Investments',
    description: 'Mutual funds, PPF, EPF, NPS, FD, stocks, gold',
  },
  {
    href: '/loans',
    title: 'Loans',
    description: 'Home loan, car loan, personal loan, credit card',
  },
  { href: '/goals', title: 'Goals', description: 'Retirement, education, home purchase, travel' },
  {
    href: '/financial-analysis',
    title: 'Financial Analysis',
    description: 'Income, expenses, tax',
  },
  { href: '/settings', title: 'Settings', description: 'Assets, insurance, account' },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Your financial health at a glance. Start by entering your household data in each section
          below.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="block group">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{s.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Enter your household data in all sections above, then come back here to see your
            Financial Health Score and full analysis. (Available after Phase 2.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
