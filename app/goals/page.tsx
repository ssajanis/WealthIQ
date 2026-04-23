'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GoalSchema, type GoalInput } from '@/lib/schemas';
import type { Goal } from '@/types';
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
import { requiredMonthlySip } from '@/lib/calculations';
import { Badge } from '@/components/ui/badge';

const GOAL_LABELS: Record<Goal['goal_type'], string> = {
  retirement: 'Retirement',
  education: "Children's Education",
  home_purchase: 'Home Purchase',
  vehicle: 'Vehicle',
  emergency_fund: 'Emergency Fund',
  travel: 'Travel',
  other: 'Other',
};

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GoalInput>({
    resolver: zodResolver(GoalSchema) as Resolver<GoalInput>,
    defaultValues: { goal_type: 'retirement' },
  });

  async function fetchGoals() {
    setLoading(true);
    const res = await fetch('/api/goals');
    const json = (await res.json()) as { ok: boolean; data?: Goal[] };
    if (json.ok && json.data) setGoals(json.data);
    setLoading(false);
  }

  useEffect(() => {
    void fetchGoals();
  }, []);

  async function onSubmit(data: GoalInput) {
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/goals', {
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
    reset({ goal_type: 'retirement' });
    await fetchGoals();
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
    await fetchGoals();
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Goals</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1">
              <Label htmlFor="goal_name">Goal Name</Label>
              <Input
                id="goal_name"
                placeholder="e.g. Retirement Corpus"
                {...register('goal_name')}
              />
              {errors.goal_name && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.goal_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="goal_type">Goal Type</Label>
              <Select
                defaultValue="retirement"
                onValueChange={(v) => setValue('goal_type', v as GoalInput['goal_type'])}
              >
                <SelectTrigger id="goal_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="target_amount">Target Amount (₹)</Label>
              <Input
                id="target_amount"
                type="number"
                min={0}
                placeholder="50000000"
                {...register('target_amount_inr')}
              />
              {errors.target_amount_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.target_amount_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="current_savings">Current Savings Towards Goal (₹)</Label>
              <Input
                id="current_savings"
                type="number"
                min={0}
                placeholder="0"
                {...register('current_savings_inr')}
              />
              {errors.current_savings_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.current_savings_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="target_date">Target Date</Label>
              <Input id="target_date" type="date" {...register('target_date')} />
              {errors.target_date && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.target_date.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="goal_sip">Monthly SIP for this Goal (₹, optional)</Label>
              <Input
                id="goal_sip"
                type="number"
                min={0}
                placeholder="25000"
                {...register('monthly_sip_inr')}
              />
              {errors.monthly_sip_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.monthly_sip_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="goal_return">Expected Annual Return (%)</Label>
              <Input
                id="goal_return"
                type="number"
                step="0.1"
                placeholder="12"
                {...register('expected_return_pct')}
              />
              {errors.expected_return_pct && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.expected_return_pct.message}
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
                {submitting ? 'Saving…' : 'Add Goal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Goal Cards ── */}
      {!loading && goals.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const pct =
              g.target_amount_inr > 0
                ? Math.min(100, (g.current_savings_inr / g.target_amount_inr) * 100)
                : 0;
            const targetMs = new Date(g.target_date).getTime();
            const monthsLeft = Math.max(
              0,
              Math.round((targetMs - Date.now()) / (1000 * 60 * 60 * 24 * 30)),
            );
            const requiredSip =
              g.target_amount_inr > g.current_savings_inr
                ? requiredMonthlySip(
                    g.target_amount_inr - g.current_savings_inr,
                    g.expected_return_pct,
                    monthsLeft,
                  )
                : 0;
            const actualSip = g.monthly_sip_inr ?? 0;
            const onTrack = actualSip >= requiredSip * 0.9;
            const statusLabel = pct >= 100 ? 'Done' : onTrack ? 'On Track' : 'Needs Attention';
            const statusColor =
              pct >= 100
                ? 'bg-green-100 text-green-800'
                : onTrack
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800';

            return (
              <Card key={g.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{g.goal_name}</p>
                      <p className="text-xs text-gray-400">{GOAL_LABELS[g.goal_type]}</p>
                    </div>
                    <Badge className={statusColor}>{statusLabel}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Target</p>
                      <p className="font-medium">{INR.format(g.target_amount_inr)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Saved</p>
                      <p className="font-medium">{INR.format(g.current_savings_inr)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">By</p>
                      <p className="font-medium">{g.target_date}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Required SIP</p>
                      <p className="font-medium text-indigo-600">
                        {INR.format(Math.ceil(requiredSip))}/mo
                      </p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 -ml-2"
                      disabled={deleting === g.id}
                      onClick={() => void handleDelete(g.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fallback table for deletion if needed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Goals (table)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <DataTable
              rows={goals}
              columns={[
                { key: 'goal_name', label: 'Goal' },
                {
                  key: 'goal_type',
                  label: 'Type',
                  format: (v) => GOAL_LABELS[v as Goal['goal_type']] ?? String(v),
                },
                { key: 'target_amount_inr', label: 'Target', format: (v) => INR.format(Number(v)) },
                {
                  key: 'current_savings_inr',
                  label: 'Saved',
                  format: (v) => INR.format(Number(v)),
                },
                { key: 'target_date', label: 'By' },
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
