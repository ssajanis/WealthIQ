'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import type { Snapshot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
};

function ScoreDonut({ score, label }: { score: number; label: string }) {
  const fill = score >= 70 ? '#0D9488' : score >= 40 ? '#F59E0B' : '#DC2626';
  return (
    <div className="flex flex-col items-center gap-1">
      <ResponsiveContainer width={120} height={80}>
        <RadialBarChart
          cx="50%"
          cy="100%"
          innerRadius="60%"
          outerRadius="100%"
          startAngle={180}
          endAngle={0}
          data={[{ value: score, fill }]}
          barSize={12}
        >
          <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#F3F4F6' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="text-2xl font-bold text-gray-900">{score}</p>
      <p className="text-hint">{label}</p>
    </div>
  );
}

interface Props {
  snapA: Snapshot;
  snapB: Snapshot;
}

export default function SideBySideCharts({ snapA, snapB }: Props) {
  // Net worth grouped bar
  const nwData = [
    { name: 'Assets', A: snapA.total_investments_inr, B: snapB.total_investments_inr },
    { name: 'Liabilities', A: snapA.total_liabilities_inr, B: snapB.total_liabilities_inr },
    { name: 'Net Worth', A: snapA.net_worth_inr, B: snapB.net_worth_inr },
  ];

  // Income vs Expenses grouped bar (monthly)
  const cashData = [
    {
      name: 'Income',
      A: Math.round(snapA.total_income_annual_inr / 12),
      B: Math.round(snapB.total_income_annual_inr / 12),
    },
    {
      name: 'Expenses',
      A: Math.round(snapA.total_expenses_annual_inr / 12),
      B: Math.round(snapB.total_expenses_annual_inr / 12),
    },
  ];

  const srDelta = snapB.savings_rate_pct - snapA.savings_rate_pct;
  const dtiA =
    snapA.total_income_annual_inr > 0
      ? (snapA.total_liabilities_inr / snapA.total_income_annual_inr) * 100
      : 0;
  const dtiB =
    snapB.total_income_annual_inr > 0
      ? (snapB.total_liabilities_inr / snapB.total_income_annual_inr) * 100
      : 0;
  const dtiDelta = dtiB - dtiA;

  return (
    <div className="space-y-5">
      {/* Score donuts */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around">
            <ScoreDonut score={snapA.financial_health_score} label={snapA.snapshot_name} />
            <ScoreDonut score={snapB.financial_health_score} label={snapB.snapshot_name} />
          </div>
        </CardContent>
      </Card>

      {/* Net Worth grouped bar */}
      <Card>
        <CardHeader>
          <CardTitle>Net Worth Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={nwData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 13 }} />
              <Tooltip formatter={(v) => fmt(v as number)} contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Bar dataKey="A" name={snapA.snapshot_name} fill="#1A56DB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="B" name={snapB.snapshot_name} fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Cash Flow grouped bar */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cashData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 13 }} />
              <Tooltip formatter={(v) => fmt(v as number)} contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Bar dataKey="A" name={snapA.snapshot_name} fill="#1A56DB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="B" name={snapB.snapshot_name} fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Savings Rate and DTI deltas */}
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold">{snapA.savings_rate_pct.toFixed(1)}%</p>
                <p className="text-hint">{snapA.snapshot_name}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{snapB.savings_rate_pct.toFixed(1)}%</p>
                <p className="text-hint">{snapB.snapshot_name}</p>
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${srDelta >= 0 ? 'text-gain' : 'text-loss'}`}
                >
                  {srDelta >= 0 ? '+' : ''}
                  {srDelta.toFixed(1)} pp
                </p>
                <p className="text-hint">Delta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debt-to-Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold">{dtiA.toFixed(1)}%</p>
                <p className="text-hint">{snapA.snapshot_name}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{dtiB.toFixed(1)}%</p>
                <p className="text-hint">{snapB.snapshot_name}</p>
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${dtiDelta <= 0 ? 'text-gain' : 'text-loss'}`}
                >
                  {dtiDelta >= 0 ? '+' : ''}
                  {dtiDelta.toFixed(1)} pp
                </p>
                <p className="text-hint">Delta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
