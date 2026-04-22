import {
  PinSetupSchema,
  PinLoginSchema,
  IncomeSchema,
  ExpenseSchema,
  InvestmentSchema,
  LoanSchema,
  GoalSchema,
  AssetSchema,
  InsuranceSchema,
} from '@/lib/schemas';

// ─── PIN schemas ────────────────────────────────────────────────────────────
describe('PinSetupSchema', () => {
  it('accepts a valid matching PIN', () => {
    expect(PinSetupSchema.safeParse({ pin: '1234', confirm_pin: '1234' }).success).toBe(true);
  });
  it('rejects mismatched PINs', () => {
    expect(PinSetupSchema.safeParse({ pin: '1234', confirm_pin: '5678' }).success).toBe(false);
  });
  it('rejects a PIN shorter than 4 digits', () => {
    expect(PinSetupSchema.safeParse({ pin: '12', confirm_pin: '12' }).success).toBe(false);
  });
  it('rejects a PIN longer than 6 digits', () => {
    expect(PinSetupSchema.safeParse({ pin: '1234567', confirm_pin: '1234567' }).success).toBe(
      false,
    );
  });
  it('rejects non-numeric PIN', () => {
    expect(PinSetupSchema.safeParse({ pin: 'abcd', confirm_pin: 'abcd' }).success).toBe(false);
  });
});

describe('PinLoginSchema', () => {
  it('accepts a valid PIN', () => {
    expect(PinLoginSchema.safeParse({ pin: '123456' }).success).toBe(true);
  });
  it('rejects empty PIN', () => {
    expect(PinLoginSchema.safeParse({ pin: '' }).success).toBe(false);
  });
});

// ─── Income schema ─────────────────────────────────────────────────────────
describe('IncomeSchema', () => {
  const valid = {
    source_name: 'Primary Salary',
    source_type: 'salary',
    gross_annual_inr: 2500000,
    is_primary_earner: true,
    tax_regime: 'new',
  };

  it('accepts valid income data', () => {
    expect(IncomeSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects zero gross income', () => {
    expect(IncomeSchema.safeParse({ ...valid, gross_annual_inr: 0 }).success).toBe(false);
  });
  it('rejects income above ₹100 Cr', () => {
    expect(IncomeSchema.safeParse({ ...valid, gross_annual_inr: 1_100_000_000 }).success).toBe(
      false,
    );
  });
  it('rejects empty source name', () => {
    expect(IncomeSchema.safeParse({ ...valid, source_name: '' }).success).toBe(false);
  });
  it('rejects invalid source_type', () => {
    expect(IncomeSchema.safeParse({ ...valid, source_type: 'crypto' }).success).toBe(false);
  });
});

// ─── Expense schema ────────────────────────────────────────────────────────
describe('ExpenseSchema', () => {
  const valid = {
    category: 'housing',
    description: 'Monthly rent',
    monthly_amount_inr: 40000,
    is_fixed: true,
  };

  it('accepts valid expense', () => {
    expect(ExpenseSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects negative amount', () => {
    expect(ExpenseSchema.safeParse({ ...valid, monthly_amount_inr: -1 }).success).toBe(false);
  });
  it('rejects empty description', () => {
    expect(ExpenseSchema.safeParse({ ...valid, description: '' }).success).toBe(false);
  });
});

// ─── Investment schema ─────────────────────────────────────────────────────
describe('InvestmentSchema', () => {
  const valid = {
    instrument: 'mutual_fund_equity',
    name: 'Nifty 50 Index Fund',
    investment_type: 'sip',
    monthly_amount_inr: 25000,
    current_value_inr: 300000,
    expected_annual_return_pct: 12,
    start_date: '2020-01-01',
  };

  it('accepts valid investment', () => {
    expect(InvestmentSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects return > 100%', () => {
    expect(InvestmentSchema.safeParse({ ...valid, expected_annual_return_pct: 101 }).success).toBe(
      false,
    );
  });
  it('rejects invalid date format', () => {
    expect(InvestmentSchema.safeParse({ ...valid, start_date: '01/01/2020' }).success).toBe(false);
  });
  it('rejects negative current value', () => {
    expect(InvestmentSchema.safeParse({ ...valid, current_value_inr: -100 }).success).toBe(false);
  });
});

// ─── Loan schema ───────────────────────────────────────────────────────────
describe('LoanSchema', () => {
  const valid = {
    loan_type: 'home_loan',
    lender_name: 'HDFC Bank',
    principal_inr: 6000000,
    outstanding_inr: 5500000,
    annual_interest_rate_pct: 8.5,
    emi_inr: 52000,
    tenure_remaining_months: 180,
    start_date: '2022-06-01',
  };

  it('accepts valid loan', () => {
    expect(LoanSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects tenure > 360 months', () => {
    expect(LoanSchema.safeParse({ ...valid, tenure_remaining_months: 361 }).success).toBe(false);
  });
  it('rejects zero EMI', () => {
    expect(LoanSchema.safeParse({ ...valid, emi_inr: 0 }).success).toBe(false);
  });
});

// ─── Goal schema ───────────────────────────────────────────────────────────
describe('GoalSchema', () => {
  const valid = {
    goal_name: 'Retirement',
    goal_type: 'retirement',
    target_amount_inr: 50000000,
    current_savings_inr: 500000,
    target_date: '2045-01-01',
    monthly_sip_inr: 25000,
    expected_return_pct: 12,
  };

  it('accepts valid goal', () => {
    expect(GoalSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects empty goal name', () => {
    expect(GoalSchema.safeParse({ ...valid, goal_name: '' }).success).toBe(false);
  });
  it('rejects zero target amount', () => {
    expect(GoalSchema.safeParse({ ...valid, target_amount_inr: 0 }).success).toBe(false);
  });
});

// ─── Asset schema ──────────────────────────────────────────────────────────
describe('AssetSchema', () => {
  const valid = {
    asset_type: 'property',
    description: '2BHK Flat Andheri',
    current_value_inr: 8000000,
    purchase_value_inr: 5000000,
    purchase_date: '2015-03-15',
  };

  it('accepts valid asset', () => {
    expect(AssetSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects zero current value', () => {
    expect(AssetSchema.safeParse({ ...valid, current_value_inr: 0 }).success).toBe(false);
  });
});

// ─── Insurance schema ──────────────────────────────────────────────────────
describe('InsuranceSchema', () => {
  const valid = {
    policy_type: 'term_life',
    insurer_name: 'LIC',
    sum_assured_inr: 10000000,
    annual_premium_inr: 15000,
    members_covered: 'Self',
    expiry_date: '2050-01-01',
  };

  it('accepts valid insurance policy', () => {
    expect(InsuranceSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects empty insurer name', () => {
    expect(InsuranceSchema.safeParse({ ...valid, insurer_name: '' }).success).toBe(false);
  });
  it('rejects empty members covered', () => {
    expect(InsuranceSchema.safeParse({ ...valid, members_covered: '' }).success).toBe(false);
  });
});
