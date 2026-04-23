'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoanSchema, type LoanInput } from '@/lib/schemas';
import type { Loan } from '@/types';
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
  rankLoans,
  simulatePrepayment,
  investVsPrepay,
  type PriorityStrategy,
} from '@/lib/loan-priority';
import { Badge } from '@/components/ui/badge';

const LOAN_LABELS: Record<Loan['loan_type'], string> = {
  home_loan: 'Home Loan',
  car_loan: 'Car Loan',
  personal_loan: 'Personal Loan',
  education_loan: 'Education Loan',
  credit_card: 'Credit Card',
  other: 'Other',
};

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [strategy, setStrategy] = useState<PriorityStrategy>('hybrid');
  const [prepayLoanId, setPrepayLoanId] = useState('');
  const [prepayAmount, setPrepayAmount] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('12');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LoanInput>({
    resolver: zodResolver(LoanSchema) as Resolver<LoanInput>,
    defaultValues: { loan_type: 'home_loan' },
  });

  async function fetchLoans() {
    setLoading(true);
    const res = await fetch('/api/loans');
    const json = (await res.json()) as { ok: boolean; data?: Loan[] };
    if (json.ok && json.data) setLoans(json.data);
    setLoading(false);
  }

  useEffect(() => {
    void fetchLoans();
  }, []);

  async function onSubmit(data: LoanInput) {
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/loans', {
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
    reset({ loan_type: 'home_loan' });
    await fetchLoans();
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/loans?id=${id}`, { method: 'DELETE' });
    await fetchLoans();
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Loans</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Loan</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1">
              <Label htmlFor="loan_type">Loan Type</Label>
              <Select
                defaultValue="home_loan"
                onValueChange={(v) => setValue('loan_type', v as LoanInput['loan_type'])}
              >
                <SelectTrigger id="loan_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOAN_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lender_name">Lender Name</Label>
              <Input id="lender_name" placeholder="e.g. HDFC Bank" {...register('lender_name')} />
              {errors.lender_name && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.lender_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="principal_inr">Original Loan Amount (₹)</Label>
              <Input
                id="principal_inr"
                type="number"
                min={0}
                placeholder="6000000"
                {...register('principal_inr')}
              />
              {errors.principal_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.principal_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="outstanding_inr">Outstanding Balance (₹)</Label>
              <Input
                id="outstanding_inr"
                type="number"
                min={0}
                placeholder="5500000"
                {...register('outstanding_inr')}
              />
              {errors.outstanding_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.outstanding_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="interest_rate">Annual Interest Rate (%)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.1"
                placeholder="8.5"
                {...register('annual_interest_rate_pct')}
              />
              {errors.annual_interest_rate_pct && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.annual_interest_rate_pct.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="emi_inr">Monthly EMI (₹)</Label>
              <Input
                id="emi_inr"
                type="number"
                min={0}
                placeholder="52000"
                {...register('emi_inr')}
              />
              {errors.emi_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.emi_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="tenure_months">Tenure Remaining (months)</Label>
              <Input
                id="tenure_months"
                type="number"
                min={1}
                max={360}
                placeholder="180"
                {...register('tenure_remaining_months')}
              />
              {errors.tenure_remaining_months && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.tenure_remaining_months.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="loan_start_date">Start Date</Label>
              <Input id="loan_start_date" type="date" {...register('start_date')} />
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
                {submitting ? 'Saving…' : 'Add Loan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Loans</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <DataTable
              rows={loans}
              columns={[
                { key: 'lender_name', label: 'Lender' },
                {
                  key: 'loan_type',
                  label: 'Type',
                  format: (v) => LOAN_LABELS[v as Loan['loan_type']] ?? String(v),
                },
                {
                  key: 'outstanding_inr',
                  label: 'Outstanding',
                  format: (v) => INR.format(Number(v)),
                },
                { key: 'emi_inr', label: 'EMI / month', format: (v) => INR.format(Number(v)) },
                { key: 'annual_interest_rate_pct', label: 'Rate', format: (v) => `${v}%` },
              ]}
              onDelete={handleDelete}
              deleting={deleting}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Priority Engine ── */}
      {loans.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loan Closure Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {(['avalanche', 'snowball', 'hybrid'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStrategy(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      strategy === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {rankLoans(loans, strategy).map((ranked) => (
                  <div
                    key={ranked.loan.id}
                    className="flex items-start gap-3 p-3 rounded-xl border bg-white"
                  >
                    <span className="text-xl font-bold text-indigo-500 w-6 shrink-0">
                      {ranked.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {LOAN_LABELS[ranked.loan.loan_type]} — {ranked.loan.lender_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{ranked.explanation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {INR.format(ranked.loan.outstanding_inr)}
                      </p>
                      <p className="text-xs text-gray-400">outstanding</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prepayment Simulator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Select Loan</label>
                  <select
                    className="border rounded-lg px-3 py-2 text-sm w-full"
                    value={prepayLoanId}
                    onChange={(e) => setPrepayLoanId(e.target.value)}
                  >
                    <option value="">— choose —</option>
                    {loans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {LOAN_LABELS[l.loan_type]} — {l.lender_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Lumpsum Amount (₹)</label>
                  <input
                    className="border rounded-lg px-3 py-2 text-sm w-full"
                    type="number"
                    placeholder="200000"
                    value={prepayAmount}
                    onChange={(e) => setPrepayAmount(e.target.value)}
                  />
                </div>
              </div>
              {(() => {
                const loan = loans.find((l) => l.id === prepayLoanId);
                const lumpsum = Number(prepayAmount);
                if (!loan || !lumpsum) return null;
                const sim = simulatePrepayment(loan, lumpsum);
                return (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400">Months Saved</p>
                      <p className="font-semibold text-green-600">{sim.monthsSaved} months</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Interest Saved</p>
                      <p className="font-semibold text-green-600">
                        {INR.format(sim.interestSaved)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">New Tenure</p>
                      <p className="font-semibold">{sim.newTenureMonths} months</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invest vs Prepay Advisor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 max-w-xs">
                <label className="text-sm text-gray-600">Your Expected Investment Return (%)</label>
                <input
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                  type="number"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                {loans.map((l) => {
                  const result = investVsPrepay(l, Number(expectedReturn));
                  const color =
                    result.decision === 'PREPAY'
                      ? 'bg-red-100 text-red-800'
                      : result.decision === 'INVEST'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800';
                  return (
                    <div
                      key={l.id}
                      className="flex items-start gap-3 p-3 rounded-xl border bg-white"
                    >
                      <Badge className={color}>{result.decision}</Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {LOAN_LABELS[l.loan_type]} — {l.lender_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{result.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
