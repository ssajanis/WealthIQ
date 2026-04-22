/**
 * Unit tests for /lib/sheets.ts.
 * googleapis is mocked — no real API calls are made.
 */

// ─── Shared mock functions (must be var/let declared before jest.mock hoisting) ─
const mockFns = {
  valuesGet: jest.fn(),
  valuesAppend: jest.fn(),
  valuesUpdate: jest.fn(),
  batchUpdate: jest.fn(),
  spreadsheetGet: jest.fn(),
};

jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({})),
    },
    sheets: jest.fn().mockReturnValue({
      spreadsheets: {
        get: (...args: unknown[]) => mockFns.spreadsheetGet(...args),
        values: {
          get: (...args: unknown[]) => mockFns.valuesGet(...args),
          append: (...args: unknown[]) => mockFns.valuesAppend(...args),
          update: (...args: unknown[]) => mockFns.valuesUpdate(...args),
        },
        batchUpdate: (...args: unknown[]) => mockFns.batchUpdate(...args),
      },
    }),
  },
}));

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('test-uuid-1234') }));

beforeAll(() => {
  process.env['GOOGLE_SERVICE_ACCOUNT_JSON'] = JSON.stringify({ type: 'service_account' });
  process.env['SHEET_ID'] = 'test-sheet-id';
});

afterAll(() => {
  delete process.env['GOOGLE_SERVICE_ACCOUNT_JSON'];
  delete process.env['SHEET_ID'];
});

beforeEach(() => {
  jest.clearAllMocks();
});

import {
  getHousehold,
  createHousehold,
  listIncome,
  createIncome,
  deleteIncome,
  listExpenses,
  createExpense,
  deleteExpense,
  listInvestments,
  createInvestment,
  deleteInvestment,
  listLoans,
  createLoan,
  deleteLoan,
  listGoals,
  createGoal,
  deleteGoal,
  listAssets,
  createAsset,
  deleteAsset,
  listInsurance,
  createInsurance,
  deleteInsurance,
  listSnapshots,
  createSnapshot,
  initSheet,
} from '@/lib/sheets';

// ─── Helpers ────────────────────────────────────────────────────────────────
function mockTabValues(rows: string[][]) {
  mockFns.valuesGet.mockResolvedValue({ data: { values: rows } });
}

// ─── Environment errors ─────────────────────────────────────────────────────
describe('environment errors', () => {
  it('getHousehold throws when SHEET_ID is missing', async () => {
    delete process.env['SHEET_ID'];
    await expect(getHousehold()).rejects.toThrow('SHEET_ID');
    process.env['SHEET_ID'] = 'test-sheet-id';
  });

  it('getHousehold throws when GOOGLE_SERVICE_ACCOUNT_JSON is missing', async () => {
    delete process.env['GOOGLE_SERVICE_ACCOUNT_JSON'];
    await expect(getHousehold()).rejects.toThrow('GOOGLE_SERVICE_ACCOUNT_JSON');
    process.env['GOOGLE_SERVICE_ACCOUNT_JSON'] = JSON.stringify({ type: 'service_account' });
  });
});

// ─── initSheet ─────────────────────────────────────────────────────────────
describe('initSheet', () => {
  it('creates tabs when they do not exist', async () => {
    mockFns.spreadsheetGet.mockResolvedValue({ data: { sheets: [] } });
    mockFns.batchUpdate.mockResolvedValue({});
    mockFns.valuesUpdate.mockResolvedValue({});
    await initSheet();
    expect(mockFns.spreadsheetGet).toHaveBeenCalled();
    expect(mockFns.batchUpdate).toHaveBeenCalled();
  });

  it('skips creation when tab already exists', async () => {
    mockFns.spreadsheetGet.mockResolvedValue({
      data: {
        sheets: [
          { properties: { title: 'households' } },
          { properties: { title: 'income' } },
          { properties: { title: 'expenses' } },
          { properties: { title: 'investments' } },
          { properties: { title: 'loans' } },
          { properties: { title: 'goals' } },
          { properties: { title: 'assets' } },
          { properties: { title: 'insurance' } },
          { properties: { title: 'snapshots' } },
        ],
      },
    });
    await initSheet();
    expect(mockFns.batchUpdate).not.toHaveBeenCalled();
  });
});

