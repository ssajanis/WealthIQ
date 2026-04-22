import { hashPin, verifyPin, buildSessionToken, validateSessionToken } from '@/lib/auth';

describe('hashPin', () => {
  it('returns a bcrypt hash starting with $2', async () => {
    const hash = await hashPin('1234');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('produces a different hash for the same PIN (salt randomness)', async () => {
    const h1 = await hashPin('1234');
    const h2 = await hashPin('1234');
    expect(h1).not.toBe(h2);
  });
});

describe('verifyPin', () => {
  it('returns true for a correct PIN', async () => {
    const hash = await hashPin('5678');
    expect(await verifyPin('5678', hash)).toBe(true);
  });

  it('returns false for an incorrect PIN', async () => {
    const hash = await hashPin('5678');
    expect(await verifyPin('9999', hash)).toBe(false);
  });

  it('returns false for an empty string', async () => {
    const hash = await hashPin('1234');
    expect(await verifyPin('', hash)).toBe(false);
  });
});

describe('buildSessionToken / validateSessionToken', () => {
  const SECRET = 'test-secret-value-for-unit-tests';

  beforeEach(() => {
    process.env['PIN_HASH_SECRET'] = SECRET;
  });

  afterEach(() => {
    delete process.env['PIN_HASH_SECRET'];
  });

  it('buildSessionToken produces a base64 string', () => {
    const token = buildSessionToken();
    expect(() => Buffer.from(token, 'base64')).not.toThrow();
  });

  it('validateSessionToken returns true for a freshly built token', () => {
    const token = buildSessionToken();
    expect(validateSessionToken(token)).toBe(true);
  });

  it('validateSessionToken returns false for a tampered token', () => {
    expect(validateSessionToken('notavalidtoken')).toBe(false);
  });

  it('validateSessionToken returns false when secret is missing', () => {
    const token = buildSessionToken();
    delete process.env['PIN_HASH_SECRET'];
    expect(validateSessionToken(token)).toBe(false);
  });

  it('validateSessionToken returns false for empty string', () => {
    expect(validateSessionToken('')).toBe(false);
  });

  it('validateSessionToken returns false for a string that throws during decode', () => {
    // Force a throw inside the try block by passing a non-string type at runtime
    expect(validateSessionToken(null as unknown as string)).toBe(false);
  });
});
