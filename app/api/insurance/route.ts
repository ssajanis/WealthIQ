import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, validateSessionToken } from '@/lib/auth';
import { listInsurance, createInsurance, deleteInsurance } from '@/lib/sheets';
import { InsuranceSchema } from '@/lib/schemas';

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token && validateSessionToken(token);
}

export async function GET() {
  if (!(await requireAuth()))
    return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  try {
    const data = await listInsurance();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch insurance' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAuth()))
    return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  try {
    const body: unknown = await request.json();
    const parsed = InsuranceSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    const data = await createInsurance(parsed.data);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Failed to create insurance' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAuth()))
    return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });
    await deleteInsurance(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Failed to delete insurance' }, { status: 500 });
  }
}
