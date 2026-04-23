/**
 * Pure financial calculation functions.
 * All formulas referenced from WealthIQ_India_PRD_TDD.md Section 6.
 */

/** SIP future value. See PRD Section 6.1. */
export function sipFutureValue(
  monthlyAmount: number,
  annualReturnPct: number,
  months: number,
): number {
  if (months <= 0 || monthlyAmount <= 0) return 0;
  const r = annualReturnPct / 100 / 12;
  if (r === 0) return monthlyAmount * months;
  return monthlyAmount * (((1 + r) ** months - 1) / r) * (1 + r);
}

/** Inflation-adjusted (real) value. See PRD Section 6.1. */
export function inflationAdjusted(
  nominalValue: number,
  annualInflationPct: number,
  years: number,
): number {
  if (years <= 0) return nominalValue;
  return nominalValue / (1 + annualInflationPct / 100) ** years;
}

/** Lumpsum future value. See PRD Section 6.2. */
export function lumpsumFutureValue(
  presentValue: number,
  annualReturnPct: number,
  years: number,
): number {
  if (years <= 0) return presentValue;
  return presentValue * (1 + annualReturnPct / 100) ** years;
}

/**
 * Step-up SIP future value. See PRD Section 6.3.
 * Computes 12 months at each SIP level, then steps up by stepUpPct annually.
 */
export function stepUpSipFutureValue(
  monthlyAmount: number,
  annualReturnPct: number,
  years: number,
  stepUpPct: number,
): number {
  if (years <= 0 || monthlyAmount <= 0) return 0;
  const r = annualReturnPct / 100 / 12;
  let corpus = 0;
  let sip = monthlyAmount;
  for (let year = 0; year < years; year++) {
    for (let month = 0; month < 12; month++) {
      corpus = r === 0 ? corpus + sip : (corpus + sip) * (1 + r);
    }
    sip = sip * (1 + stepUpPct / 100);
  }
  return corpus;
}

/** Required monthly SIP to reach a target corpus. See PRD Section 6.4. */
export function requiredMonthlySip(
  targetFV: number,
  annualReturnPct: number,
  months: number,
): number {
  if (months <= 0 || targetFV <= 0) return 0;
  const r = annualReturnPct / 100 / 12;
  if (r === 0) return targetFV / months;
  return targetFV / ((((1 + r) ** months - 1) / r) * (1 + r));
}

/** Monthly EMI for a loan. See PRD Section 6.5. */
export function loanEmi(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);
}

/** Total interest payable over the full loan tenure. */
export function totalLoanInterest(
  principal: number,
  annualRatePct: number,
  months: number,
): number {
  const emi = loanEmi(principal, annualRatePct, months);
  return Math.max(0, emi * months - principal);
}

/**
 * Year-by-year SIP growth table for charting.
 * Returns one row per year with cumulative invested amount and corpus value.
 */
export function sipGrowthTable(
  monthlyAmount: number,
  annualReturnPct: number,
  years: number,
): Array<{ year: number; invested: number; corpus: number }> {
  const rows: Array<{ year: number; invested: number; corpus: number }> = [];
  const r = annualReturnPct / 100 / 12;
  let corpus = 0;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      corpus = r === 0 ? corpus + monthlyAmount : (corpus + monthlyAmount) * (1 + r);
    }
    rows.push({ year: y, invested: monthlyAmount * 12 * y, corpus: Math.round(corpus) });
  }
  return rows;
}

/**
 * Months remaining to reach a target given current savings, monthly SIP, and return.
 * Returns Infinity if target is unreachable with given inputs.
 */
export function monthsToGoal(
  targetAmount: number,
  currentSavings: number,
  monthlySip: number,
  annualReturnPct: number,
): number {
  if (currentSavings >= targetAmount) return 0;
  if (monthlySip <= 0 && annualReturnPct <= 0) return Infinity;
  // Binary search for n where sipFV(monthlySip, annualReturnPct, n) + lumpsumFV(currentSavings, annualReturnPct, n) >= target
  let lo = 1;
  let hi = 600; // 50 years max
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const fv =
      sipFutureValue(monthlySip, annualReturnPct, mid) +
      lumpsumFutureValue(currentSavings, annualReturnPct, mid / 12);
    if (fv >= targetAmount) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  const check =
    sipFutureValue(monthlySip, annualReturnPct, lo) +
    lumpsumFutureValue(currentSavings, annualReturnPct, lo / 12);
  return check >= targetAmount ? lo : Infinity;
}
