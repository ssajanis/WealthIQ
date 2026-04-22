// ─── Households ────────────────────────────────────────────────────────────
export interface Household {
  id: string;
  pin_hash: string;
  created_at: string;
  updated_at: string;
}

// ─── Income ────────────────────────────────────────────────────────────────
export type IncomeSourceType = 'salary' | 'business' | 'rental' | 'interest' | 'other';
export type TaxRegime = 'old' | 'new';

export interface Income {
  id: string;
  source_name: string;
  source_type: IncomeSourceType;
  gross_annual_inr: number;
  is_primary_earner: boolean;
  tax_regime: TaxRegime;
  created_at: string;
  updated_at: string;
}

// ─── Expenses ──────────────────────────────────────────────────────────────
export type ExpenseCategory =
  | 'housing'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'healthcare'
  | 'education'
  | 'entertainment'
  | 'clothing'
  | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  monthly_amount_inr: number;
  is_fixed: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Investments ───────────────────────────────────────────────────────────
export type InvestmentInstrument =
  | 'mutual_fund_equity'
  | 'mutual_fund_debt'
  | 'mutual_fund_hybrid'
  | 'ppf'
  | 'epf'
  | 'nps'
  | 'fd'
  | 'rd'
  | 'stocks'
  | 'gold'
  | 'real_estate'
  | 'other';

export type InvestmentType = 'sip' | 'lumpsum' | 'recurring';

export interface Investment {
  id: string;
  instrument: InvestmentInstrument;
  name: string;
  investment_type: InvestmentType;
  monthly_amount_inr: number | null;
  current_value_inr: number;
  expected_annual_return_pct: number;
  start_date: string;
  created_at: string;
  updated_at: string;
}

// ─── Loans ─────────────────────────────────────────────────────────────────
export type LoanType =
  | 'home_loan'
  | 'car_loan'
  | 'personal_loan'
  | 'education_loan'
  | 'credit_card'
  | 'other';

export interface Loan {
  id: string;
  loan_type: LoanType;
  lender_name: string;
  principal_inr: number;
  outstanding_inr: number;
  annual_interest_rate_pct: number;
  emi_inr: number;
  tenure_remaining_months: number;
  start_date: string;
  created_at: string;
  updated_at: string;
}

// ─── Goals ─────────────────────────────────────────────────────────────────
export type GoalType =
  | 'retirement'
  | 'education'
  | 'home_purchase'
  | 'vehicle'
  | 'emergency_fund'
  | 'travel'
  | 'other';

export interface Goal {
  id: string;
  goal_name: string;
  goal_type: GoalType;
  target_amount_inr: number;
  current_savings_inr: number;
  target_date: string;
  monthly_sip_inr: number | null;
  expected_return_pct: number;
  created_at: string;
  updated_at: string;
}

// ─── Assets ────────────────────────────────────────────────────────────────
export type AssetType = 'property' | 'gold' | 'vehicle' | 'other';

export interface Asset {
  id: string;
  asset_type: AssetType;
  description: string;
  current_value_inr: number;
  purchase_value_inr: number;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

// ─── Insurance ─────────────────────────────────────────────────────────────
export type InsurancePolicyType = 'term_life' | 'health' | 'vehicle' | 'home' | 'other';

export interface Insurance {
  id: string;
  policy_type: InsurancePolicyType;
  insurer_name: string;
  sum_assured_inr: number;
  annual_premium_inr: number;
  members_covered: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}

// ─── Snapshots ─────────────────────────────────────────────────────────────
export interface Snapshot {
  id: string;
  snapshot_name: string;
  snapshot_date: string;
  financial_health_score: number;
  total_income_annual_inr: number;
  total_expenses_annual_inr: number;
  total_investments_inr: number;
  total_liabilities_inr: number;
  net_worth_inr: number;
  savings_rate_pct: number;
  score_breakdown_json: string;
  created_at: string;
}

// ─── API response wrappers ─────────────────────────────────────────────────
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
