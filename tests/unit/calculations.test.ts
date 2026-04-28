import {
  sipFutureValue,
  inflationAdjusted,
  lumpsumFutureValue,
  stepUpSipFutureValue,
  requiredMonthlySip,
  loanEmi,
  totalLoanInterest,
  sipGrowthTable,
  monthsToGoal,
  savingsRate,
  debtToIncomeRatio,
  netWorth,
} from '@/lib/calculations';

describe('sipFutureValue', () => {
  it('matches standard formula for typical SIP', () => {
    // ₹10,000/mo at 12% for 10 years ≈ ₹23.23 L
    const fv = sipFutureValue(10_000, 12, 120);
    expect(fv).toBeCloseTo(2_323_391, -3);
  });

  it('returns 0 for zero months', () => {
    expect(sipFutureValue(10_000, 12, 0)).toBe(0);
  });

  it('returns 0 for zero amount', () => {
    expect(sipFutureValue(0, 12, 120)).toBe(0);
  });

  it('returns simple sum when rate is 0', () => {
    expect(sipFutureValue(1_000, 0, 12)).toBe(12_000);
  });

  it('returns higher value for higher return', () => {
    expect(sipFutureValue(10_000, 15, 120)).toBeGreaterThan(sipFutureValue(10_000, 12, 120));
  });
});

describe('inflationAdjusted', () => {
  it('deflates correctly over 10 years at 6% inflation', () => {
    const real = inflationAdjusted(1_000_000, 6, 10);
    expect(real).toBeCloseTo(558_395, -1);
  });

  it('returns nominal value when years is 0', () => {
    expect(inflationAdjusted(500_000, 6, 0)).toBe(500_000);
  });
});

describe('lumpsumFutureValue', () => {
  it('doubles in ~6 years at 12%', () => {
    const fv = lumpsumFutureValue(100_000, 12, 6);
    expect(fv).toBeGreaterThan(190_000);
    expect(fv).toBeLessThan(210_000);
  });

  it('returns principal for 0 years', () => {
    expect(lumpsumFutureValue(500_000, 12, 0)).toBe(500_000);
  });

  it('grows with higher return rate', () => {
    expect(lumpsumFutureValue(100_000, 15, 10)).toBeGreaterThan(
      lumpsumFutureValue(100_000, 12, 10),
    );
  });
});

describe('stepUpSipFutureValue', () => {
  it('returns higher value than flat SIP with same starting amount', () => {
    const flat = sipFutureValue(10_000, 12, 120);
    const stepUp = stepUpSipFutureValue(10_000, 12, 10, 10);
    expect(stepUp).toBeGreaterThan(flat);
  });

  it('equals flat SIP when step-up is 0%', () => {
    const flat = sipFutureValue(10_000, 12, 120);
    const stepUp = stepUpSipFutureValue(10_000, 12, 10, 0);
    expect(stepUp).toBeCloseTo(flat, -2);
  });

  it('returns 0 for 0 years', () => {
    expect(stepUpSipFutureValue(10_000, 12, 0, 10)).toBe(0);
  });

  it('handles 0% return', () => {
    const result = stepUpSipFutureValue(1_000, 0, 1, 0);
    expect(result).toBeCloseTo(12_000, -1);
  });
});

describe('requiredMonthlySip', () => {
  it('roundtrips with sipFutureValue', () => {
    const target = 10_000_000;
    const sip = requiredMonthlySip(target, 12, 120);
    const fv = sipFutureValue(sip, 12, 120);
    expect(fv).toBeCloseTo(target, -2);
  });

  it('returns 0 for 0 months', () => {
    expect(requiredMonthlySip(1_000_000, 12, 0)).toBe(0);
  });

  it('handles 0% return (divides by months)', () => {
    expect(requiredMonthlySip(120_000, 0, 120)).toBeCloseTo(1_000, 0);
  });
});

describe('loanEmi', () => {
  it('computes standard home loan EMI', () => {
    // ₹60L at 8.5% for 20 years
    const emi = loanEmi(6_000_000, 8.5, 240);
    expect(emi).toBeCloseTo(52_069, 0);
  });

  it('returns principal/months when rate is 0', () => {
    expect(loanEmi(120_000, 0, 12)).toBeCloseTo(10_000, 0);
  });

  it('returns 0 for 0 principal', () => {
    expect(loanEmi(0, 8.5, 120)).toBe(0);
  });

  it('returns 0 for 0 months', () => {
    expect(loanEmi(1_000_000, 8.5, 0)).toBe(0);
  });
});

