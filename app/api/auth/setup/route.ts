import { NextResponse } from 'next/server';
import { PinSetupSchema } from '@/lib/schemas';
import { hashPin, buildSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getHousehold, createHousehold, initSheet } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = PinSetupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
        { status: 400 },
      );
    }

    await initSheet();

    const existing = await getHousehold();
    if (existing) {
      return NextResponse.json({ ok: false, error: 'PIN already set up' }, { status: 409 });
    }

    const pinHash = await hashPin(parsed.data.pin);
    await createHousehold(pinHash);

    const token = buildSessionToken();
    const response = NextResponse.json({ ok: true }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return response;
  } catch (err) {
    console.error('PIN setup error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