// ─── updateHouseholdPin ─────────────────────────────────────────────────────
describe('updateHouseholdPin', () => {
  it('calls update with the new pin hash', async () => {
    mockFns.valuesUpdate.mockResolvedValue({});
    const { updateHouseholdPin } = await import('@/lib/sheets');
    await updateHouseholdPin('$2b$10$newhash');
    expect(mockFns.valuesUpdate).toHaveBeenCalledTimes(1);
  });
});

// ─── Household ─────────────────────────────────────────────────────────────
describe('getHousehold', () => {
  it('returns null when sheet is empty', async () => {
    mockTabValues([['id', 'pin_hash', 'created_at', 'updated_at']]);
    expect(await getHousehold()).toBeNull();
  });

  it('returns null when sheet has no values', async () => {
    mockFns.valuesGet.mockResolvedValue({ data: { values: [] } });
    expect(await getHousehold()).toBeNull();
  });

  it('returns household data when a row exists', async () => {
    mockTabValues([
      ['id', 'pin_hash', 'created_at', 'updated_at'],
      ['household_1', '$2b$10$abc', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'],
    ]);
    const result = await getHousehold();
    expect(result?.id).toBe('household_1');
    expect(result?.pin_hash).toBe('$2b$10$abc');
  });
});

describe('createHousehold', () => {
  it('appends a row and returns the created household', async () => {
    mockFns.valuesAppend.mockResolvedValue({});
    const result = await createHousehold('$2b$10$hash');
    expect(mockFns.valuesAppend).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('household_1');
    expect(result.pin_hash).toBe('$2b$10$hash');
  });
});

// ─── Income ─────────────────────────────────────────────────────────────────
describe('listIncome', () => {
  it('returns empty array when only header row exists', async () => {
    mockTabValues([
      [
        'id',
        'source_name',
        'source_type',
        'gross_annual_inr',
        'is_primary_earner',
        'tax_regime',
        'created_at',
        'updated_at',
      ],
    ]);
    expect(await listIncome()).toEqual([]);
  });

  it('parses income rows correctly', async () => {
    mockTabValues([
      [
        'id',
        'source_name',
        'source_type',
        'gross_annual_inr',
        'is_primary_earner',
        'tax_regime',
        'created_at',
        'updated_at',
      ],
      ['id1', 'Salary', 'salary', '2500000', 'true', 'new', '2024-01-01', '2024-01-01'],
    ]);
    const result = await listIncome();
    expect(result).toHaveLength(1);
    expect(result[0]?.source_name).toBe('Salary');
    expect(result[0]?.gross_annual_inr).toBe(2500000);
    expect(result[0]?.is_primary_earner).toBe(true);
  });

  it('skips rows with empty id (cleared rows)', async () => {
    mockTabValues([
      [
        'id',
        'source_name',
        'source_type',
        'gross_annual_inr',
        'is_primary_earner',
        'tax_regime',
        'created_at',
        'updated_at',
      ],
      ['', '', '', '', '', '', '', ''],
      ['id2', 'Business', 'business', '1000000', 'false', 'old', '2024-01-01', '2024-01-01'],
    ]);
    expect(await listIncome()).toHaveLength(1);
  });
});

describe('createIncome', () => {
  it('appends and returns income with generated id', async () => {
    mockFns.valuesAppend.mockResolvedValue({});
    const result = await createIncome({
      source_name: 'Test',
      source_type: 'salary',
      gross_annual_inr: 100000,
      is_primary_earner: false,
      tax_regime: 'new',
    });
    expect(result.id).toBe('test-uuid-1234');
    expect(mockFns.valuesAppend).toHaveBeenCalledTimes(1);
  });
});

describe('deleteIncome', () => {
  it('calls update to clear the matching row', async () => {
    mockTabValues([
      ['id', 'source_name'],
      ['abc-123', 'Salary'],
    ]);
    mockFns.valuesUpdate.mockResolvedValue({});
    await deleteIncome('abc-123');
    expect(mockFns.valuesUpdate).toHaveBeenCalledTimes(1);
  });

  it('does nothing when id is not found', async () => {
    mockTabValues([['id'], ['other-id']]);
    await deleteIncome('nonexistent');
    expect(mockFns.valuesUpdate).not.toHaveBeenCalled();
  });
});

// ─── Expenses ─────────────────────────────────────────────────────────────
describe('listExpenses', () => {
  it('parses expense rows correctly', async () => {
    mockTabValues([
      [
        'id',
        'category',
        'description',
        'monthly_amount_inr',
        'is_fixed',
        'created_at',
        'updated_at',
      ],
      ['e1', 'housing', 'Rent', '40000', 'true', '2024-01-01', '2024-01-01'],
    ]);
    const result = await listExpenses();
    expect(result[0]?.monthly_amount_inr).toBe(40000);
    expect(result[0]?.is_fixed).toBe(true);
  });

  it('returns empty array for header-only sheet', async () => {
    mockTabValues([['id', 'category']]);
    expect(await listExpenses()).toEqual([]);
  });
});

describe('createExpense', () => {
  it('appends and returns expense', async () => {
    mockFns.valuesAppend.mockResolvedValue({});
    const result = await createExpense({
      category: 'food',
      description: 'Groceries',
      monthly_amount_inr: 15000,
      is_fixed: false,
    });
    expect(result.id).toBe('test-uuid-1234');
  });
});

describe('deleteExpense', () => {
  it('clears matching row', async () => {
    mockTabValues([['id'], ['exp-1']]);
    mockFns.valuesUpdate.mockResolvedValue({});
    await deleteExpense('exp-1');
    expect(mockFns.valuesUpdate).toHaveBeenCalledTimes(1);
  });
});

// ─── Investments ────────────────────────────────────────────────────────────
describe('listInvestments', () => {
  it('parses investment rows with null monthly_amount when empty', async () => {
    mockTabValues([
      [
        'id',
        'instrument',
        'name',
        'investment_type',
        'monthly_amount_inr',
        'current_value_inr',
        'expected_annual_return_pct',
        'start_date',
        'created_at',
        'updated_at',
      ],
      [
        'i1',
        'ppf',
        'PPF',
        'lumpsum',
        '',
        '150000',
        '7.1',
        '2015-01-01',
        '2024-01-01',
        '2024-01-01',
      ],
    ]);
    const result = await listInvestments();
    expect(result[0]?.monthly_amount_inr).toBeNull();
    expect(result[0]?.expected_annual_return_pct).toBe(7.1);
  });

  it('parses monthly_amount when set', async () => {
    mockTabValues([
      [
        'id',
        'instrument',
        'name',
        'investment_type',
        'monthly_amount_inr',
        'current_value_inr',
        'expected_annual_return_pct',
        'start_date',
        'created_at',
        'updated_at',
      ],
      [
        'i2',
        'mutual_fund_equity',
        'Nifty 50',
        'sip',
        '25000',
        '300000',
        '12',
        '2020-01-01',
        '2024-01-01',
        '2024-01-01',
      ],
    ]);
    const result = await listInvestments();
    expect(result[0]?.monthly_amount_inr).toBe(25000);
  });
});

describe('createInvestment', () => {
  it('appends and returns investment', async () => {
    mockFns.valuesAppend.mockResolvedValue({});
    const result = await createInvestment({
      instrument: 'mutual_fund_equity',
      name: 'Nifty 50',
      investment_type: 'sip',
      monthly_amount_inr: 25000,
      current_value_inr: 300000,
      expected_annual_return_pct: 12,
      start_date: '2020-01-01',
    });
    expect(result.id).toBe('test-uuid-1234');
  });
});

describe('deleteInvestment', () => {
  it('clears matching row', async () => {
    mockTabValues([['id'], ['inv-1']]);
    mockFns.valuesUpdate.mockResolvedValue({});
    await deleteInvestment('inv-1');
    expect(mockFns.valuesUpdate).toHaveBeenCalledTimes(1);
  });

  it('does nothing if id not found', async () => {
    mockTabValues([['id'], ['other']]);
    await deleteInvestment('missing');
    expect(mockFns.valuesUpdate).not.toHaveBeenCalled();
  });
});

// ─── Loans ─────────────────────────────────────────────────────────────────
describe('listLoans', () => {
  it('parses loan rows correctly', async () => {
    mockTabValues([
      [
        'id',
        'loan_type',
        'lender_name',
        'principal_inr',
        'outstanding_inr',
        'annual_interest_rate_pct',
        'emi_inr',
        'tenure_remaining_months',
        'start_date',
        'created_at',
        'updated_at',
      ],
      [
        'l1',
        'home_loan',
        'HDFC',
        '6000000',
        '5500000',
        '8.5',
        '52000',
        '180',
        '2022-06-01',
        '2024-01-01',
        '2024-01-01',
      ],
    ]);
    const result = await listLoans();
    expect(result[0]?.annual_interest_rate_pct).toBe(8.5);
    expect(result[0]?.tenure_remaining_months).toBe(180);
  });
});

describe('createLoan', () => {
  it('appends and returns loan', async () => {
    mockFns.valuesAppend.mockResolvedValue({});
    const result = await createLoan({
      loan_type: 'home_loan',
      lender_name: 'SBI',
      principal_inr: 5000000,
      outstanding_inr: 4800000,
      annual_interest_rate_pct: 8.4,
      emi_inr: 48000,
      tenure_remaining_months: 200,
      start_date: '2023-01-01',
    });
    expect(result.id).toBe('test-uuid-1234');
  });
});

describe('deleteLoan', () => {
  it('does not call update if id not found', async () => {
    mockTabValues([['id'], ['other']]);
    await deleteLoan('missing');
    expect(mockFns.valuesUpdate).not.toHaveBeenCalled();
  });

  it('clears matching row', async () => {
    mockTabValues([['id'], ['loan-1']]);
    mockFns.valuesUpdate.mockResolvedValue({});
    await deleteLoan('loan-1');
    expect(mockFns.valuesUpdate).toHaveBeenCalledTimes(1);
  });
});

// ─── Goals ─────────────────────────────────────────────────────────────────
describe('listGoals', () => {
  it('parses goals with null sip when empty', async () => {
    mockTabValues([
      [
        'id',
        'goal_name',
        'goal_type',
        'target_amount_inr',
        'current_savings_inr',
        'target_date',
        'monthly_sip_inr',
        'expected_return_pct',
        'created_at',
        'updated_at',
      ],
      [
        'g1',
        'Retirement',
        'retirement',
        '50000000',
        '500000',
        '2045-01-01',
        '',
        '12',
        '2024-01-01',
        '2024-01-01',
      ],
    ]);
    const result = await listGoals();
    expect(result[0]?.monthly_sip_inr).toBeNull();
    expect(result[0]?.target_amount_inr).toBe(50000000);
  });

  it('parses sip when set', async () => {
    mockTabValues([
      [
        'id',
        'goal_name',
        'goal_type',
        'target_amount_inr',
        'current_savings_inr',
        'target_date',
        'monthly_sip_inr',
        'expected_return_pct',
        'created_at',
        'updated_at',
      ],
      [
        'g2',
        'Education',
        'education',
        '5000000',
        '0',
        '2035-01-01',
        '10000',
        '10',
        '2024-01-01',
        '2024-01-01',
      ],
    ]);
    const result = await listGoals();
    expect(result[0]?.monthly_sip_inr).toBe(10000);
  });
});

describe('createGoal', () => {
  it('appends and returns goal', async () => {
    mockFns.valuesAppend.mockResolvedValue({});
    const result = await createGoal({
      goal_name: 'Emergency Fund',
      goal_type: 'emergency_fund',
      target_amount_inr: 600000,
      current_savings_inr: 0,
      target_date: '2025-12-31',
      monthly_sip_inr: 50000,
      expected_return_pct: 6,
    });
    expect(result.id).toBe('test-uuid-1234');
  });
});

describe('deleteGoal', () => {
  it('clears matching row', async () => {
    mockTabValues([['id'], ['goal-1']]);
    mockFns.valuesUpdate.mockResolvedValue({});
    await deleteGoal('goal-1');
    expect(mockFns.valuesUpdate).toHaveBeenCalledTimes(1);
  });
});

// ─── Assets ─────────────────────────────────────────────────────────────────
describe('listAssets', () => {
  it('parses asset rows correctly', async () => {
    mockTabValues([
      [
        'id',
        'asset_type',
        'description',
        'current_value_inr',
        'purchase_value_inr',
        'purchase_date',
        'created_at',
        'updated_at',
      ],
      [
        'a1',
        'property',
        'Flat Andheri',
        '8000000',
        '5000000',
        '2015-03-15',
        '2024-01-01',
        '2024-01-01',
      ],
    ]);
    const result = await listAssets();
    expect(result[0]?.current_value_inr).toBe(8000000);
    expect(result[0]?.asset_type).toBe('property');
  });
});

describe('createAsset', () => {
  it('appends and returns asset', async () => {
    mockFns.valuesAppend.mockResolvedValue({});
    const result = await createAsset({
      asset_type: 'gold',
      description: 'Gold coins',
      current_value_inr: 200000,
      purchase_value_inr: 150000,
      purchase_date: '2019-11-01',
    });
    expect(result.id).toBe('test-uuid-1234');
  });
});

describe('deleteAsset', () => {
  it('clears matching row', async () => {
    mockTabValues([['id'], ['asset-1']]);
    mockFns.valuesUpdate.mockResolvedValue({});
    await deleteAsset('asset-1');
    expect(mockFns.valuesUpdate).toHaveBeenCalledTimes(1);
  });
});

// ─── Insurance ─────────────────────────────────────────────────────────────
describe('listInsurance', () => {
  it('parses insurance rows correctly', async () => {
    mockTabValues([
      [
        'id',
        'policy_type',
        'insurer_name',
        'sum_assured_inr',
        'annual_premium_inr',
        'members_covered',
        'expiry_date',
        'created_at',
        'updated_at',
      ],
      [
        'ins1',
        'term_life',
        'LIC',
        '10000000',
        '15000',
        'Self',
        '2050-01-01',
        '2024-01-01',
        '2024-01-01',
      ],
    ]);
    const result = await listInsurance();
    expect(result[0]?.sum_assured_inr).toBe(10000000);
    expect(result[0]?.insurer_name).toBe('LIC');
  });
});

describe('createInsurance', () => {
  it('appends and returns policy', async () => {
    mockFns.valuesAppend.mockResolvedValue({});
    const result = await createInsurance({
      policy_type: 'health',
      insurer_name: 'Star Health',
      sum_assured_inr: 1000000,
      annual_premium_inr: 20000,
      members_covered: 'Family',
      expiry_date: '2026-01-01',
    });
    expect(result.id).toBe('test-uuid-1234');
  });
});

describe('deleteInsurance', () => {
  it('clears matching row', async () => {
    mockTabValues([['id'], ['ins-1']]);
    mockFns.valuesUpdate.mockResolvedValue({});
    await deleteInsurance('ins-1');
    expect(mockFns.valuesUpdate).toHaveBeenCalledTimes(1);
  });
});

// ─── Snapshots ─────────────────────────────────────────────────────────────
describe('listSnapshots', () => {
  it('parses snapshot rows correctly', async () => {
    mockTabValues([
      [
        'id',
        'snapshot_name',
        'snapshot_date',
        'financial_health_score',
        'total_income_annual_inr',
        'total_expenses_annual_inr',
        'total_investments_inr',
        'total_liabilities_inr',
        'net_worth_inr',
        'savings_rate_pct',
        'score_breakdown_json',
        'created_at',
      ],
      [
        's1',
        'April 2026',
        '2026-04-22',
        '72',
        '4300000',
        '1200000',
        '3000000',
        '5500000',
        '5500000',
        '72',
        '{}',
        '2026-04-22T00:00:00Z',
      ],
    ]);
    const result = await listSnapshots();
    expect(result[0]?.financial_health_score).toBe(72);
    expect(result[0]?.snapshot_name).toBe('April 2026');
  });
});

describe('createSnapshot', () => {
  it('appends and returns snapshot', async () => {
    mockFns.valuesAppend.mockResolvedValue({});
    const result = await createSnapshot({
      snapshot_name: 'Test',
      snapshot_date: '2026-04-22',
      financial_health_score: 75,
      total_income_annual_inr: 4300000,
      total_expenses_annual_inr: 1200000,
      total_investments_inr: 3000000,
      total_liabilities_inr: 5500000,
      net_worth_inr: 5500000,
      savings_rate_pct: 72,
      score_breakdown_json: '{}',
    });
    expect(result.id).toBe('test-uuid-1234');
  });
});

// ─── Null / undefined fallback branches (?? operators) ────────────────────
// These tests trigger the ?? fallback paths by providing sparse/empty rows.
describe('null-coalescing fallback branches', () => {
  it('readTab returns empty array when API returns no values property', async () => {
    mockFns.valuesGet.mockResolvedValue({ data: {} });
    const result = await listIncome();
    expect(result).toEqual([]);
  });

  it('listIncome handles sparse row (missing columns use defaults)', async () => {
    // Row with only id — all other fields will be undefined, hitting ?? fallbacks
    mockTabValues([['id'], ['sparse-id']]);
    const result = await listIncome();
    expect(result[0]?.id).toBe('sparse-id');
    expect(result[0]?.source_name).toBe('');
    expect(result[0]?.gross_annual_inr).toBe(0);
    expect(result[0]?.is_primary_earner).toBe(false);
  });

  it('listExpenses handles sparse row', async () => {
    mockTabValues([['id'], ['sparse-e']]);
    const result = await listExpenses();
    expect(result[0]?.description).toBe('');
    expect(result[0]?.monthly_amount_inr).toBe(0);
    expect(result[0]?.is_fixed).toBe(false);
  });

  it('listInvestments handles sparse row', async () => {
    mockTabValues([['id'], ['sparse-i']]);
    const result = await listInvestments();
    expect(result[0]?.name).toBe('');
    expect(result[0]?.current_value_inr).toBe(0);
    expect(result[0]?.monthly_amount_inr).toBeNull();
  });

  it('listLoans handles sparse row', async () => {
    mockTabValues([['id'], ['sparse-l']]);
    const result = await listLoans();
    expect(result[0]?.lender_name).toBe('');
    expect(result[0]?.principal_inr).toBe(0);
  });

  it('listGoals handles sparse row', async () => {
    mockTabValues([['id'], ['sparse-g']]);
    const result = await listGoals();
    expect(result[0]?.goal_name).toBe('');
    expect(result[0]?.monthly_sip_inr).toBeNull();
  });

  it('listAssets handles sparse row', async () => {
    mockTabValues([['id'], ['sparse-a']]);
    const result = await listAssets();
    expect(result[0]?.description).toBe('');
    expect(result[0]?.current_value_inr).toBe(0);
  });

  it('listInsurance handles sparse row', async () => {
    mockTabValues([['id'], ['sparse-ins']]);
    const result = await listInsurance();
    expect(result[0]?.insurer_name).toBe('');
    expect(result[0]?.sum_assured_inr).toBe(0);
  });

  it('listSnapshots handles sparse row', async () => {
    mockTabValues([['id'], ['sparse-s']]);
    const result = await listSnapshots();
    expect(result[0]?.snapshot_name).toBe('');
    expect(result[0]?.financial_health_score).toBe(0);
    expect(result[0]?.score_breakdown_json).toBe('{}');
  });

  it('getHousehold handles row with only one column', async () => {
    mockTabValues([['id', 'pin_hash'], ['household_1']]);
    const result = await getHousehold();
    expect(result?.pin_hash).toBe('');
  });
});
