'use client';

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

interface Props {
  income: number;
  expenses: number;
}

export default function IncomeExpenseBar({ income, expenses }: Props) {
  const month = new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' });
  const data = [
    { name: 'Income', value: Math.round(income), fill: '#1A56DB' },
    { name: 'Expenses', value: Math.round(expenses), fill: '#DC2626' },
  ];

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <XAxis dataKey="name" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(v) => INR.format(v as number)}
          labelFormatter={() => month}
          contentStyle={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