describe('totalLoanInterest', () => {
  it('is positive for standard loan', () => {
    expect(totalLoanInterest(1_000_000, 10, 60)).toBeGreaterThan(0);
  });

  it('is zero when rate is 0', () => {
    expect(totalLoanInterest(100_000, 0, 12)).toBe(0);
  });

  it('increases with higher rate', () => {
    expect(totalLoanInterest(1_000_000, 12, 60)).toBeGreaterThan(
      totalLoanInterest(1_000_000, 8, 60),
    );
  });
});

describe('sipGrowthTable', () => {
  it('returns correct number of rows', () => {
    expect(sipGrowthTable(10_000, 12, 10)).toHaveLength(10);
  });

  it('corpus is monotonically increasing', () => {
    const table = sipGrowthTable(10_000, 12, 5);
    for (let i = 1; i < table.length; i++) {
      expect(table[i]?.corpus).toBeGreaterThan(table[i - 1]?.corpus ?? 0);
    }
  });

  it('invested amount increases by 12 × monthly each year', () => {
    const table = sipGrowthTable(5_000, 12, 3);
    expect(table[0]?.invested).toBe(60_000);
    expect(table[1]?.invested).toBe(120_000);
  });

  it('corpus matches sipFutureValue at final year', () => {
    const table = sipGrowthTable(10_000, 12, 10);
    const expected = sipFutureValue(10_000, 12, 120);
    expect(table[9]?.corpus).toBeCloseTo(expected, -2);
  });
});

describe('monthsToGoal', () => {
  it('returns 0 when already at target', () => {
    expect(monthsToGoal(100_000, 100_000, 5_000, 12)).toBe(0);
  });

  it('returns Infinity with no SIP and no return', () => {
    expect(monthsToGoal(1_000_000, 0, 0, 0)).toBe(Infinity);
  });

  it('converges to a positive number for reachable goal', () => {
    const m = monthsToGoal(5_000_000, 500_000, 25_000, 12);
    expect(m).toBeGreaterThan(0);
    expect(m).toBeLessThan(300);
  });

  it('returns lower count for higher SIP', () => {
    const m1 = monthsToGoal(3_000_000, 0, 20_000, 12);
    const m2 = monthsToGoal(3_000_000, 0, 30_000, 12);
    expect(m2).toBeLessThan(m1);
  });
});

describe('savingsRate', () => {
  it('computes correctly for standard case', () => {
    // ₹1L income, ₹60K expenses → 40% savings rate
    expect(savingsRate(100_000, 60_000)).toBeCloseTo(40, 5);
  });

  it('returns 0 when income is zero', () => {
    expect(savingsRate(0, 50_000)).toBe(0);
  });

  it('returns 0 when expenses equal income', () => {
    expect(savingsRate(100_000, 100_000)).toBeCloseTo(0, 5);
  });

  it('returns negative when expenses exceed income', () => {
    expect(savingsRate(50_000, 70_000)).toBeLessThan(0);
  });
});

describe('debtToIncomeRatio', () => {
  it('computes correctly for standard case', () => {
    // ₹40K EMI on ₹1L income → 40% DTI
    expect(debtToIncomeRatio(40_000, 100_000)).toBeCloseTo(40, 5);
  });

  it('returns 0 when income is zero', () => {
    expect(debtToIncomeRatio(50_000, 0)).toBe(0);
  });

  it('returns 0 when there are no EMIs', () => {
    expect(debtToIncomeRatio(0, 100_000)).toBe(0);
  });

  it('increases proportionally with higher EMI', () => {
    const low = debtToIncomeRatio(20_000, 100_000);
    const high = debtToIncomeRatio(60_000, 100_000);
    expect(high).toBeGreaterThan(low);
  });
});

describe('netWorth', () => {
  it('returns positive when assets exceed liabilities', () => {
    expect(netWorth(5_000_000, 2_000_000)).toBe(3_000_000);
  });

  it('returns negative when liabilities exceed assets', () => {
    expect(netWorth(1_000_000, 3_000_000)).toBe(-2_000_000);
  });

  it('returns zero when assets equal liabilities', () => {
    expect(netWorth(1_000_000, 1_000_000)).toBe(0);
  });

  it('handles zero inputs', () => {
    expect(netWorth(0, 0)).toBe(0);
  });
});
