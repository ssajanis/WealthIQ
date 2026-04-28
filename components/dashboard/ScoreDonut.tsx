'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface Props {
  score: number;
}

export default function ScoreDonut({ score }: Props) {
  const fill = score >= 70 ? '#0D9488' : score >= 40 ? '#F59E0B' : '#DC2626';
  const data = [{ value: score, fill }];

  return (
    <ResponsiveContainer width="100%" height={100}>
      <RadialBarChart
        cx="50%"
        cy="100%"
        innerRadius="60%"
        outerRadius="100%"
        startAngle={180}
        endAngle={0}
        data={data}
        barSize={14}
      >
        <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#F3F4F6' }} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
