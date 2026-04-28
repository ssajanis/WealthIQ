'use client';

import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

interface Props {
  assets: number;
  liabilities: number;
}

export default function NetWorthBar({ assets, liabilities }: Props) {
  const data = [
    { name: 'Assets', value: Math.round(assets), fill: '#0D9488' },
    { name: 'Liabilities', value: Math.round(liabilities), fill: '#DC2626' },
  ];

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
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
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
