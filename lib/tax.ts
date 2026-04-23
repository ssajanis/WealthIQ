/**
 * Indian income tax calculation for FY 2025-26.
 * Old and New regime. See PRD Section 6.6.
 * Tax slabs must be reviewed each Union Budget.
 */

export interface OldRegimeDeductions {
  /** Section 80C investments (PPF, ELSS, EPF, LIC, etc.) — max ₹1,50,000 */
  section80C: number;
  /** Section 80D health insurance premiums — max ₹25,000 (non-senior) */
  section80D: number;
  /** Section 24(b) home loan interest — max ₹2,00,000 for self-occupied */
  homeLoanInterest24b: number;
  /** Additional NPS contribution u/s 80CCD(1B) — max ₹50,000 */
  npsAdditional80CCD: number;
  /** HRA exemption — user-calculated or 0 */
  hra: number;
}

export interface TaxResult {
  grossIncome: number;
  taxableIncome: number;
  baseTax: number;
  cess: number;
  totalTax: number;
  effectiveRatePct: number;
  takeHomeAnnual: number;
}

interface Slab {
  upto: number;
  rate: number;
}

function applySlabs(income: number, slabs: readonly Slab[]): number {
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, slab.upto) - prev;
    tax += taxable * slab.rate;
    prev = slab.upto;
  }
  return tax;
}

/** FY 2025-26 New Regime slabs (revised). Standard deduction ₹75,000. */
const NEW_REGIME_SLABS: readonly Slab[] = [
  { upto: 300_000, rate: 0 },
  { upto: 700_000, rate: 0.05 },
  { upto: 1_000_000, rate: 0.1 },
  { upto: 1_200_000, rate: 0.15 },
  { upto: 1_500_000, rate: 0.2 },
  { upto: Infinity, rate: 0.3 },
];

/** FY 2025-26 Old Regime slabs. Standard deduction ₹50,000. */
const OLD_REGIME_SLABS: readonly Slab[] = [
  { upto: 250_000, rate: 0 },
  { upto: 500_000, rate: 0.05 },
  { upto: 1_000_000, rate: 0.2 },
  { upto: Infinity, rate: 0.3 },
];

/** New regime tax. No deductions except ₹75,000 standard. Rebate u/s 87A if taxable ≤ ₹7L. */
export function computeNewRegimeTax(grossIncomePa: number): TaxResult {
  const standardDeduction = 75_000;
  const taxableIncome = Math.max(0, grossIncomePa - standardDeduction);
  let baseTax = applySlabs(taxableIncome, NEW_REGIME_SLABS);
  // Rebate u/s 87A: full rebate if taxable income ≤ ₹7L
  if (taxableIncome <= 700_000) baseTax = 0;
  const cess = Math.round(baseTax * 0.04);
  const totalTax = baseTax + cess;
  return {
    grossIncome: grossIncomePa,
    taxableIncome,
    baseTax,
    cess,
    totalTax,
    effectiveRatePct: grossIncomePa > 0 ? (totalTax / grossIncomePa) * 100 : 0,
    takeHomeAnnual: grossIncomePa - totalTax,
  };
}

/** Old regime tax with standard deduction + itemised deductions. Rebate u/s 87A if taxable ≤ ₹5L. */
export function computeOldRegimeTax(
  grossIncomePa: number,
  deductions: Partial<OldRegimeDeductions> = {},
): TaxResult {
  const standardDeduction = 50_000;
  const section80C = Math.min(deductions.section80C ?? 0, 150_000);
  const section80D = Math.min(deductions.section80D ?? 0, 25_000);
  const homeLoanInterest = Math.min(deductions.homeLoanInterest24b ?? 0, 200_000);
  const npsAdditional = Math.min(deductions.npsAdditional80CCD ?? 0, 50_000);
  const hra = Math.max(0, deductions.hra ?? 0);

  const totalDeductions =
    standardDeduction + section80C + section80D + homeLoanInterest + npsAdditional + hra;
  const taxableIncome = Math.max(0, grossIncomePa - totalDeductions);
  let baseTax = applySlabs(taxableIncome, OLD_REGIME_SLABS);
  // Rebate u/s 87A: up to ₹12,500 rebate if taxable ≤ ₹5L
  if (taxableIncome <= 500_000) baseTax = Math.max(0, baseTax - 12_500);
  const cess = Math.round(baseTax * 0.04);
  const totalTax = baseTax + cess;
  return {
    grossIncome: grossIncomePa,
    taxableIncome,
    baseTax,
    cess,
    totalTax,
    effectiveRatePct: grossIncomePa > 0 ? (totalTax / grossIncomePa) * 100 : 0,
    takeHomeAnnual: grossIncomePa - totalTax,
  };
}

/** Compare both regimes and return the recommended one. */
export function bestRegime(
  grossIncomePa: number,
  oldDeductions: Partial<OldRegimeDeductions> = {},
): 'new' | 'old' {
  const newTax = computeNewRegimeTax(grossIncomePa).totalTax;
  const oldTax = computeOldRegimeTax(grossIncomePa, oldDeductions).totalTax;
  return newTax <= oldTax ? 'new' : 'old';
}
