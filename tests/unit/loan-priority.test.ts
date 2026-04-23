import {
  rankLoansAvalanche,
  rankLoansSnowball,
  rankLoansHybrid,
  rankLoans,
  simulatePrepayment,
  investVsPrepay,
} from '@/lib/loan-priority';
import type { Loan } from '@/types';

const makeLoan = (
  id: string,
  type: Loan['loan_type'],
  outstanding: number,
  rate: number,
  emi: number,
  tenure: number,
): Loan => ({
  id,
  loan_type: type,
  lender_name: 'Bank',
  principal_inr: outstanding,
  outstanding_inr: outstanding,
  annual_interest_rate_pct: rate,
  emi_inr: emi,
  tenure_remaining_months: tenure,
  start_date: '2022-01-01',
  created_at: '',
  updated_at: '',
});

const homeLoan = makeLoan('h', 'home_loan', 5_000_000, 8.5, 43_391, 180);
const carLoan = makeLoan('c', 'car_loan', 500_000, 10.5, 10_751, 60);
const creditCard = makeLoan('cc', 'credit_card', 100_000, 36, 5_000, 24);
const eduLoan = makeLoan('e', 'education_loan', 800_000, 9, 8_300, 120);

const loans = [homeLoan, carLoan, creditCard, eduLoan];

describe('rankLoansAvalanche', () => {
  it('ranks credit card first (highest rate)', () => {
    const ranked = rankLoansAvalanche(loans);
    expect(ranked[0]?.loan.id).toBe('cc');
  });

  it('ranks home loan last (lowest rate)', () => {
    const ranked = rankLoansAvalanche(loans);
    expect(ranked[ranked.length - 1]?.loan.id).toBe('h');
  });

  it('returns all loans', () => {
    expect(rankLoansAvalanche(loans)).toHaveLength(4);
  });

  it('assigns sequential ranks', () => {
    const ranked = rankLoansAvalanche(loans);
    ranked.forEach((r, i) => expect(r.rank).toBe(i + 1));
  });
});

describe('rankLoansSnowball', () => {
  it('ranks credit card first (lowest balance)', () => {
    const ranked = rankLoansSnowball(loans);
    expect(ranked[0]?.loan.id).toBe('cc');
  });

  it('ranks home loan last (highest balance)', () => {
    const ranked = rankLoansSnowball(loans);
    expect(ranked[ranked.length - 1]?.loan.id).toBe('h');
  });

  it('returns all loans', () => {
    expect(rankLoansSnowball(loans)).toHaveLength(4);
  });
});

describe('rankLoansHybrid', () => {
  it('returns all loans', () => {
    expect(rankLoansHybrid(loans)).toHaveLength(4);
  });

  it('credit card ranked first (high rate, no tax benefit)', () => {
    const ranked = rankLoansHybrid(loans);
    expect(ranked[0]?.loan.id).toBe('cc');
  });

  it('home loan effective rate is lower than nominal due to tax benefit', () => {
    const ranked = rankLoansHybrid(loans);
    const homeEntry = ranked.find((r) => r.loan.id === 'h');
    expect(homeEntry?.effectiveRatePct).toBeLessThan(homeLoan.annual_interest_rate_pct);
  });

  it('education loan also has reduced effective rate', () => {
    const ranked = rankLoansHybrid(loans);
    const eduEntry = ranked.find((r) => r.loan.id === 'e');
    expect(eduEntry?.effectiveRatePct).toBeLessThan(eduLoan.annual_interest_rate_pct);
  });
});

describe('rankLoans', () => {
  it('delegates to avalanche when strategy is avalanche', () => {
    const a = rankLoans(loans, 'avalanche');
    const b = rankLoansAvalanche(loans);
    expect(a.map((r) => r.loan.id)).toEqual(b.map((r) => r.loan.id));
  });

  it('delegates to snowball', () => {
    const a = rankLoans(loans, 'snowball');
    const b = rankLoansSnowball(loans);
    expect(a.map((r) => r.loan.id)).toEqual(b.map((r) => r.loan.id));
  });

  it('delegates to hybrid', () => {
    const a = rankLoans(loans, 'hybrid');
    const b = rankLoansHybrid(loans);
    expect(a.map((r) => r.loan.id)).toEqual(b.map((r) => r.loan.id));
  });
});

describe('simulatePrepayment', () => {
  const loan = makeLoan('t', 'personal_loan', 1_000_000, 12, 22_244, 60);

  it('saves months and interest with a lumpsum prepayment', () => {
    const result = simulatePrepayment(loan, 200_000);
    expect(result.monthsSaved).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
  });

  it('newTenureMonths < original tenure', () => {
    const result = simulatePrepayment(loan, 200_000);
    expect(result.newTenureMonths).toBeLessThan(loan.tenure_remaining_months);
  });

  it('full prepayment saves entire tenure', () => {
    const result = simulatePrepayment(loan, 1_000_000);
    expect(result.monthsSaved).toBe(loan.tenure_remaining_months);
    expect(result.newTenureMonths).toBe(0);
  });

  it('zero prepayment saves nothing', () => {
    const result = simulatePrepayment(loan, 0);
    expect(result.monthsSaved).toBe(0);
    expect(result.interestSaved).toBe(0);
  });

  it('originalTotalInterest is positive', () => {
    const result = simulatePrepayment(loan, 100_000);
    expect(result.originalTotalInterest).toBeGreaterThan(0);
  });

  it('handles arg <= 0 case when EMI cannot cover interest on remaining balance', () => {
    // outstanding = 600_000, rate = 24% (r = 0.02), EMI = 9_000
    // After 100_000 prepayment: newP = 500_000, newP * r = 10_000 > 9_000 → arg = 1 - 10k/9k < 0
    const underfundedLoan = makeLoan('u', 'personal_loan', 600_000, 24, 9_000, 60);
    const result = simulatePrepayment(underfundedLoan, 100_000);
    // When arg <= 0, newN = original n = 60, so monthsSaved = 0
    expect(result.newTenureMonths).toBe(60);
    expect(result.monthsSaved).toBe(0);
  });
});

describe('investVsPrepay', () => {
  const highRateLoan = makeLoan('hr', 'credit_card', 100_000, 36, 5_000, 24);
  const lowRateLoan = makeLoan('lr', 'home_loan', 5_000_000, 8.5, 43_391, 180);

  it('recommends PREPAY when loan rate > expected return', () => {
    const result = investVsPrepay(highRateLoan, 12);
    expect(result.decision).toBe('PREPAY');
  });

  it('recommends INVEST when expected return >> loan effective cost', () => {
    // home loan effective cost: 8.5 × 0.7 = 5.95%; expected return 12%
    const result = investVsPrepay(lowRateLoan, 12);
    expect(result.decision).toBe('INVEST');
  });

  it('recommends SPLIT when rates are close', () => {
    // Loan at 10%, return at 10% → diff = 0, should be SPLIT
    const midLoan = makeLoan('m', 'personal_loan', 500_000, 10, 10_000, 60);
    const result = investVsPrepay(midLoan, 10);
    expect(result.decision).toBe('SPLIT');
  });

  it('includes explanation text', () => {
    const result = investVsPrepay(highRateLoan, 12);
    expect(result.explanation.length).toBeGreaterThan(10);
  });

  it('returns effectiveLoanCostPct and expectedReturnPct', () => {
    const result = investVsPrepay(lowRateLoan, 12);
    expect(result.effectiveLoanCostPct).toBeLessThan(lowRateLoan.annual_interest_rate_pct);
    expect(result.expectedReturnPct).toBe(12);
  });
});
