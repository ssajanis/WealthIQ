import { z } from 'zod';

// ─── Helpers ───────────────────────────────────────────────────────────────
// Use z.preprocess so the input type is explicit (string | number), not unknown.
// This keeps React Hook Form's resolver types correct with Zod v4.
const toNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : Number(v);

const toString = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const positiveInr = z.preprocess(
  toNumber,
  z.number().min(0, 'Cannot be negative').max(1_000_000_000, 'Value exceeds ₹100 Cr limit'),
);

const positiveInrRequired = z.preprocess(
  toNumber,
  z.number().min(1, 'Must be greater than ₹0').max(1_000_000_000, 'Value exceeds ₹100 Cr limit'),
);

const percentageField = z.preprocess(
  toNumber,
  z.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100%'),
);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)');

// ─── PIN ───────────────────────────────────────────────────────────────────
const pinField = z.preprocess(
  toString,
  z
    .string()
    .min(4, 'PIN must be at least 4 digits')
    .max(6, 'PIN must be at most 6 digits')
    .regex(/^\d+$/, 'PIN must contain only digits'),
);

export const PinSetupSchema = z
  .object({
    pin: pinField,
    confirm_pin: z.preprocess(toString, z.string()),
  })
  .refine((data) => data.pin === data.confirm_pin, {
    message: 'PINs do not match',
    path: ['confirm_pin'],
  });

export const PinLoginSchema = z.object({
  pin: pinField,
});

export type PinSetupInput = z.infer<typeof PinSetupSchema>;
export type PinLoginInput = z.infer<typeof PinLoginSchema>;

// ─── Income ────────────────────────────────────────────────────────────────
export const IncomeSchema = z.object({
  source_name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  source_type: z.enum(['salary', 'business', 'rental', 'interest', 'other']),
  gross_annual_inr: positiveInrRequired,
  is_primary_earner: z.boolean(),
  tax_regime: z.enum(['old', 'new']),
});

export type IncomeInput = z.infer<typeof IncomeSchema>;

// ─── Expenses ──────────────────────────────────────────────────────────────
export const ExpenseSchema = z.object({
  category: z.enum([
    'housing',
    'food',
    'transport',
    'utilities',
    'healthcare',
    'education',
    'entertainment',
    'clothing',
    'other',
  ]),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  monthly_amount_inr: positiveInrRequired,
  is_fixed: z.boolean(),
});

export type ExpenseInput = z.infer<typeof ExpenseSchema>;

// ─── Investments ───────────────────────────────────────────────────────────
export const InvestmentSchema = z.object({
  instrument: z.enum([
    'mutual_fund_equity',
    'mutual_fund_debt',
    'mutual_fund_hybrid',
    'ppf',
    'epf',
    'nps',
    'fd',
    'rd',
    'stocks',
    'gold',
    'real_estate',
    'other',
  ]),
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  investment_type: z.enum(['sip', 'lumpsum', 'recurring']),
  monthly_amount_inr: positiveInr.nullable(),
  current_value_inr: positiveInr,
  expected_annual_return_pct: percentageField,
  start_date: isoDate,
});

export type InvestmentInput = z.infer<typeof InvestmentSchema>;

// ─── Loans ─────────────────────────────────────────────────────────────────
export const LoanSchema = z.object({
  loan_type: z.enum([
    'home_loan',
    'car_loan',
    'personal_loan',
    'education_loan',
    'credit_card',
    'other',
  ]),
  lender_name: z.string().min(1, 'Lender name is required').max(100, 'Name too long'),
  principal_inr: positiveInrRequired,
  outstanding_inr: positiveInr,
  annual_interest_rate_pct: percentageField,
  emi_inr: positiveInrRequired,
  tenure_remaining_months: z.preprocess(
    toNumber,
    z
      .number()
      .int('Must be a whole number')
      .min(1, 'Must be at least 1 month')
      .max(360, 'Cannot exceed 360 months (30 years)'),
  ),
  start_date: isoDate,
});

export type LoanInput = z.infer<typeof LoanSchema>;

// ─── Goals ─────────────────────────────────────────────────────────────────
export const GoalSchema = z.object({
  goal_name: z.string().min(1, 'Goal name is required').max(100, 'Name too long'),
  goal_type: z.enum([
    'retirement',
    'education',
    'home_purchase',
    'vehicle',
    'emergency_fund',
    'travel',
    'other',
  ]),
  target_amount_inr: positiveInrRequired,
  current_savings_inr: positiveInr,
  target_date: isoDate,
  monthly_sip_inr: positiveInr.nullable(),
  expected_return_pct: percentageField,
});

export type GoalInput = z.infer<typeof GoalSchema>;

// ─── Assets ────────────────────────────────────────────────────────────────
export const AssetSchema = z.object({
  asset_type: z.enum(['property', 'gold', 'vehicle', 'other']),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  current_value_inr: positiveInrRequired,
  purchase_value_inr: positiveInrRequired,
  purchase_date: isoDate,
});

export type AssetInput = z.infer<typeof AssetSchema>;

// ─── Insurance ─────────────────────────────────────────────────────────────
export const InsuranceSchema = z.object({
  policy_type: z.enum(['term_life', 'health', 'vehicle', 'home', 'other']),
  insurer_name: z.string().min(1, 'Insurer name is required').max(100, 'Name too long'),
  sum_assured_inr: positiveInrRequired,
  annual_premium_inr: positiveInrRequired,
  members_covered: z.string().min(1, 'Members covered is required').max(200, 'Too long'),
  expiry_date: isoDate,
});

export type InsuranceInput = z.infer<typeof InsuranceSchema>;
