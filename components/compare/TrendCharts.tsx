'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { Snapshot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
};

function fmt(n: number) {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

interface Props {
  /** Snapshots in chronological order (oldest first). */
  snapshots: Snapshot[];
}

export default function TrendCharts({ snapshots }: Props) {
  const data = snapshots.map((s) => ({
    date: s.snapshot_date,
    score: s.financial_health_score,
    netWorth: s.net_worth_inr,
    savingsRate: Number(s.savings_rate_pct.toFixed(1)),
    income: Math.round(s.total_income_annual_inr / 12),
    expenses: Math.round(s.total_expenses_annual_inr / 12),
    // DTI approximation from snapshot data
    dti:
      s.total_income_annual_inr > 0
        ? Number(((s.total_liabilities_inr / s.total_income_annual_inr) * 100).toFixed(1))
        : 0,
  }));

  const commonXAxis = (
    <XAxis dataKey="date" tick={{ fontSize: 13 }} tickLine={false} />
  );

  return (
    <div className="space-y-5">

      {/* 1 — Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              {commonXAxis}
              <YAxis domain={[0, 100]} tick={{ fontSize: 13 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#1A56DB"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2 — Net Worth */}
      <Card>
        <CardHeader>
          <CardTitle>Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
              {commonXAxis}
              <YAxis tickFormatter={fmt} tick={{ fontSize: 13 }} />
              <Tooltip formatter={(v) => fmt(v as number)} contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="#0D9488"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Net Worth"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3 — Savings Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Savings Rate (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              {commonXAxis}
              <YAxis tick={{ fontSize: 13 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="savingsRate"
                stroke="#1A56DB"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Savings Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4 — Income vs Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
              {commonXAxis}
              <YAxis tickFormatter={fmt} tick={{ fontSize: 13 }} />
              <Tooltip formatter={(v) => fmt(v as number)} contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#1A56DB"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#DC2626"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 5 — DTI Ratio with 40% reference line */}
      <Card>
        <CardHeader>
          <CardTitle>Debt-to-Income Ratio (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              {commonXAxis}
              <YAxis tick={{ fontSize: 13 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={TOOLTIP_STYLE} />
              <ReferenceLine
                y={40}
                stroke="#DC2626"
                strokeDasharray="4 3"
                label={{ value: 'Safe limit', position: 'right', fontSize: 13, fill: '#DC2626' }}
              />
              <Line
                type="monotone"
                dataKey="dti"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="DTI"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}
