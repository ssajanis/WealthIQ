'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Investment } from '@/types';

const BUCKET_COLORS: Record<string, string> = {
  Equity: '#1A56DB',
  Debt: '#0EA5E9',
  Gold: '#F59E0B',
  'Real Estate': '#0D9488',
  Other: '#6B7280',
};

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

interface Props {
  investments: Investment[];
}

export default function AssetAllocationPie({ investments }: Props) {
  let equity = 0, debt = 0, gold = 0, realEstate = 0, other = 0;

  for (const inv of investments) {
    const v = inv.current_value_inr;
    if (['mutual_fund_equity', 'mutual_fund_hybrid', 'stocks'].includes(inv.instrument))
      equity += v;
    else if (['mutual_fund_debt', 'fd', 'rd', 'epf'].includes(inv.instrument))
      debt += v;
    else if (inv.instrument === 'gold') gold += v;
    else if (inv.instrument === 'real_estate') realEstate += v;
    else other += v;
  }

  const buckets: Record<string, number> = {
    Equity: equity,
    Debt: debt,
    Gold: gold,
    'Real Estate': realEstate,
    Other: other,
  };

  const data = Object.entries(buckets)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return <p className="text-hint text-center py-4">No investments yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={data}
          cx="40%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={BUCKET_COLORS[entry.name] ?? '#6B7280'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => INR.format(v as number)}
          contentStyle={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
          }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value: string) => {
            const entry = data.find((d) => d.name === value);
            return `${value} — ${INR.format(entry?.value ?? 0)}`;
          }}
          wrapperStyle={{ fontSize: 14 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
