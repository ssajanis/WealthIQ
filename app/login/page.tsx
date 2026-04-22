'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { PinLoginSchema, type PinLoginInput } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PinLoginInput>({
    resolver: zodResolver(PinLoginSchema),
  });

  async function onSubmit(data: PinLoginInput) {
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setServerError(json.error ?? 'Login failed');
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
          <CardTitle className="text-2xl">WealthIQ India</CardTitle>
          <CardDescription>Enter your PIN to access your financial dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter your PIN"
                autoFocus
                aria-describedby={errors.pin ? 'pin-error' : undefined}
                {...register('pin')}
              />
              {errors.pin && (
                <p id="pin-error" className="text-sm text-red-600" role="alert">
                  {errors.pin.message}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-red-600" role="alert">
                {serverError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Enter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
