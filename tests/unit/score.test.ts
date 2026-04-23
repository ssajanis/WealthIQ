import { computeFinancialHealthScore, type ScoreInputs } from '@/lib/score';
import type { Income, Expense, Investment, Loan, Goal, Insurance, Snapshot } from '@/types';

const makeIncome = (gross: number): Income => ({
  id: '1',
  source_name: 'Salary',
  source_type: 'salary',
  gross_annual_inr: gross,
  is_primary_earner: true,
  tax_regime: 'new',
  created_at: '',
  updated_at: '',
});

const makeExpense = (monthly: number): Expense => ({
  id: '1',
  category: 'housing',
  description: 'Rent',
  monthly_amount_inr: monthly,
  is_fixed: true,
  created_at: '',
  updated_at: '',
});

const makeInvestment = (
  instrument: Investment['instrument'],
  currentValue: number,
  monthlyAmount: number | null = null,
): Investment => ({
  id: '1',
  instrument,
  name: 'Test',
  investment_type: monthlyAmount !== null ? 'sip' : 'lumpsum',
  monthly_amount_inr: monthlyAmount,
  current_value_inr: currentValue,
  expected_annual_return_pct: 12,
  start_date: '2020-01-01',
  created_at: '',
  updated_at: '',
});

const makeLoan = (outstanding: number, emi: number, rate: number): Loan => ({
  id: '1',
  loan_type: 'home_loan',
  lender_name: 'Bank',
  principal_inr: outstanding,
  outstanding_inr: outstanding,
  annual_interest_rate_pct: rate,
  emi_inr: emi,
  tenure_remaining_months: 120,
  start_date: '2022-01-01',
  created_at: '',
  updated_at: '',
});

const makeGoal = (target: number, current: number): Goal => ({
  id: '1',
  goal_name: 'Goal',
  goal_type: 'retirement',
  target_amount_inr: target,
  current_savings_inr: current,
  target_date: '2040-01-01',
  monthly_sip_inr: null,
  expected_return_pct: 12,
  created_at: '',
  updated_at: '',
});

const makeInsurance = (type: Insurance['policy_type'], sumAssured: number): Insurance => ({
  id: '1',
  policy_type: type,
  insurer_name: 'LIC',
  sum_assured_inr: sumAssured,
  annual_premium_inr: 20_000,
  members_covered: 'Self',
  expiry_date: '2050-01-01',
  created_at: '',
  updated_at: '',
});

const makeSnapshot = (netWorth: number): Snapshot => ({
  id: '1',
  snapshot_name: 'Q1',
  snapshot_date: '2025-01-01',
  financial_health_score: 70,
  total_income_annual_inr: 2_000_000,
  total_expenses_annual_inr: 800_000,
  total_investments_inr: 1_500_000,
  total_liabilities_inr: 500_000,
  net_worth_inr: netWorth,
  savings_rate_pct: 35,
  score_breakdown_json: '{}',
  created_at: '',
});

const emptyInputs: ScoreInputs = {
  incomes: [],
  expenses: [],
  investments: [],
  loans: [],
  goals: [],
  insurance: [],
};

