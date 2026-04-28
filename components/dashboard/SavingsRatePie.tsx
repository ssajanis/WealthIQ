'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  savingsRate: number;
}

export default function SavingsRatePie({ savingsRate }: Props) {
  const saved = Math.max(0, Math.min(100, savingsRate));
  const spent = 100 - saved;
  const data = [
    { name: 'Saved', value: saved, fill: '#0D9488' },
    { name: 'Spent', value: spent, fill: '#9CA3AF' },
  ];

  return (
    <ResponsiveContainer width="100%" height={100}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={28}
          outerRadius={44}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => `${(v as number).toFixed(1)}%`}
          contentStyle={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
