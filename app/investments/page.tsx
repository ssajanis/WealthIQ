'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvestmentSchema, type InvestmentInput } from '@/lib/schemas';
import type { Investment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DataTable from '@/components/DataTable';
import {
  sipFutureValue,
  lumpsumFutureValue,
  requiredMonthlySip,
  sipGrowthTable,
  inflationAdjusted,
} from '@/lib/calculations';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const INSTRUMENT_LABELS: Record<Investment['instrument'], string> = {
  mutual_fund_equity: 'Mutual Fund — Equity',
  mutual_fund_debt: 'Mutual Fund — Debt',
  mutual_fund_hybrid: 'Mutual Fund — Hybrid',
  ppf: 'PPF (Public Provident Fund)',
  epf: 'EPF (Employee Provident Fund)',
  nps: 'NPS (National Pension System)',
  fd: 'Fixed Deposit (FD)',
  rd: 'Recurring Deposit (RD)',
  stocks: 'Direct Stocks',
  gold: 'Gold',
  real_estate: 'Real Estate',
  other: 'Other',
};

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvestmentInput>({
    resolver: zodResolver(InvestmentSchema) as Resolver<InvestmentInput>,
    defaultValues: { investment_type: 'sip', instrument: 'mutual_fund_equity' },
  });

  const investmentType = watch('investment_type');

  async function fetchInvestments() {
    setLoading(true);
    const res = await fetch('/api/investments');
    const json = (await res.json()) as { ok: boolean; data?: Investment[] };
    if (json.ok && json.data) setInvestments(json.data);
    setLoading(false);
  }

  useEffect(() => {
    void fetchInvestments();
  }, []);

  async function onSubmit(data: InvestmentInput) {
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/investments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      setError(json.error ?? 'Failed to save');
      setSubmitting(false);
      return;
    }
    reset({ investment_type: 'sip', instrument: 'mutual_fund_equity' });
    await fetchInvestments();
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/investments?id=${id}`, { method: 'DELETE' });
    await fetchInvestments();
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Investments</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Investment</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1">
              <Label htmlFor="instrument">Instrument</Label>
              <Select
                defaultValue="mutual_fund_equity"
                onValueChange={(v) => setValue('instrument', v as InvestmentInput['instrument'])}
              >
                <SelectTrigger id="instrument">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSTRUMENT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.instrument && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.instrument.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="inv-name">Name / Label</Label>
              <Input
                id="inv-name"
                placeholder="e.g. SBI Nifty 50 Index Fund"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="investment_type">Type</Label>
              <Select
                defaultValue="sip"
                onValueChange={(v) =>
                  setValue('investment_type', v as InvestmentInput['investment_type'])
                }
              >
                <SelectTrigger id="investment_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sip">SIP (Monthly)</SelectItem>
                  <SelectItem value="lumpsum">Lumpsum</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(investmentType === 'sip' || investmentType === 'recurring') && (
              <div className="space-y-1">
                <Label htmlFor="monthly_amount">Monthly Amount (₹)</Label>
                <Input
                  id="monthly_amount"
                  type="number"
                  min={0}
                  placeholder="25000"
                  {...register('monthly_amount_inr')}
                />
                {errors.monthly_amount_inr && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.monthly_amount_inr.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="current_value">Current Value (₹)</Label>
              <Input
                id="current_value"
                type="number"
                min={0}
                placeholder="500000"
                {...register('current_value_inr')}
              />
              {errors.current_value_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.current_value_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="return_pct">Expected Annual Return (%)</Label>
              <Input
                id="return_pct"
                type="number"
                step="0.1"
                placeholder="12"
                {...register('expected_annual_return_pct')}
              />
              {errors.expected_annual_return_pct && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.expected_annual_return_pct.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="date" {...register('start_date')} />
              {errors.start_date && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 col-span-full" role="alert">
                {error}
              </p>
            )}

            <div className="col-span-full">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Add Investment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Investments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <DataTable
              rows={investments}
              columns={[
                { key: 'name', label: 'Name' },
                {
                  key: 'instrument',
                  label: 'Instrument',
                  format: (v) => INSTRUMENT_LABELS[v as Investment['instrument']] ?? String(v),
                },
                {
                  key: 'current_value_inr',
                  label: 'Current Value',
                  format: (v) => INR.format(Number(v)),
                },
                { key: 'expected_annual_return_pct', label: 'Return %', format: (v) => `${v}%` },
              ]}
              onDelete={handleDelete}
              deleting={deleting}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Calculators ── */}
      <SipCalculator />
      <LumpsumCalculator />
      <GoalPlannerCalculator />
    </div>
  );
}

const INR_FMT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
function fmtInr(n: number) {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return INR_FMT.format(n);
}

function SipCalculator() {
  const [sip, setSip] = useState('');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [stepUp, setStepUp] = useState('0');
  const [inflation, setInflation] = useState('6');
  const [result, setResult] = useState<{
    nominal: number;
    real: number;
    invested: number;
    table: Array<{ year: number; invested: number; corpus: number }>;
  } | null>(null);

  function compute() {
    const p = Number(sip);
    const r = Number(rate);
    const y = Number(years);
    const inf = Number(inflation);
    if (!p || !r || !y) return;
    const nominal = sipFutureValue(p, r, y * 12);
    const real = inflationAdjusted(nominal, inf, y);
    const table = sipGrowthTable(p, r, y);
    setResult({ nominal, real, invested: p * 12 * y, table });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SIP Projection Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Monthly SIP (₹)', value: sip, set: setSip, ph: '25000' },
            { label: 'Annual Return (%)', value: rate, set: setRate, ph: '12' },
            { label: 'Years', value: years, set: setYears, ph: '10' },
            { label: 'Annual Step-up (%)', value: stepUp, set: setStepUp, ph: '0' },
            { label: 'Inflation (%)', value: inflation, set: setInflation, ph: '6' },
          ].map(({ label, value, set, ph }) => (
            <div key={label} className="space-y-1">
              <label className="text-sm text-gray-600">{label}</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full"
                type="number"
                placeholder={ph}
                value={value}
                onChange={(e) => set(e.target.value)}
              />
            </div>
          ))}
        </div>
        <Button onClick={compute}>Calculate</Button>
        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Total Invested</p>
                <p className="font-semibold">{fmtInr(result.invested)}</p>
              </div>
              <div>
                <p className="text-gray-400">Nominal Corpus</p>
                <p className="font-semibold text-indigo-600">{fmtInr(result.nominal)}</p>
              </div>
              <div>
                <p className="text-gray-400">Real Corpus (adj.)</p>
                <p className="font-semibold">{fmtInr(result.real)}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={result.table}>
                <XAxis
                  dataKey="year"
                  label={{ value: 'Year', position: 'insideBottom', offset: -2 }}
                />
                <YAxis tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`} />
                <Tooltip formatter={(v) => fmtInr(v as number)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="invested"
                  stroke="#94a3b8"
                  dot={false}
                  name="Invested"
                />
                <Line type="monotone" dataKey="corpus" stroke="#4f46e5" dot={false} name="Corpus" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LumpsumCalculator() {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [result, setResult] = useState<{ fv: number; gains: number } | null>(null);

  function compute() {
    const p = Number(amount);
    const r = Number(rate);
    const y = Number(years);
    if (!p || !r || !y) return;
    const fv = lumpsumFutureValue(p, r, y);
    setResult({ fv, gains: fv - p });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lumpsum Projection Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Amount (₹)', value: amount, set: setAmount, ph: '500000' },
            { label: 'Annual Return (%)', value: rate, set: setRate, ph: '12' },
            { label: 'Years', value: years, set: setYears, ph: '10' },
          ].map(({ label, value, set, ph }) => (
            <div key={label} className="space-y-1">
              <label className="text-sm text-gray-600">{label}</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full"
                type="number"
                placeholder={ph}
                value={value}
                onChange={(e) => set(e.target.value)}
              />
            </div>
          ))}
        </div>
        <Button onClick={compute}>Calculate</Button>
        {result && (
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Invested</p>
              <p className="font-semibold">{fmtInr(Number(amount))}</p>
            </div>
            <div>
              <p className="text-gray-400">Future Value</p>
              <p className="font-semibold text-indigo-600">{fmtInr(result.fv)}</p>
            </div>
            <div>
              <p className="text-gray-400">Gains</p>
              <p className="font-semibold text-green-600">{fmtInr(result.gains)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GoalPlannerCalculator() {
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [years, setYears] = useState('10');

  const PROFILES = [
    { label: 'Conservative (7%)', rate: 7 },
    { label: 'Moderate (10%)', rate: 10 },
    { label: 'Aggressive (12%)', rate: 12 },
    { label: 'Very Aggressive (15%)', rate: 15 },
  ] as const;

  const results =
    Number(target) > 0 && Number(years) > 0
      ? PROFILES.map(({ label, rate }) => {
          const remaining = Math.max(0, Number(target) - Number(current));
          const months = Number(years) * 12;
          const sip = requiredMonthlySip(remaining, rate, months);
          return { label, sip };
        })
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Goal Planner — Required Monthly SIP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Target Amount (₹)', value: target, set: setTarget, ph: '10000000' },
            { label: 'Current Savings (₹)', value: current, set: setCurrent, ph: '0' },
            { label: 'Years to Goal', value: years, set: setYears, ph: '10' },
          ].map(({ label, value, set, ph }) => (
            <div key={label} className="space-y-1">
              <label className="text-sm text-gray-600">{label}</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full"
                type="number"
                placeholder={ph}
                value={value}
                onChange={(e) => set(e.target.value)}
              />
            </div>
          ))}
        </div>
        {results && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {results.map(({ label, sip }) => (
              <div key={label} className="border rounded-lg p-3 text-sm">
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="font-semibold text-indigo-600 mt-1">{fmtInr(sip)}/mo</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