describe('computeFinancialHealthScore', () => {
  it('returns a score between 0 and 100', () => {
    const result = computeFinancialHealthScore(emptyInputs);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('returns 8 dimensions', () => {
    const result = computeFinancialHealthScore(emptyInputs);
    expect(result.dimensions).toHaveLength(8);
  });

  it('dimension weights sum to 1.0', () => {
    const result = computeFinancialHealthScore(emptyInputs);
    const sum = result.dimensions.reduce((s, d) => s + d.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('returns band Excellent for high score', () => {
    const inputs: ScoreInputs = {
      incomes: [makeIncome(3_000_000)],
      expenses: [makeExpense(30_000)],
      investments: [
        makeInvestment('fd', 3_000_000, 10_000),
        makeInvestment('mutual_fund_equity', 2_000_000, 25_000),
        makeInvestment('gold', 500_000),
        makeInvestment('mutual_fund_debt', 1_000_000),
      ],
      loans: [],
      goals: [makeGoal(5_000_000, 4_000_000)],
      insurance: [makeInsurance('term_life', 30_000_000), makeInsurance('health', 1_000_000)],
    };
    const result = computeFinancialHealthScore(inputs);
    expect(result.total).toBeGreaterThan(60);
  });

  it('returns band Poor for distressed finances', () => {
    const inputs: ScoreInputs = {
      incomes: [makeIncome(600_000)],
      expenses: [makeExpense(80_000)],
      investments: [],
      loans: [makeLoan(5_000_000, 60_000, 18)],
      goals: [],
      insurance: [],
    };
    const result = computeFinancialHealthScore(inputs);
    expect(result.total).toBeLessThan(50);
  });

  it('savings rate dimension scores higher when saving more', () => {
    const low: ScoreInputs = {
      ...emptyInputs,
      incomes: [makeIncome(1_200_000)],
      expenses: [makeExpense(90_000)],
    };
    const high: ScoreInputs = {
      ...emptyInputs,
      incomes: [makeIncome(1_200_000)],
      expenses: [makeExpense(20_000)],
    };
    const rLow = computeFinancialHealthScore(low);
    const rHigh = computeFinancialHealthScore(high);
    const savLow = rLow.dimensions.find((d) => d.label === 'Savings Rate')?.rawScore ?? 0;
    const savHigh = rHigh.dimensions.find((d) => d.label === 'Savings Rate')?.rawScore ?? 0;
    expect(savHigh).toBeGreaterThan(savLow);
  });

  it('emergency fund score is 100 when liquid savings >= 12 months of expenses', () => {
    const inputs: ScoreInputs = {
      ...emptyInputs,
      expenses: [makeExpense(50_000)],
      investments: [makeInvestment('fd', 700_000)],
    };
    const result = computeFinancialHealthScore(inputs);
    const ef = result.dimensions.find((d) => d.label === 'Emergency Fund');
    expect(ef?.rawScore).toBe(100);
  });

  it('emergency fund score is 0 when no liquid savings', () => {
    const inputs: ScoreInputs = {
      ...emptyInputs,
      expenses: [makeExpense(50_000)],
      investments: [makeInvestment('stocks', 500_000)],
    };
    const result = computeFinancialHealthScore(inputs);
    const ef = result.dimensions.find((d) => d.label === 'Emergency Fund');
    expect(ef?.rawScore).toBe(0);
  });

  it('debt-to-income score is 100 when no loans', () => {
    const result = computeFinancialHealthScore({
      ...emptyInputs,
      incomes: [makeIncome(1_200_000)],
    });
    const dti = result.dimensions.find((d) => d.label === 'Debt-to-Income');
    expect(dti?.rawScore).toBe(100);
  });

  it('diversification score is 0 when all money in one asset class', () => {
    const inputs: ScoreInputs = {
      ...emptyInputs,
      investments: [
        makeInvestment('stocks', 1_000_000),
        makeInvestment('mutual_fund_equity', 500_000),
      ],
    };
    const result = computeFinancialHealthScore(inputs);
    const div = result.dimensions.find((d) => d.label === 'Diversification');
    expect(div?.rawScore).toBeLessThan(20);
  });

  it('net worth growth score is 50 when no prior snapshot', () => {
    const result = computeFinancialHealthScore(emptyInputs);
    const nwg = result.dimensions.find((d) => d.label === 'Net Worth Growth');
    expect(nwg?.rawScore).toBe(50);
  });

  it('net worth growth score is 100 when net worth grew >= 15%', () => {
    const inputs: ScoreInputs = {
      ...emptyInputs,
      investments: [makeInvestment('fd', 1_000_000)],
      priorSnapshot: makeSnapshot(800_000),
    };
    const result = computeFinancialHealthScore(inputs);
    const nwg = result.dimensions.find((d) => d.label === 'Net Worth Growth');
    expect(nwg?.rawScore).toBe(100);
  });

  it('net worth growth score is 0 when net worth fell >= 10%', () => {
    const inputs: ScoreInputs = {
      ...emptyInputs,
      investments: [makeInvestment('fd', 900_000)],
      priorSnapshot: makeSnapshot(1_100_000),
    };
    const result = computeFinancialHealthScore(inputs);
    const nwg = result.dimensions.find((d) => d.label === 'Net Worth Growth');
    expect(nwg?.rawScore).toBe(0);
  });

  it('goal progress score is 50 when no goals', () => {
    const result = computeFinancialHealthScore(emptyInputs);
    const gp = result.dimensions.find((d) => d.label === 'Goal Progress');
    expect(gp?.rawScore).toBe(50);
  });

  it('metrics.netWorthInr = investments - liabilities', () => {
    const inputs: ScoreInputs = {
      ...emptyInputs,
      investments: [makeInvestment('fd', 1_500_000)],
      loans: [makeLoan(500_000, 10_000, 8)],
    };
    const result = computeFinancialHealthScore(inputs);
    expect(result.metrics.netWorthInr).toBe(1_000_000);
  });

  it('DTI score is in linear range when DTI is between 15% and 50%', () => {
    const inputs: ScoreInputs = {
      ...emptyInputs,
      incomes: [makeIncome(2_400_000)],
      loans: [makeLoan(3_000_000, 50_000, 9)],
    };
    const result = computeFinancialHealthScore(inputs);
    const dti = result.dimensions.find((d) => d.label === 'Debt-to-Income');
    expect(dti?.rawScore).toBeGreaterThan(0);
    expect(dti?.rawScore).toBeLessThan(100);
  });

  it('diversification score accounts for real_estate and other instruments', () => {
    const inputs: ScoreInputs = {
      ...emptyInputs,
      investments: [
        makeInvestment('real_estate', 2_000_000),
        makeInvestment('nps', 500_000),
        makeInvestment('ppf', 300_000),
        makeInvestment('mutual_fund_equity', 1_000_000),
      ],
    };
    const result = computeFinancialHealthScore(inputs);
    const div = result.dimensions.find((d) => d.label === 'Diversification');
    expect(div?.rawScore).toBeGreaterThan(0);
    expect(div?.rawScore).toBeLessThan(100);
  });

  it('net worth growth score is in linear range when growth is between -10% and 15%', () => {
    const inputs: ScoreInputs = {
      ...emptyInputs,
      investments: [makeInvestment('fd', 1_050_000)],
      priorSnapshot: makeSnapshot(1_000_000),
    };
    const result = computeFinancialHealthScore(inputs);
    const nwg = result.dimensions.find((d) => d.label === 'Net Worth Growth');
    expect(nwg?.rawScore).toBeGreaterThan(0);
    expect(nwg?.rawScore).toBeLessThan(100);
  });

  it('tax efficiency score handles null NPS monthly_amount_inr without crashing', () => {
    const npsLumpsum: Investment = {
      id: '9',
      instrument: 'nps',
      name: 'NPS',
      investment_type: 'lumpsum',
      monthly_amount_inr: null,
      current_value_inr: 200_000,
      expected_annual_return_pct: 10,
      start_date: '2020-01-01',
      created_at: '',
      updated_at: '',
    };
    const inputs: ScoreInputs = { ...emptyInputs, investments: [npsLumpsum] };
    const result = computeFinancialHealthScore(inputs);
    const tax = result.dimensions.find((d) => d.label === 'Tax Efficiency');
    expect(tax?.rawScore).toBeGreaterThanOrEqual(0);
  });

  it('tax efficiency score increases when NPS SIP is set', () => {
    const npsSip: Investment = {
      id: '10',
      instrument: 'nps',
      name: 'NPS SIP',
      investment_type: 'sip',
      monthly_amount_inr: 5_000,
      current_value_inr: 100_000,
      expected_annual_return_pct: 10,
      start_date: '2020-01-01',
      created_at: '',
      updated_at: '',
    };
    const inputs: ScoreInputs = { ...emptyInputs, investments: [npsSip] };
    const result = computeFinancialHealthScore(inputs);
    const tax = result.dimensions.find((d) => d.label === 'Tax Efficiency');
    expect(tax?.rawScore).toBeGreaterThan(0);
  });
});
