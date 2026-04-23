import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, validateSessionToken } from '@/lib/auth';
import { listSnapshots, createSnapshot, deleteSnapshot } from '@/lib/sheets';
import { z } from 'zod';

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token && validateSessionToken(token);
}

const SnapshotCreateSchema = z.object({
  snapshot_name: z.string().min(1).max(100),
  snapshot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  financial_health_score: z.number().min(0).max(100),
  total_income_annual_inr: z.number().min(0),
  total_expenses_annual_inr: z.number().min(0),
  total_investments_inr: z.number().min(0),
  total_liabilities_inr: z.number().min(0),
  net_worth_inr: z.number(),
  savings_rate_pct: z.number(),
  score_breakdown_json: z.string(),
});

export async function GET() {
  if (!(await requireAuth()))
    return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  try {
    const data = await listSnapshots();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAuth()))
    return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  try {
    const body: unknown = await request.json();
    const parsed = SnapshotCreateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message },
        { status: 400 },
      );

    // Enforce 20-snapshot FIFO cap (PRD Section 5.9)
    const existing = await listSnapshots();
    if (existing.length >= 20) {
      const oldest = existing[existing.length - 1];
      if (oldest) await deleteSnapshot(oldest.id);
    }

    const data = await createSnapshot(parsed.data);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Failed to save snapshot' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAuth()))
    return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });
    await deleteSnapshot(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Failed to delete snapshot' }, { status: 500 });
  }
}
