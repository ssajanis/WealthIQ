'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { PinSetupSchema, type PinSetupInput } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SetupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PinSetupInput>({
    resolver: zodResolver(PinSetupSchema),
  });

  async function onSubmit(data: PinSetupInput) {
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setServerError(json.error ?? 'Setup failed');
        return;
      }
      router.push('/dashboard');
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to WealthIQ India</CardTitle>
          <CardDescription>
            Set a 4–6 digit PIN to protect your financial data. You&apos;ll need it every time you
            open the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="pin">Create PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="4–6 digits"
                aria-describedby={errors.pin ? 'pin-error' : undefined}
                {...register('pin')}
              />
              {errors.pin && (
                <p id="pin-error" className="text-sm text-red-600" role="alert">
                  {errors.pin.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirm_pin">Confirm PIN</Label>
              <Input
                id="confirm_pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Repeat PIN"
                aria-describedby={errors.confirm_pin ? 'confirm-pin-error' : undefined}
                {...register('confirm_pin')}
              />
              {errors.confirm_pin && (
                <p id="confirm-pin-error" className="text-sm text-red-600" role="alert">
                  {errors.confirm_pin.message}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-red-600" role="alert">
                {serverError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up…' : 'Create PIN & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
