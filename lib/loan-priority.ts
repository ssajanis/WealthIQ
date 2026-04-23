/**
 * Loan prioritisation engine and prepayment / invest-vs-prepay advisor.
 * See PRD Sections 2.8 and 2.9.
 */

import type { Loan } from '@/types';

export type PriorityStrategy = 'avalanche' | 'snowball' | 'hybrid';

export interface RankedLoan {
  loan: Loan;
  rank: number;
  effectiveRatePct: number;
  totalInterestRemaining: number;
  explanation: string;
}

/** Tax benefit percentage per loan type (hybrid strategy). */
function taxBenefitPct(loanType: Loan['loan_type']): number {
  // Home loan: Sec 24(b) + 80C principal benefit — effective ~30% for top bracket
  if (loanType === 'home_loan') return 30;
  // Education loan: 80E full deduction on interest
  if (loanType === 'education_loan') return 30;
  return 0;
}

function totalInterestRemaining(loan: Loan): number {
  const r = loan.annual_interest_rate_pct / 100 / 12;
  if (r === 0) return 0;
  return Math.max(0, loan.emi_inr * loan.tenure_remaining_months - loan.outstanding_inr);
}

/** Avalanche: rank by interest rate descending (mathematically optimal). PRD Section 2.8. */
export function rankLoansAvalanche(loans: Loan[]): RankedLoan[] {
  return [...loans]
    .sort((a, b) => b.annual_interest_rate_pct - a.annual_interest_rate_pct)
    .map((loan, i) => ({
      loan,
      rank: i + 1,
      effectiveRatePct: loan.annual_interest_rate_pct,
      totalInterestRemaining: totalInterestRemaining(loan),
      explanation: `${loan.annual_interest_rate_pct}% p.a. — paying this off saves the most interest overall.`,
    }));
}

/** Snowball: rank by outstanding balance ascending (psychologically motivating). PRD Section 2.8. */
export function rankLoansSnowball(loans: Loan[]): RankedLoan[] {
  return [...loans]
    .sort((a, b) => a.outstanding_inr - b.outstanding_inr)
    .map((loan, i) => ({
      loan,
      rank: i + 1,
      effectiveRatePct: loan.annual_interest_rate_pct,
      totalInterestRemaining: totalInterestRemaining(loan),
      explanation: `₹${(loan.outstanding_inr / 100_000).toFixed(1)} L outstanding — close this quickly for a motivating win.`,
    }));
}

/**
 * Hybrid: rank by effective after-tax cost descending.
 * Effective cost = rate × (1 − tax benefit %). PRD Section 2.8.
 */
export function rankLoansHybrid(loans: Loan[]): RankedLoan[] {
  return [...loans]
    .map((loan) => {
      const benefit = taxBenefitPct(loan.loan_type);
      const effective = loan.annual_interest_rate_pct * (1 - benefit / 100);
      return { loan, effective, benefit };
    })
    .sort((a, b) => b.effective - a.effective)
    .map(({ loan, effective, benefit }, i) => {
      const benefitNote =
        benefit > 0 ? ` (effective ${effective.toFixed(1)}% after ${benefit}% tax benefit)` : '';
      return {
        loan,
        rank: i + 1,
        effectiveRatePct: effective,
        totalInterestRemaining: totalInterestRemaining(loan),
        explanation: `${loan.annual_interest_rate_pct}% p.a.${benefitNote} — ranked by real cost to you.`,
      };
    });
}

export function rankLoans(loans: Loan[], strategy: PriorityStrategy): RankedLoan[] {
  if (strategy === 'avalanche') return rankLoansAvalanche(loans);
  if (strategy === 'snowball') return rankLoansSnowball(loans);
  return rankLoansHybrid(loans);
}

export interface PrepaymentResult {
  /** Months saved vs original schedule */
  monthsSaved: number;
  /** Interest saved (INR) */
  interestSaved: number;
  /** New tenure in months */
  newTenureMonths: number;
  /** Original total interest */
  originalTotalInterest: number;
  /** New total interest after prepayment */
  newTotalInterest: number;
}

/**
 * Prepayment simulator: how much does a lumpsum prepayment save?
 * Keeps EMI constant, reduces tenure. PRD Section 2.6.4.
 */
export function simulatePrepayment(loan: Loan, lumpsum: number): PrepaymentResult {
  const r = loan.annual_interest_rate_pct / 100 / 12;
  const n = loan.tenure_remaining_months;
  const emi = loan.emi_inr;
  const p = loan.outstanding_inr;
  const newP = Math.max(0, p - lumpsum);

  const originalTotalInterest = Math.max(0, emi * n - p);

  if (newP === 0) {
    return {
      monthsSaved: n,
      interestSaved: originalTotalInterest,
      newTenureMonths: 0,
      originalTotalInterest,
      newTotalInterest: 0,
    };
  }

  let newN: number;
  if (r === 0) {
    newN = Math.ceil(newP / emi);
  } else {
    // n' = -ln(1 - newP * r / EMI) / ln(1 + r)
    const arg = 1 - (newP * r) / emi;
    newN = arg <= 0 ? n : Math.ceil(-Math.log(arg) / Math.log(1 + r));
  }

  const newTotalInterest = Math.max(0, emi * newN - newP);
  const interestSaved = originalTotalInterest - newTotalInterest;
  const monthsSaved = n - newN;

  return {
    monthsSaved: Math.max(0, monthsSaved),
    interestSaved: Math.max(0, interestSaved),
    newTenureMonths: newN,
    originalTotalInterest,
    newTotalInterest,
  };
}

export type InvestVsPrepayDecision = 'PREPAY' | 'INVEST' | 'SPLIT';

export interface InvestVsPrepayResult {
  decision: InvestVsPrepayDecision;
  effectiveLoanCostPct: number;
  expectedReturnPct: number;
  explanation: string;
}

/**
 * Compare after-tax loan cost vs expected investment return. PRD Section 2.9.
 * PREPAY if effectiveCost > expectedReturn.
 * INVEST if effectiveCost < expectedReturn − 2%.
 * SPLIT otherwise.
 */
export function investVsPrepay(loan: Loan, expectedReturnPct: number): InvestVsPrepayResult {
  const benefit = taxBenefitPct(loan.loan_type);
  const effectiveCost = loan.annual_interest_rate_pct * (1 - benefit / 100);
  const diff = effectiveCost - expectedReturnPct;

  let decision: InvestVsPrepayDecision;
  let explanation: string;

  if (diff > 0) {
    decision = 'PREPAY';
    explanation = `Loan effective cost (${effectiveCost.toFixed(1)}%) exceeds expected return (${expectedReturnPct}%). Prepaying saves more than investing.`;
  } else if (diff < -2) {
    decision = 'INVEST';
    explanation = `Expected return (${expectedReturnPct}%) beats loan effective cost (${effectiveCost.toFixed(1)}%) by more than 2%. Investing earns more.`;
  } else {
    decision = 'SPLIT';
    explanation = `Loan effective cost (${effectiveCost.toFixed(1)}%) and expected return (${expectedReturnPct}%) are close. Split between prepayment and investment.`;
  }

  return { decision, effectiveLoanCostPct: effectiveCost, expectedReturnPct, explanation };
}
