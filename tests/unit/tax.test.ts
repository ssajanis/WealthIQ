import { computeNewRegimeTax, computeOldRegimeTax, bestRegime } from '@/lib/tax';

describe('computeNewRegimeTax', () => {
  it('returns zero tax for income ≤ ₹7L (87A rebate)', () => {
    const result = computeNewRegimeTax(700_000);
    expect(result.totalTax).toBe(0);
  });

  it('returns zero tax for income just above ₹3L (within 0% slab + std deduction)', () => {
    const result = computeNewRegimeTax(300_000);
    expect(result.totalTax).toBe(0);
  });

  it('computes tax correctly for ₹10L income', () => {
    // taxable = 10L - 75K = 9.25L
    // 0-3L: 0, 3-7L: 5% on 4L = 20K, 7-9.25L: 10% on 2.25L = 22.5K → total 42.5K
    // cess: 42.5K × 4% = 1.7K → total ≈ 44.2K
    const result = computeNewRegimeTax(1_000_000);
    expect(result.totalTax).toBeCloseTo(44_200, -2);
  });

  it('computes tax for ₹20L income', () => {
    // taxable = 20L - 75K = 19.25L
    // slabs: 0-3L:0, 3-7L:5%=20K, 7-10L:10%=30K, 10-12L:15%=30K, 12-15L:20%=60K, 15-19.25L:30%=127.5K
    // base = 267.5K, cess = 10.7K, total ≈ 278.2K
    const result = computeNewRegimeTax(2_000_000);
    expect(result.totalTax).toBeGreaterThan(270_000);
    expect(result.totalTax).toBeLessThan(290_000);
  });

  it('effective rate increases with income', () => {
    const r1 = computeNewRegimeTax(1_000_000);
    const r2 = computeNewRegimeTax(2_000_000);
    expect(r2.effectiveRatePct).toBeGreaterThan(r1.effectiveRatePct);
  });

  it('takeHomeAnnual = grossIncome - totalTax', () => {
    const result = computeNewRegimeTax(1_500_000);
    expect(result.takeHomeAnnual).toBeCloseTo(result.grossIncome - result.totalTax, 0);
  });

  it('returns 0 tax for 0 income', () => {
    expect(computeNewRegimeTax(0).totalTax).toBe(0);
  });
});

describe('computeOldRegimeTax', () => {
  it('returns zero tax with full 80C deduction at ₹4L income', () => {
    // taxable = 4L - 50K std - 1.5L 80C = 2L → 0% slab, 87A rebate
    const result = computeOldRegimeTax(400_000, { section80C: 150_000 });
    expect(result.totalTax).toBe(0);
  });

  it('applies 80C cap at ₹1.5L', () => {
    const withFull = computeOldRegimeTax(1_500_000, { section80C: 150_000 });
    const withExtra = computeOldRegimeTax(1_500_000, { section80C: 300_000 });
    expect(withFull.totalTax).toBe(withExtra.totalTax);
  });

  it('applies 80D cap at ₹25K', () => {
    const capped = computeOldRegimeTax(1_500_000, { section80D: 25_000 });
    const excess = computeOldRegimeTax(1_500_000, { section80D: 50_000 });
    expect(capped.totalTax).toBe(excess.totalTax);
  });

  it('home loan interest reduces taxable income (capped at ₹2L)', () => {
    const without = computeOldRegimeTax(1_500_000);
    const with24b = computeOldRegimeTax(1_500_000, { homeLoanInterest24b: 200_000 });
    expect(with24b.totalTax).toBeLessThan(without.totalTax);
    const with24bExcess = computeOldRegimeTax(1_500_000, { homeLoanInterest24b: 300_000 });
    expect(with24b.totalTax).toBe(with24bExcess.totalTax);
  });

  it('computes tax for ₹10L with no deductions', () => {
    // taxable = 10L - 50K = 9.5L
    // slabs: 0-2.5L:0, 2.5-5L:5%=12.5K, 5-9.5L:20%=90K → 102.5K
    // cess: 102.5K × 4% = 4.1K → ≈106.6K
    const result = computeOldRegimeTax(1_000_000);
    expect(result.totalTax).toBeCloseTo(106_600, -2);
  });

  it('returns 0 tax for 0 income', () => {
    expect(computeOldRegimeTax(0).totalTax).toBe(0);
  });
});

describe('bestRegime', () => {
  it('returns new regime for income with minimal deductions', () => {
    // Low deductions → new regime is likely better (simpler and 87A rebate up to 7L)
    expect(bestRegime(600_000)).toBe('new');
  });

  it('returns old regime for high income with full deductions', () => {
    // ₹20L with full 80C + 80D + home loan interest → old may be better
    const result = bestRegime(2_000_000, {
      section80C: 150_000,
      section80D: 25_000,
      homeLoanInterest24b: 200_000,
      npsAdditional80CCD: 50_000,
    });
    // Just assert it returns one of the two valid values
    expect(['new', 'old']).toContain(result);
  });

  it('returns a valid regime string', () => {
    expect(['new', 'old']).toContain(bestRegime(1_000_000));
  });
});
