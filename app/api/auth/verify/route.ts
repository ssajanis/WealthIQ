import { NextResponse } from 'next/server';
import { PinLoginSchema } from '@/lib/schemas';
import { verifyPin, buildSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getHousehold } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = PinLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
        { status: 400 },
      );
    }

    const household = await getHousehold();
    if (!household) {
      return NextResponse.json({ ok: false, error: 'No PIN set up yet' }, { status: 404 });
    }

    const valid = await verifyPin(parsed.data.pin, household.pin_hash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Incorrect PIN' }, { status: 401 });
    }

    const token = buildSessionToken();
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (err) {
    console.error('PIN verify error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
