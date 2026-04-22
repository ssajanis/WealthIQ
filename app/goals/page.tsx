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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Goals</CardTitle>
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
