'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Loan } from '@/types';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const LOAN_LABELS: Record<Loan['loan_type'], string> = {
  home_loan: 'Home',
  car_loan: 'Car',
  personal_loan: 'Personal',
  education_loan: 'Education',
  credit_card: 'CC',
  other: 'Other',
};

interface Props {
  loans: Loan[];
}

export default function LoanBurdenBar({ loans }: Props) {
  if (loans.length === 0) {
    return <p className="text-hint text-center py-4">No active loans.</p>;
  }

  const data = loans.map((l) => ({
    name: LOAN_LABELS[l.loan_type],
    emi: l.emi_inr,
  }));

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <XAxis dataKey="name" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} />
        <YAxis hide />
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
        <Bar dataKey="emi" fill="#DC2626" radius={[4, 4, 0, 0]} name="EMI" />
      </BarChart>
    </ResponsiveContainer>
  );
}
