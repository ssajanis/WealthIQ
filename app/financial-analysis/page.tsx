'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IncomeSchema, ExpenseSchema, type IncomeInput, type ExpenseInput } from '@/lib/schemas';
import type { Income, Expense, Investment, Loan, Goal, Insurance } from '@/types';
import { computeFinancialHealthScore } from '@/lib/score';
import { Badge } from '@/components/ui/badge';
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

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function FinancialAnalysisPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingIncome, setDeletingIncome] = useState<string | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);
  const [submittingIncome, setSubmittingIncome] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [incomeError, setIncomeError] = useState('');
  const [expenseError, setExpenseError] = useState('');

  const incomeForm = useForm<IncomeInput>({
    resolver: zodResolver(IncomeSchema) as Resolver<IncomeInput>,
    defaultValues: { source_type: 'salary', tax_regime: 'new', is_primary_earner: false },
  });

  const expenseForm = useForm<ExpenseInput>({
    resolver: zodResolver(ExpenseSchema) as Resolver<ExpenseInput>,
    defaultValues: { category: 'housing', is_fixed: true },
  });

  async function fetchAll() {
    setLoading(true);
    const [incRes, expRes, invRes, loRes, goRes, insRes] = await Promise.all([
      fetch('/api/income'),
      fetch('/api/expenses'),
      fetch('/api/investments'),
      fetch('/api/loans'),
      fetch('/api/goals'),
      fetch('/api/insurance'),
    ]);
    const [incJson, expJson, invJson, loJson, goJson, insJson] = await Promise.all([
      incRes.json() as Promise<{ ok: boolean; data?: Income[] }>,
      expRes.json() as Promise<{ ok: boolean; data?: Expense[] }>,
      invRes.json() as Promise<{ ok: boolean; data?: Investment[] }>,
      loRes.json() as Promise<{ ok: boolean; data?: Loan[] }>,
      goRes.json() as Promise<{ ok: boolean; data?: Goal[] }>,
      insRes.json() as Promise<{ ok: boolean; data?: Insurance[] }>,
    ]);
    if (incJson.ok && incJson.data) setIncomes(incJson.data);
    if (expJson.ok && expJson.data) setExpenses(expJson.data);
    if (invJson.ok && invJson.data) setInvestments(invJson.data);
    if (loJson.ok && loJson.data) setLoans(loJson.data);
    if (goJson.ok && goJson.data) setGoals(goJson.data);
    if (insJson.ok && insJson.data) setInsurance(insJson.data);
    setLoading(false);
  }

  useEffect(() => {
    void fetchAll();
  }, []);

  async function onIncomeSubmit(data: IncomeInput) {
    setSubmittingIncome(true);
    setIncomeError('');
    // User enters monthly; store annual (monthly × 12) in DB
    const payload: IncomeInput = { ...data, gross_annual_inr: data.gross_annual_inr * 12 };
    const res = await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      setIncomeError(json.error ?? 'Failed to save');
      setSubmittingIncome(false);
      return;
    }
    incomeForm.reset({ source_type: 'salary', tax_regime: 'new', is_primary_earner: false });
    await fetchAll();
    setSubmittingIncome(false);
  }

  async function onExpenseSubmit(data: ExpenseInput) {
    setSubmittingExpense(true);
    setExpenseError('');
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      setExpenseError(json.error ?? 'Failed to save');
      setSubmittingExpense(false);
      return;
    }
    expenseForm.reset({ category: 'housing', is_fixed: true });
    await fetchAll();
    setSubmittingExpense(false);
  }

  const totalAnnualIncome = incomes.reduce((s, i) => s + i.gross_annual_inr, 0);
  const totalMonthlyIncome = totalAnnualIncome / 12;
  const totalMonthlyExpenses = expenses.reduce((s, e) => s + e.monthly_amount_inr, 0);

  const scoreResult = computeFinancialHealthScore({
    incomes,
    expenses,
    investments,
    loans,
    goals,
    insurance,
  });

  const BAND_COLORS: Record<string, string> = {
    Excellent: 'bg-green-100 text-green-800',
    Good: 'bg-blue-100 text-blue-800',
    Fair: 'bg-yellow-100 text-yellow-800',
    Poor: 'bg-red-100 text-red-800',
  };

  async function saveSnapshot() {
    if (!snapshotName.trim()) return;
    setSavingSnapshot(true);
    const today = new Date().toISOString().split('T')[0] ?? '';
    await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshot_name: snapshotName.trim(),
        snapshot_date: today,
        financial_health_score: scoreResult.total,
        total_income_annual_inr: scoreResult.metrics.annualIncomeInr,
        total_expenses_annual_inr: scoreResult.metrics.annualExpensesInr,
        total_investments_inr: scoreResult.metrics.totalInvestmentsInr,
        total_liabilities_inr: scoreResult.metrics.totalLiabilitiesInr,
        net_worth_inr: scoreResult.metrics.netWorthInr,
        savings_rate_pct: scoreResult.metrics.savingsRatePct,
        score_breakdown_json: JSON.stringify(scoreResult.dimensions),
      }),
    });
    setSavingSnapshot(false);
    setSnapshotSaved(true);
    setSnapshotName('');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Financial Analysis</h1>

      {!loading && (incomes.length > 0 || expenses.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500">Total Monthly Income</p>
              <p className="text-xl font-semibold">{INR.format(totalMonthlyIncome)}</p>
              <p className="text-hint">Annual: {INR.format(totalAnnualIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500">Total Monthly Expenses</p>
              <p className="text-xl font-semibold">{INR.format(totalMonthlyExpenses)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Income ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Monthly Income Source</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={incomeForm.handleSubmit(onIncomeSubmit)}
            noValidate
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1">
              <Label htmlFor="source_name">Source Name</Label>
              <Input
                id="source_name"
                placeholder="e.g. Primary Salary"
                {...incomeForm.register('source_name')}
              />
              {incomeForm.formState.errors.source_name && (
                <p className="text-sm text-red-600" role="alert">
                  {incomeForm.formState.errors.source_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="source_type">Type</Label>
              <Select
                defaultValue="salary"
                onValueChange={(v) =>
                  incomeForm.setValue('source_type', v as IncomeInput['source_type'])
                }
              >
                <SelectTrigger id="source_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                  <SelectItem value="interest">Interest / Dividends</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="gross_annual">Monthly Gross Income (₹ per month)</Label>
              <Input
                id="gross_annual"
                type="number"
                min={0}
                placeholder="100000"
                {...incomeForm.register('gross_annual_inr')}
              />
              <p className="text-hint">We calculate your annual figure automatically.</p>
              {incomeForm.formState.errors.gross_annual_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {incomeForm.formState.errors.gross_annual_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="tax_regime">Tax Regime</Label>
              <Select
                defaultValue="new"
                onValueChange={(v) =>
                  incomeForm.setValue('tax_regime', v as IncomeInput['tax_regime'])
                }
              >
                <SelectTrigger id="tax_regime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Regime (default from FY 2023-24)</SelectItem>
                  <SelectItem value="old">Old Regime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="is_primary">Primary Earner?</Label>
              <Select
                defaultValue="false"
                onValueChange={(v) => incomeForm.setValue('is_primary_earner', v === 'true')}
              >
                <SelectTrigger id="is_primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {incomeError && (
              <p className="text-sm text-red-600 col-span-full" role="alert">
                {incomeError}
              </p>
            )}
            <div className="col-span-full">
              <Button type="submit" disabled={submittingIncome}>
                {submittingIncome ? 'Saving…' : 'Add Income Source'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <DataTable
              rows={incomes}
              columns={[
                { key: 'source_name', label: 'Source' },
                { key: 'source_type', label: 'Type' },
                {
                  key: 'gross_annual_inr',
                  label: 'Monthly Gross',
                  format: (v) => INR.format(Number(v) / 12),
                },
                { key: 'tax_regime', label: 'Tax Regime' },
              ]}
              onDelete={async (id) => {
                setDeletingIncome(id);
                await fetch(`/api/income?id=${id}`, { method: 'DELETE' });
                await fetchAll();
                setDeletingIncome(null);
              }}
              deleting={deletingIncome}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Expenses ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Monthly Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={expenseForm.handleSubmit(onExpenseSubmit)}
            noValidate
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1">
              <Label htmlFor="exp_category">Category</Label>
              <Select
                defaultValue="housing"
                onValueChange={(v) =>
                  expenseForm.setValue('category', v as ExpenseInput['category'])
                }
              >
                <SelectTrigger id="exp_category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      'housing',
                      'food',
                      'transport',
                      'utilities',
                      'healthcare',
                      'education',
                      'entertainment',
                      'clothing',
                      'other',
                    ] as const
                  ).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="exp_description">Description</Label>
              <Input
                id="exp_description"
                placeholder="e.g. Monthly rent"
                {...expenseForm.register('description')}
              />
              {expenseForm.formState.errors.description && (
                <p className="text-sm text-red-600" role="alert">
                  {expenseForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="monthly_amount_exp">Monthly Amount (₹ per month)</Label>
              <Input
                id="monthly_amount_exp"
                type="number"
                min={0}
                placeholder="40000"
                {...expenseForm.register('monthly_amount_inr')}
              />
              <p className="text-hint">We calculate your annual figure automatically.</p>
              {expenseForm.formState.errors.monthly_amount_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {expenseForm.formState.errors.monthly_amount_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="is_fixed_exp">Fixed Cost?</Label>
              <Select
                defaultValue="true"
                onValueChange={(v) => expenseForm.setValue('is_fixed', v === 'true')}
              >
                <SelectTrigger id="is_fixed_exp">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes — same every month</SelectItem>
                  <SelectItem value="false">No — variable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {expenseError && (
              <p className="text-sm text-red-600 col-span-full" role="alert">
                {expenseError}
              </p>
            )}
            <div className="col-span-full">
              <Button type="submit" disabled={submittingExpense}>
                {submittingExpense ? 'Saving…' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <DataTable
              rows={expenses}
              columns={[
                { key: 'description', label: 'Description' },
                { key: 'category', label: 'Category' },
                {
                  key: 'monthly_amount_inr',
                  label: 'Monthly',
                  format: (v) => INR.format(Number(v)),
                },
                { key: 'is_fixed', label: 'Fixed?', format: (v) => (v ? 'Yes' : 'No') },
              ]}
              onDelete={async (id) => {
                setDeletingExpense(id);
                await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
                await fetchAll();
                setDeletingExpense(null);
              }}
              deleting={deletingExpense}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Financial Health Score ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Health Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : incomes.length === 0 && expenses.length === 0 ? (
            <p className="text-sm text-gray-500">
              Add at least one income or expense above to compute your score.
            </p>
          ) : (
            <>
              <Button
                onClick={() => {
                  setShowAnalysis(true);
                  setSnapshotSaved(false);
                }}
              >
                Compute Financial Health Score
              </Button>

              {showAnalysis && (
                <div className="space-y-4 border rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-gray-900">{scoreResult.total}</span>
                    <span className="text-gray-500">/100</span>
                    <Badge className={BAND_COLORS[scoreResult.band] ?? ''}>{scoreResult.band}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {scoreResult.dimensions.map((d) => (
                      <div key={d.label} className="flex items-center gap-2 text-sm">
                        <span className="w-44 shrink-0 text-gray-600">{d.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${d.rawScore}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-500">
                          {Math.round(d.rawScore)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                    <div>
                      <p className="text-gray-500">Net Worth</p>
                      <p className="font-medium">{INR.format(scoreResult.metrics.netWorthInr)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Savings Rate</p>
                      <p className="font-medium">
                        {scoreResult.metrics.savingsRatePct.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Debt-to-Income</p>
                      <p className="font-medium">{scoreResult.metrics.dtiRatioPct.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Liquid Fund</p>
                      <p className="font-medium">
                        {scoreResult.metrics.liquidSavingsMonths.toFixed(1)} months
                      </p>
                    </div>
                  </div>

                  {!snapshotSaved ? (
                    <div className="flex gap-2 items-center pt-2">
                      <input
                        className="border rounded-lg px-3 py-2 text-sm flex-1"
                        placeholder="Snapshot name (e.g. Q2 2026)"
                        value={snapshotName}
                        onChange={(e) => setSnapshotName(e.target.value)}
                      />
                      <Button
                        disabled={!snapshotName.trim() || savingSnapshot}
                        onClick={() => void saveSnapshot()}
                      >
                        {savingSnapshot ? 'Saving…' : 'Save Snapshot'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Snapshot saved — visible on Dashboard.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
