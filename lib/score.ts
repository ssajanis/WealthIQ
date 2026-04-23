/**
 * Financial Health Score engine — 8 weighted dimensions, 0–100 total.
 * Weights and scoring functions from PRD Sections 2.7 and 6.7.
 */

import type { Income, Expense, Investment, Loan, Goal, Insurance, Snapshot } from '@/types';

// ─── Instrument → asset class mapping ──────────────────────────────────────
const EQUITY_INSTRUMENTS = new Set(['mutual_fund_equity', 'mutual_fund_hybrid', 'stocks'] as const);

const DEBT_INSTRUMENTS = new Set(['mutual_fund_debt', 'fd', 'rd', 'epf'] as const);

const GOLD_INSTRUMENTS = new Set(['gold'] as const);
const REAL_ESTATE_INSTRUMENTS = new Set(['real_estate'] as const);

// PPF, NPS, other → "other" bucket for diversification purposes

export interface ScoreInputs {
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  loans: Loan[];
  goals: Goal[];
  insurance: Insurance[];
  priorSnapshot?: Snapshot | null;
}

export interface DimensionScore {
  label: string;
  weight: number;
  rawScore: number; // 0–100 for this dimension
  weightedScore: number;
}

export interface HealthScoreResult {
  total: number; // 0–100 rounded to 1 decimal
  band: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  dimensions: DimensionScore[];
  /** Key metrics used in computation, surfaced for dashboard display. */
  metrics: {
    annualIncomeInr: number;
    annualExpensesInr: number;
    monthlyExpensesInr: number;
    totalEmisMonthly: number;
    monthlyIncome: number;
    savingsRatePct: number;
    liquidSavingsMonths: number;
    dtiRatioPct: number;
    netWorthInr: number;
    totalInvestmentsInr: number;
    totalLiabilitiesInr: number;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Savings Rate: linear 0–100 between 0% and 30%. PRD Section 6.7. */
function scoreSavingsRate(savingsRatePct: number): number {
  return clamp((savingsRatePct / 30) * 100, 0, 100);
}

/**
 * Emergency Fund: piecewise linear.
 * 0 → 0, 6 months → 50, 12+ months → 100. PRD Section 6.7.
 */
function scoreEmergencyFund(liquidMonths: number): number {
  if (liquidMonths >= 12) return 100;
  if (liquidMonths >= 6) return 50 + ((liquidMonths - 6) / 6) * 50;
  return (liquidMonths / 6) * 50;
}

/** Debt-to-Income: inverse linear. 100 at ≤15%, 0 at ≥50%. PRD Section 6.7. */
function scoreDebtToIncome(dtiPct: number): number {
  if (dtiPct <= 15) return 100;
  if (dtiPct >= 50) return 0;
  return ((50 - dtiPct) / 35) * 100;
}

/**
 * Insurance Adequacy: Term 60 pts + Health 40 pts. PRD Section 6.7.
 * Term: prorated up to 10× annual income.
 * Health: prorated up to ₹10 L floor.
 */
function scoreInsurance(insurance: Insurance[], annualIncomeInr: number): number {
  const termAssured = insurance
    .filter((p) => p.policy_type === 'term_life')
    .reduce((s, p) => s + p.sum_assured_inr, 0);
  const healthAssured = insurance
    .filter((p) => p.policy_type === 'health')
    .reduce((s, p) => s + p.sum_assured_inr, 0);

  const termTarget = annualIncomeInr * 10;
  const healthTarget = 1_000_000; // ₹10 L minimum floor

  const termScore = termTarget > 0 ? clamp((termAssured / termTarget) * 60, 0, 60) : 0;
  const healthScore = clamp((healthAssured / healthTarget) * 40, 0, 40);
  return termScore + healthScore;
}

/**
 * Investment Diversification: 100 × (1 − Herfindahl Index).
 * Asset classes: equity, debt, gold, real_estate, other. PRD Section 6.7.
 */
function scoreDiversification(investments: Investment[]): number {
  const buckets = { equity: 0, debt: 0, gold: 0, real_estate: 0, other: 0 };
  let total = 0;
  for (const inv of investments) {
    const v = inv.current_value_inr;
    if (EQUITY_INSTRUMENTS.has(inv.instrument as never)) buckets.equity += v;
    else if (DEBT_INSTRUMENTS.has(inv.instrument as never)) buckets.debt += v;
    else if (GOLD_INSTRUMENTS.has(inv.instrument as never)) buckets.gold += v;
    else if (REAL_ESTATE_INSTRUMENTS.has(inv.instrument as never)) buckets.real_estate += v;
    else buckets.other += v;
    total += v;
  }
  if (total === 0) return 0;
  const hhi = Object.values(buckets).reduce((s, v) => s + (v / total) ** 2, 0);
  return clamp((1 - hhi) * 100, 0, 100);
}

/**
 * Net Worth Growth: 100 if ≥15% YoY, 0 if ≤−10% YoY, linear in between.
 * If no prior snapshot, return 50 (neutral). PRD Section 6.7.
 */
function scoreNetWorthGrowth(currentNW: number, priorSnapshot?: Snapshot | null): number {
  if (!priorSnapshot || priorSnapshot.net_worth_inr === 0) return 50;
  const growthPct = ((currentNW - priorSnapshot.net_worth_inr) / priorSnapshot.net_worth_inr) * 100;
  if (growthPct >= 15) return 100;
  if (growthPct <= -10) return 0;
  return ((growthPct + 10) / 25) * 100;
}

/** Goal Progress: weighted average completion across active goals. PRD Section 6.7. */
function scoreGoalProgress(goals: Goal[]): number {
  if (goals.length === 0) return 50; // neutral if no goals set
  const total = goals.reduce((s, g) => {
    const completion =
      g.target_amount_inr > 0 ? clamp(g.current_savings_inr / g.target_amount_inr, 0, 1) : 0;
    return s + completion;
  }, 0);
  return (total / goals.length) * 100;
}

/**
 * Tax Efficiency: utilisation of 80C, 80D, NPS vs their ceilings.
 * Uses investments + insurance as proxies. PRD Section 6.7.
 */
function scoreTaxEfficiency(investments: Investment[], insurance: Insurance[]): number {
  // 80C proxy: PPF + ELSS (equity MF SIPs) annual contributions
  const section80C = investments
    .filter(
      (i) =>
        i.instrument === 'ppf' ||
        (i.instrument === 'mutual_fund_equity' && i.investment_type === 'sip'),
    )
    .reduce((s, i) => s + (i.monthly_amount_inr ?? 0) * 12, 0);

  // NPS proxy: NPS annual contributions
  const nps = investments
    .filter((i) => i.instrument === 'nps')
    .reduce((s, i) => s + (i.monthly_amount_inr ?? 0) * 12, 0);

  // 80D proxy: health insurance annual premiums
  const section80D = insurance
    .filter((p) => p.policy_type === 'health')
    .reduce((s, p) => s + p.annual_premium_inr, 0);

  const util80C = clamp(section80C / 150_000, 0, 1);
  const utilNPS = clamp(nps / 50_000, 0, 1);
  const util80D = clamp(section80D / 25_000, 0, 1);

  return ((util80C + utilNPS + util80D) / 3) * 100;
}

export function computeFinancialHealthScore(inputs: ScoreInputs): HealthScoreResult {
  const { incomes, expenses, investments, loans, goals, insurance, priorSnapshot } = inputs;

  // ── Key metrics ──────────────────────────────────────────────────────────
  const annualIncomeInr = incomes.reduce((s, i) => s + i.gross_annual_inr, 0);
  const monthlyIncome = annualIncomeInr / 12;
  const annualExpensesInr = expenses.reduce((s, e) => s + e.monthly_amount_inr * 12, 0);
  const monthlyExpensesInr = annualExpensesInr / 12;
  const totalEmisMonthly = loans.reduce((s, l) => s + l.emi_inr, 0);
  const totalMonthlySips = investments.reduce((s, i) => s + (i.monthly_amount_inr ?? 0), 0);

  const annualSavings =
    annualIncomeInr - annualExpensesInr - totalEmisMonthly * 12 - totalMonthlySips * 12;
  const savingsRatePct = annualIncomeInr > 0 ? (annualSavings / annualIncomeInr) * 100 : 0;

  // Liquid savings = EPF + FD + RD + PPF current values (safe/accessible instruments)
  const liquidSavingsInr = investments
    .filter((i) => ['epf', 'fd', 'rd', 'ppf'].includes(i.instrument))
    .reduce((s, i) => s + i.current_value_inr, 0);
  const liquidSavingsMonths = monthlyExpensesInr > 0 ? liquidSavingsInr / monthlyExpensesInr : 0;

  const dtiRatioPct = monthlyIncome > 0 ? (totalEmisMonthly / monthlyIncome) * 100 : 0;

  const totalInvestmentsInr = investments.reduce((s, i) => s + i.current_value_inr, 0);
  const totalLiabilitiesInr = loans.reduce((s, l) => s + l.outstanding_inr, 0);
  const netWorthInr = totalInvestmentsInr - totalLiabilitiesInr;

  // ── Dimension raw scores ─────────────────────────────────────────────────
  const rawScores = {
    savingsRate: scoreSavingsRate(savingsRatePct),
    emergencyFund: scoreEmergencyFund(liquidSavingsMonths),
    debtToIncome: scoreDebtToIncome(dtiRatioPct),
    insurance: scoreInsurance(insurance, annualIncomeInr),
    diversification: scoreDiversification(investments),
    netWorthGrowth: scoreNetWorthGrowth(netWorthInr, priorSnapshot),
    goalProgress: scoreGoalProgress(goals),
    taxEfficiency: scoreTaxEfficiency(investments, insurance),
  };

  // ── Weighted dimensions (PRD Section 2.7) ───────────────────────────────
  const dimensions: DimensionScore[] = [
    {
      label: 'Savings Rate',
      weight: 0.2,
      rawScore: rawScores.savingsRate,
      weightedScore: rawScores.savingsRate * 0.2,
    },
    {
      label: 'Emergency Fund',
      weight: 0.15,
      rawScore: rawScores.emergencyFund,
      weightedScore: rawScores.emergencyFund * 0.15,
    },
    {
      label: 'Debt-to-Income',
      weight: 0.15,
      rawScore: rawScores.debtToIncome,
      weightedScore: rawScores.debtToIncome * 0.15,
    },
    {
      label: 'Insurance Adequacy',
      weight: 0.1,
      rawScore: rawScores.insurance,
      weightedScore: rawScores.insurance * 0.1,
    },
    {
      label: 'Diversification',
      weight: 0.15,
      rawScore: rawScores.diversification,
      weightedScore: rawScores.diversification * 0.15,
    },
    {
      label: 'Net Worth Growth',
      weight: 0.1,
      rawScore: rawScores.netWorthGrowth,
      weightedScore: rawScores.netWorthGrowth * 0.1,
    },
    {
      label: 'Goal Progress',
      weight: 0.1,
      rawScore: rawScores.goalProgress,
      weightedScore: rawScores.goalProgress * 0.1,
    },
    {
      label: 'Tax Efficiency',
      weight: 0.05,
      rawScore: rawScores.taxEfficiency,
      weightedScore: rawScores.taxEfficiency * 0.05,
    },
  ];

  const total = Math.round(dimensions.reduce((s, d) => s + d.weightedScore, 0) * 10) / 10;
  const band: HealthScoreResult['band'] =
    total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Fair' : 'Poor';

  return {
    total,
    band,
    dimensions,
    metrics: {
      annualIncomeInr,
      annualExpensesInr,
      monthlyExpensesInr,
      totalEmisMonthly,
      monthlyIncome,
      savingsRatePct,
      liquidSavingsMonths,
      dtiRatioPct,
      netWorthInr,
      totalInvestmentsInr,
      totalLiabilitiesInr,
    },
  };
}
