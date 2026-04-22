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
    </div>
  );
}
