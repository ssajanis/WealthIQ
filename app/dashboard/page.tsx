'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { computeFinancialHealthScore } from '@/lib/score';
import { savingsRate, debtToIncomeRatio, netWorth } from '@/lib/calculations';
import type { Income, Expense, Investment, Loan, Goal, Insurance, Snapshot } from '@/types';

// Lazy-load all Recharts charts so the first paint is not blocked
const LazyScoreDonut = lazy(() => import('@/components/dashboard/ScoreDonut'));
const LazyIncomeExpenseBar = lazy(() => import('@/components/dashboard/IncomeExpenseBar'));
const LazyNetWorthBar = lazy(() => import('@/components/dashboard/NetWorthBar'));
const LazySavingsRatePie = lazy(() => import('@/components/dashboard/SavingsRatePie'));
const LazyAssetAllocationPie = lazy(() => import('@/components/dashboard/AssetAllocationPie'));
const LazyLoanBurdenBar = lazy(() => import('@/components/dashboard/LoanBurdenBar'));

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

const CHART_SPINNER = (
  <div className="h-[100px] flex items-center justify-center text-neutral text-sm">
    Loading…
  </div>
);

export default function DashboardPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [deletingSnap, setDeletingSnap] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    setLoading(true);
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
    setLoading(false);
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

  const monthlyIncome = score.metrics.monthlyIncome;
  const monthlyExpenses = score.metrics.monthlyExpensesInr;
  const totalInvestments = score.metrics.totalInvestmentsInr;
  const totalLiabilities = score.metrics.totalLiabilitiesInr;
  const nw = netWorth(totalInvestments, totalLiabilities);
  const sr = savingsRate(monthlyIncome, monthlyExpenses + score.metrics.totalEmisMonthly);
  const dti = debtToIncomeRatio(score.metrics.totalEmisMonthly, monthlyIncome);

  const isEmpty = loading || (incomes.length === 0 && investments.length === 0);

  async function deleteSnapshot(id: string) {
    setDeletingSnap(id);
    await fetch(`/api/snapshots?id=${id}`, { method: 'DELETE' });
    await fetchAll();
    setDeletingSnap(null);
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <h1>Dashboard</h1>
        <p className="text-neutral text-sm">Loading your data…</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="space-y-5">
        <h1>Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral text-sm">
              No data yet — complete the wizard to see your score.{' '}
              <a href="/financial-analysis" className="text-primary-action underline">
                Add income &amp; expenses
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1>Dashboard</h1>

      {/* 3-column KPI grid */}
      <div className="grid grid-cols-3 gap-5">

        {/* Card 1 — Financial Health Score (col span 1) */}
        <Card className="min-h-[200px]">
          <CardHeader className="pb-2">
            <CardTitle>Financial Health Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900">{score.total}</span>
              <span className="text-neutral mb-1">/100</span>
              <Badge className={`mb-1 ${BAND_COLORS[score.band] ?? ''}`}>{score.band}</Badge>
            </div>
            <Suspense fallback={CHART_SPINNER}>
              <LazyScoreDonut score={score.total} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Card 2 — Monthly Income vs Expenses */}
        <Card className="min-h-[200px]">
          <CardHeader className="pb-2">
            <CardTitle>Monthly Cash Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-neutral">Income</p>
                <p className="font-semibold text-gain">{formatInr(monthlyIncome)}</p>
              </div>
              <div>
                <p className="text-neutral">Expenses</p>
                <p className="font-semibold text-loss">{formatInr(monthlyExpenses)}</p>
              </div>
            </div>
            <Suspense fallback={CHART_SPINNER}>
              <LazyIncomeExpenseBar income={monthlyIncome} expenses={monthlyExpenses} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Card 3 — Net Worth */}
        <Card className="min-h-[200px]">
          <CardHeader className="pb-2">
            <CardTitle>Net Worth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className={`text-2xl font-bold ${nw >= 0 ? 'text-gain' : 'text-loss'}`}>
              {formatInr(nw)}
            </p>
            <Suspense fallback={CHART_SPINNER}>
              <LazyNetWorthBar assets={totalInvestments} liabilities={totalLiabilities} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Card 4 — Savings Rate */}
        <Card className="min-h-[200px]">
          <CardHeader className="pb-2">
            <CardTitle>Savings Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className={`text-3xl font-bold ${sr >= 20 ? 'text-gain' : 'text-loss'}`}>
              {sr.toFixed(1)}%
            </p>
            <p className="text-hint">Healthy target: ≥ 20%</p>
            <Suspense fallback={CHART_SPINNER}>
              <LazySavingsRatePie savingsRate={sr} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Card 5 — Asset Allocation (spans 2 columns) */}
        <Card className="col-span-2 min-h-[200px]">
          <CardHeader className="pb-2">
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={CHART_SPINNER}>
              <LazyAssetAllocationPie investments={investments} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Card 6 — Loan Burden */}
        <Card className="min-h-[200px]">
          <CardHeader className="pb-2">
            <CardTitle>Loan Burden (DTI)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className={`text-3xl font-bold ${dti <= 40 ? 'text-gain' : 'text-loss'}`}>
              {dti.toFixed(1)}%
            </p>
            <p className="text-hint">Safe if &lt; 40%</p>
            <Suspense fallback={CHART_SPINNER}>
              <LazyLoanBurdenBar loans={loans} />
            </Suspense>
          </CardContent>
        </Card>

      </div>

      {/* Goal Progress */}
      {goals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Goal Progress</CardTitle>
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
                    <span className="text-neutral">
                      {formatInr(g.current_savings_inr)} / {formatInr(g.target_amount_inr)}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary-action h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Saved Snapshots */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Saved Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral border-b">
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
                          className="text-loss hover:text-red-700"
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
