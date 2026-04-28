'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import type { Snapshot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Lazy-load chart panels
const LazySideBySideCharts = lazy(() => import('@/components/compare/SideBySideCharts'));
const LazyTrendCharts = lazy(() => import('@/components/compare/TrendCharts'));

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function fmt(n: number) {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return INR.format(n);
}

function bandColor(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-blue-100 text-blue-800';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function band(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

type ViewTab = 'sidebyside' | 'trend';

const METRICS: { label: string; key: keyof Snapshot; fmt: 'inr' | 'score' | 'pct' }[] = [
  { label: 'Financial Health Score', key: 'financial_health_score', fmt: 'score' },
  { label: 'Net Worth', key: 'net_worth_inr', fmt: 'inr' },
  { label: 'Annual Income', key: 'total_income_annual_inr', fmt: 'inr' },
  { label: 'Annual Expenses', key: 'total_expenses_annual_inr', fmt: 'inr' },
  { label: 'Total Investments', key: 'total_investments_inr', fmt: 'inr' },
  { label: 'Total Liabilities', key: 'total_liabilities_inr', fmt: 'inr' },
  { label: 'Savings Rate', key: 'savings_rate_pct', fmt: 'pct' },
];

function formatVal(v: number, f: 'inr' | 'score' | 'pct') {
  if (f === 'inr') return fmt(v);
  if (f === 'pct') return `${v.toFixed(1)}%`;
  return String(v);
}

function buildSummary(snapA: Snapshot, snapB: Snapshot): string {
  const nwDelta = snapB.net_worth_inr - snapA.net_worth_inr;
  const srDelta = snapB.savings_rate_pct - snapA.savings_rate_pct;
  const nwSign = nwDelta >= 0 ? 'grew' : 'fell';
  const srSign = srDelta >= 0 ? 'improved' : 'fell';

  return (
    `Between ${snapA.snapshot_name} (${snapA.snapshot_date}) and ` +
    `${snapB.snapshot_name} (${snapB.snapshot_date}), your net worth ${nwSign} by ${fmt(Math.abs(nwDelta))} ` +
    `and your savings rate ${srSign} by ${Math.abs(srDelta).toFixed(1)} percentage points.`
  );
}

const CHART_SPINNER = (
  <div className="h-[200px] flex items-center justify-center text-neutral text-sm">
    Loading charts…
  </div>
);

export default function ComparePage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [activeTab, setActiveTab] = useState<ViewTab>('sidebyside');

  useEffect(() => {
    fetch('/api/snapshots')
      .then((r) => r.json())
      .then((j: { ok: boolean; data?: Snapshot[] }) => {
        if (j.ok && j.data) setSnapshots(j.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const snapA = snapshots.find((s) => s.id === idA) ?? null;
  const snapB = snapshots.find((s) => s.id === idB) ?? null;

  function snapLabel(s: Snapshot) {
    return `${s.snapshot_name} (${s.snapshot_date}) — Score ${s.financial_health_score}`;
  }

  return (
    <div className="space-y-5">
      <h1>Snapshot Compare</h1>

      {loading ? (
        <p className="text-neutral text-sm">Loading snapshots…</p>
      ) : snapshots.length < 2 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral text-sm">
              Save at least 2 snapshots to use Compare. Save them from the{' '}
              <a href="/financial-analysis" className="text-primary-action underline">
                Financial Analysis
              </a>{' '}
              page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* View Tabs */}
          <div className="flex gap-2">
            {(
              [
                { id: 'sidebyside', label: 'Side-by-side' },
                { id: 'trend', label: 'Trend over time' },
              ] as { id: ViewTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  activeTab === t.id
                    ? 'bg-primary-action text-white border-primary-action'
                    : 'bg-white text-neutral border-gray-200 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── View A: Side-by-side ── */}
          {activeTab === 'sidebyside' && (
            <>
              {/* Snapshot pickers */}
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-600">Snapshot A (older)</label>
                      <select
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                        value={idA}
                        onChange={(e) => setIdA(e.target.value)}
                      >
                        <option value="">— select —</option>
                        {snapshots.map((s) => (
                          <option key={s.id} value={s.id}>
                            {snapLabel(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-600">Snapshot B (newer)</label>
                      <select
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                        value={idB}
                        onChange={(e) => setIdB(e.target.value)}
                      >
                        <option value="">— select —</option>
                        {snapshots.map((s) => (
                          <option key={s.id} value={s.id}>
                            {snapLabel(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {snapA && snapB && (
                <>
                  {/* Comparison metrics table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {snapA.snapshot_name} vs {snapB.snapshot_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 text-neutral font-medium w-1/3">
                                Metric
                              </th>
                              <th className="text-right py-2 font-semibold">
                                {snapA.snapshot_name}
                                <p className="text-xs text-neutral font-normal">
                                  {snapA.snapshot_date}
                                </p>
                              </th>
                              <th className="text-right py-2 font-semibold">
                                {snapB.snapshot_name}
                                <p className="text-xs text-neutral font-normal">
                                  {snapB.snapshot_date}
                                </p>
                              </th>
                              <th className="text-right py-2 text-neutral font-medium">Change</th>
                            </tr>
                          </thead>
                          <tbody>
                            {METRICS.map((row) => {
                              const va = Number(snapA[row.key]);
                              const vb = Number(snapB[row.key]);
                              const delta = va !== 0 ? ((vb - va) / Math.abs(va)) * 100 : null;
                              const deltaStr =
                                delta !== null
                                  ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
                                  : '—';
                              const deltaColor =
                                delta === null ? '' : delta >= 0 ? 'text-gain' : 'text-loss';
                              return (
                                <tr key={String(row.key)} className="border-b last:border-0">
                                  <td className="py-3 text-neutral">{row.label}</td>
                                  <td className="py-3 text-right font-medium">
                                    {row.key === 'financial_health_score' ? (
                                      <span className="flex items-center justify-end gap-1.5">
                                        {va}
                                        <Badge className={bandColor(va)}>{band(va)}</Badge>
                                      </span>
                                    ) : (
                                      formatVal(va, row.fmt)
                                    )}
                                  </td>
                                  <td className="py-3 text-right font-medium">
                                    {row.key === 'financial_health_score' ? (
                                      <span className="flex items-center justify-end gap-1.5">
                                        {vb}
                                        <Badge className={bandColor(vb)}>{band(vb)}</Badge>
                                      </span>
                                    ) : (
                                      formatVal(vb, row.fmt)
                                    )}
                                  </td>
                                  <td className={`py-3 text-right text-sm font-medium ${deltaColor}`}>
                                    {deltaStr}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Auto-generated summary */}
                      <div className="mt-4 p-4 rounded-xl bg-gray-50 text-sm text-gray-700">
                        {buildSummary(snapA, snapB)}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Side-by-side charts */}
                  <Suspense fallback={CHART_SPINNER}>
                    <LazySideBySideCharts snapA={snapA} snapB={snapB} />
                  </Suspense>
                </>
              )}
            </>
          )}

          {/* ── View B: Trend ── */}
          {activeTab === 'trend' && (
            <Suspense fallback={CHART_SPINNER}>
              <LazyTrendCharts snapshots={[...snapshots].reverse()} />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}
