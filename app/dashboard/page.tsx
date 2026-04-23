'use client';

import { useEffect, useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { computeFinancialHealthScore } from '@/lib/score';
import type { Income, Expense, Investment, Loan, Goal, Insurance, Snapshot } from '@/types';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatInr(n: number): string {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return INR.format(n);
}

const BAND_COLORS: Record<string, string> = {
  Excellent: 'bg-green-100 text-green-800',
  Good: 'bg-blue-100 text-blue-800',
  Fair: 'bg-yellow-100 text-yellow-800',
  Poor: 'bg-red-100 text-red-800',
};

const ASSET_COLORS = ['#4f46e5', '#0ea5e9', '#f59e0b', '#10b981', '#6b7280'];

export default function DashboardPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [deletingSnap, setDeletingSnap] = useState<string | null>(null);

  async function fetchAll() {
    const [inc, exp, inv, lo, go, ins, snap] = await Promise.all([
      fetch('/api/income').then((r) => r.json()) as Promise<{ ok: boolean; data?: Income[] }>,
      fetch('/api/expenses').then((r) => r.json()) as Promise<{ ok: boolean; data?: Expense[] }>,
      fetch('/api/investments').then((r) => r.json()) as Promise<{
        ok: boolean;
        data?: Investment[];
      }>,
      fetch('/api/loans').then((r) => r.json()) as Promise<{ ok: boolean; data?: Loan[] }>,
      fetch('/api/goals').then((r) => r.json()) as Promise<{ ok: boolean; data?: Goal[] }>,
      fetch('/api/insurance').then((r) => r.json()) as Promise<{ ok: boolean; data?: Insurance[] }>,
      fetch('/api/snapshots').then((r) => r.json()) as Promise<{ ok: boolean; data?: Snapshot[] }>,
    ]);
    if (inc.ok && inc.data) setIncomes(inc.data);
    if (exp.ok && exp.data) setExpenses(exp.data);
    if (inv.ok && inv.data) setInvestments(inv.data);
    if (lo.ok && lo.data) setLoans(lo.data);
    if (go.ok && go.data) setGoals(go.data);
    if (ins.ok && ins.data) setInsurance(ins.data);
    if (snap.ok && snap.data) setSnapshots(snap.data);
  }

  useEffect(() => {
    void fetchAll();
  }, []);

  const priorSnapshot = snapshots[1] ?? null;
  const score = computeFinancialHealthScore({
    incomes,
    expenses,
    investments,
    loans,
    goals,
    insurance,
    priorSnapshot,
  });

  // Asset allocation pie data
  const assetBuckets = { Equity: 0, Debt: 0, Gold: 0, 'Real Estate': 0, Other: 0 };
  for (const inv of investments) {
    const v = inv.current_value_inr;
    if (['mutual_fund_equity', 'mutual_fund_hybrid', 'stocks'].includes(inv.instrument))
      assetBuckets['Equity'] += v;
    else if (['mutual_fund_debt', 'fd', 'rd', 'epf'].includes(inv.instrument))
      assetBuckets['Debt'] += v;
    else if (inv.instrument === 'gold') assetBuckets['Gold'] += v;
    else if (inv.instrument === 'real_estate') assetBuckets['Real Estate'] += v;
    else assetBuckets['Other'] += v;
  }
  const pieData = Object.entries(assetBuckets)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Cash flow bar data
  const cashFlowData = [
    {
      name: 'Monthly',
      Income: Math.round(score.metrics.monthlyIncome),
      Expenses: Math.round(score.metrics.monthlyExpensesInr),
      EMIs: Math.round(score.metrics.totalEmisMonthly),
    },
  ];

  // Radar data for the 8 dimensions
  const radarData = score.dimensions.map((d) => ({
    subject: d.label.replace(' ', '\n'),
    score: Math.round(d.rawScore),
  }));

  const isEmpty = incomes.length === 0 && investments.length === 0;

  async function deleteSnapshot(id: string) {
    setDeletingSnap(id);
    await fetch(`/api/snapshots?id=${id}`, { method: 'DELETE' });
    await fetchAll();
    setDeletingSnap(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {isEmpty ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500 text-sm">
              No data yet. Start by entering your income and expenses in{' '}
              <a href="/financial-analysis" className="text-indigo-600 underline">
                Financial Analysis
              </a>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Row 1: Score + Net Worth */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Financial Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold text-gray-900">{score.total}</span>
                  <span className="text-gray-400 text-lg mb-1">/100</span>
                  <Badge className={`mb-1 ${BAND_COLORS[score.band] ?? ''}`}>{score.band}</Badge>
                </div>
                <div className="mt-3 space-y-1">
                  {score.dimensions.map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-36 shrink-0">{d.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${d.rawScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {Math.round(d.rawScore)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Net Worth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold text-gray-900">
                  {formatInr(score.metrics.netWorthInr)}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Annual Income</p>
                    <p className="font-medium">{formatInr(score.metrics.annualIncomeInr)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Annual Expenses</p>
                    <p className="font-medium">{formatInr(score.metrics.annualExpensesInr)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Investments</p>
                    <p className="font-medium">{formatInr(score.metrics.totalInvestmentsInr)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Liabilities</p>
                    <p className="font-medium text-red-600">
                      {formatInr(score.metrics.totalLiabilitiesInr)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Savings Rate</p>
                    <p className="font-medium">{score.metrics.savingsRatePct.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Liquid Fund (months)</p>
                    <p className="font-medium">{score.metrics.liquidSavingsMonths.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Asset Allocation + Cash Flow */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pieData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent as number) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={ASSET_COLORS[i % ASSET_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatInr(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Monthly Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cashFlowData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" hide />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v) => formatInr(v as number)} />
                    <Legend />
                    <Bar dataKey="Income" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="EMIs" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Health Radar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Health Dimensions Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Row 4: Goal Progress */}
          {goals.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Goal Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goals.map((g) => {
                  const pct =
                    g.target_amount_inr > 0
                      ? Math.min(100, (g.current_savings_inr / g.target_amount_inr) * 100)
                      : 0;
                  return (
                    <div key={g.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{g.goal_name}</span>
                        <span className="text-gray-500">
                          {formatInr(g.current_savings_inr)} / {formatInr(g.target_amount_inr)}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Snapshots */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saved Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Score</th>
                    <th className="pb-2 font-medium">Net Worth</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2">{s.snapshot_name}</td>
                      <td className="py-2">{s.snapshot_date}</td>
                      <td className="py-2 font-medium">{s.financial_health_score}</td>
                      <td className="py-2">{formatInr(s.net_worth_inr)}</td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          disabled={deletingSnap === s.id}
                          onClick={() => void deleteSnapshot(s.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
