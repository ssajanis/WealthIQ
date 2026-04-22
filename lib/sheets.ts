/**
 * Google Sheets data access layer.
 * ALL reads and writes to the spreadsheet go through this file.
 * Never call the Sheets API directly from React components or other lib files.
 */

import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import type {
  Household,
  Income,
  Expense,
  Investment,
  Loan,
  Goal,
  Asset,
  Insurance,
  Snapshot,
} from '@/types';

// ─── Tab names ─────────────────────────────────────────────────────────────
const TABS = {
  HOUSEHOLDS: 'households',
  INCOME: 'income',
  EXPENSES: 'expenses',
  INVESTMENTS: 'investments',
  LOANS: 'loans',
  GOALS: 'goals',
  ASSETS: 'assets',
  INSURANCE: 'insurance',
  SNAPSHOTS: 'snapshots',
} as const;

// ─── Auth ──────────────────────────────────────────────────────────────────
function getSheets() {
  const keyJson = process.env['GOOGLE_SERVICE_ACCOUNT_JSON'];
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set in environment');

  const credentials = JSON.parse(keyJson) as Record<string, unknown>;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

function getSheetId(): string {
  const id = process.env['SHEET_ID'];
  if (!id) throw new Error('SHEET_ID is not set in environment');
  return id;
}

// ─── Generic helpers ───────────────────────────────────────────────────────

/** Read all rows from a tab. Returns array of string arrays (raw values). */
async function readTab(tab: string): Promise<string[][]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${tab}!A:ZZ`,
  });
  return (res.data.values ?? []) as string[][];
}

/** Append a single row to a tab. */
async function appendRow(tab: string, row: (string | number | boolean | null)[]): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${tab}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

/** Overwrite a specific row by 1-based row index (row 1 = header). */
async function updateRow(
  tab: string,
  rowIndex: number,
  row: (string | number | boolean | null)[],
): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${tab}!A${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

/** Clear a specific row (set all cells to empty string). */
async function clearRow(tab: string, rowIndex: number, columnCount: number): Promise<void> {
  const sheets = getSheets();
  const emptyRow = Array(columnCount).fill('') as string[];
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${tab}!A${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [emptyRow] },
  });
}

/** Ensure a tab exists; if not, create it with the given header row. */
async function ensureTab(tabName: string, headers: string[]): Promise<void> {
  const sheets = getSheets();
  const spreadsheetId = getSheetId();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === tabName);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }
}

// ─── Initialisation ────────────────────────────────────────────────────────

/**
 * Ensure all required tabs exist with correct headers.
 * Call once at startup or before first use.
 */
export async function initSheet(): Promise<void> {
  await Promise.all([
    ensureTab(TABS.HOUSEHOLDS, ['id', 'pin_hash', 'created_at', 'updated_at']),
    ensureTab(TABS.INCOME, [
      'id',
      'source_name',
      'source_type',
      'gross_annual_inr',
      'is_primary_earner',
      'tax_regime',
      'created_at',
      'updated_at',
    ]),
    ensureTab(TABS.EXPENSES, [
      'id',
      'category',
      'description',
      'monthly_amount_inr',
      'is_fixed',
      'created_at',
      'updated_at',
    ]),
    ensureTab(TABS.INVESTMENTS, [
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
    ]),
    ensureTab(TABS.LOANS, [
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
    ]),
    ensureTab(TABS.GOALS, [
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
    ]),
    ensureTab(TABS.ASSETS, [
      'id',
      'asset_type',
      'description',
      'current_value_inr',
      'purchase_value_inr',
      'purchase_date',
      'created_at',
      'updated_at',
    ]),
    ensureTab(TABS.INSURANCE, [
      'id',
      'policy_type',
      'insurer_name',
      'sum_assured_inr',
      'annual_premium_inr',
      'members_covered',
      'expiry_date',
      'created_at',
      'updated_at',
    ]),
    ensureTab(TABS.SNAPSHOTS, [
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
    ]),
  ]);
}

// ─── Household / PIN ───────────────────────────────────────────────────────

export async function getHousehold(): Promise<Household | null> {
  const rows = await readTab(TABS.HOUSEHOLDS);
  const dataRow = rows[1]; // row 0 = header
  if (!dataRow || !dataRow[0]) return null;
  return {
    id: dataRow[0] ?? '',
    pin_hash: dataRow[1] ?? '',
    created_at: dataRow[2] ?? '',
    updated_at: dataRow[3] ?? '',
  };
}

export async function createHousehold(pinHash: string): Promise<Household> {
  const now = new Date().toISOString();
  const household: Household = {
    id: 'household_1',
    pin_hash: pinHash,
    created_at: now,
    updated_at: now,
  };
  await appendRow(TABS.HOUSEHOLDS, [
    household.id,
    household.pin_hash,
    household.created_at,
    household.updated_at,
  ]);
  return household;
}

export async function updateHouseholdPin(pinHash: string): Promise<void> {
  await updateRow(TABS.HOUSEHOLDS, 2, ['household_1', pinHash, '', new Date().toISOString()]);
}

// ─── Income ────────────────────────────────────────────────────────────────

export async function listIncome(): Promise<Income[]> {
  const rows = await readTab(TABS.INCOME);
  return rows
    .slice(1)
    .filter(Boolean)
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? '',
      source_name: r[1] ?? '',
      source_type: (r[2] ?? 'other') as Income['source_type'],
      gross_annual_inr: Number(r[3] ?? 0),
      is_primary_earner: r[4] === 'true',
      tax_regime: (r[5] ?? 'new') as Income['tax_regime'],
      created_at: r[6] ?? '',
      updated_at: r[7] ?? '',
    }));
}

export async function createIncome(
  data: Omit<Income, 'id' | 'created_at' | 'updated_at'>,
): Promise<Income> {
  const now = new Date().toISOString();
  const income: Income = { ...data, id: uuidv4(), created_at: now, updated_at: now };
  await appendRow(TABS.INCOME, [
    income.id,
    income.source_name,
    income.source_type,
    income.gross_annual_inr,
    income.is_primary_earner,
    income.tax_regime,
    income.created_at,
    income.updated_at,
  ]);
  return income;
}

export async function deleteIncome(id: string): Promise<void> {
  const rows = await readTab(TABS.INCOME);
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return;
  await clearRow(TABS.INCOME, rowIndex + 1, 8);
}

// ─── Expenses ──────────────────────────────────────────────────────────────

export async function listExpenses(): Promise<Expense[]> {
  const rows = await readTab(TABS.EXPENSES);
  return rows
    .slice(1)
    .filter(Boolean)
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? '',
      category: (r[1] ?? 'other') as Expense['category'],
      description: r[2] ?? '',
      monthly_amount_inr: Number(r[3] ?? 0),
      is_fixed: r[4] === 'true',
      created_at: r[5] ?? '',
      updated_at: r[6] ?? '',
    }));
}

export async function createExpense(
  data: Omit<Expense, 'id' | 'created_at' | 'updated_at'>,
): Promise<Expense> {
  const now = new Date().toISOString();
  const expense: Expense = { ...data, id: uuidv4(), created_at: now, updated_at: now };
  await appendRow(TABS.EXPENSES, [
    expense.id,
    expense.category,
    expense.description,
    expense.monthly_amount_inr,
    expense.is_fixed,
    expense.created_at,
    expense.updated_at,
  ]);
  return expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const rows = await readTab(TABS.EXPENSES);
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return;
  await clearRow(TABS.EXPENSES, rowIndex + 1, 7);
}

// ─── Investments ───────────────────────────────────────────────────────────

export async function listInvestments(): Promise<Investment[]> {
  const rows = await readTab(TABS.INVESTMENTS);
  return rows
    .slice(1)
    .filter(Boolean)
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? '',
      instrument: (r[1] ?? 'other') as Investment['instrument'],
      name: r[2] ?? '',
      investment_type: (r[3] ?? 'lumpsum') as Investment['investment_type'],
      monthly_amount_inr: r[4] ? Number(r[4]) : null,
      current_value_inr: Number(r[5] ?? 0),
      expected_annual_return_pct: Number(r[6] ?? 0),
      start_date: r[7] ?? '',
      created_at: r[8] ?? '',
      updated_at: r[9] ?? '',
    }));
}

export async function createInvestment(
  data: Omit<Investment, 'id' | 'created_at' | 'updated_at'>,
): Promise<Investment> {
  const now = new Date().toISOString();
  const investment: Investment = { ...data, id: uuidv4(), created_at: now, updated_at: now };
  await appendRow(TABS.INVESTMENTS, [
    investment.id,
    investment.instrument,
    investment.name,
    investment.investment_type,
    investment.monthly_amount_inr,
    investment.current_value_inr,
    investment.expected_annual_return_pct,
    investment.start_date,
    investment.created_at,
    investment.updated_at,
  ]);
  return investment;
}

export async function deleteInvestment(id: string): Promise<void> {
  const rows = await readTab(TABS.INVESTMENTS);
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return;
  await clearRow(TABS.INVESTMENTS, rowIndex + 1, 10);
}

// ─── Loans ─────────────────────────────────────────────────────────────────

export async function listLoans(): Promise<Loan[]> {
  const rows = await readTab(TABS.LOANS);
  return rows
    .slice(1)
    .filter(Boolean)
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? '',
      loan_type: (r[1] ?? 'other') as Loan['loan_type'],
      lender_name: r[2] ?? '',
      principal_inr: Number(r[3] ?? 0),
      outstanding_inr: Number(r[4] ?? 0),
      annual_interest_rate_pct: Number(r[5] ?? 0),
      emi_inr: Number(r[6] ?? 0),
      tenure_remaining_months: Number(r[7] ?? 0),
      start_date: r[8] ?? '',
      created_at: r[9] ?? '',
      updated_at: r[10] ?? '',
    }));
}

export async function createLoan(
  data: Omit<Loan, 'id' | 'created_at' | 'updated_at'>,
): Promise<Loan> {
  const now = new Date().toISOString();
  const loan: Loan = { ...data, id: uuidv4(), created_at: now, updated_at: now };
  await appendRow(TABS.LOANS, [
    loan.id,
    loan.loan_type,
    loan.lender_name,
    loan.principal_inr,
    loan.outstanding_inr,
    loan.annual_interest_rate_pct,
    loan.emi_inr,
    loan.tenure_remaining_months,
    loan.start_date,
    loan.created_at,
    loan.updated_at,
  ]);
  return loan;
}

export async function deleteLoan(id: string): Promise<void> {
  const rows = await readTab(TABS.LOANS);
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return;
  await clearRow(TABS.LOANS, rowIndex + 1, 11);
}

// ─── Goals ─────────────────────────────────────────────────────────────────

export async function listGoals(): Promise<Goal[]> {
  const rows = await readTab(TABS.GOALS);
  return rows
    .slice(1)
    .filter(Boolean)
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? '',
      goal_name: r[1] ?? '',
      goal_type: (r[2] ?? 'other') as Goal['goal_type'],
      target_amount_inr: Number(r[3] ?? 0),
      current_savings_inr: Number(r[4] ?? 0),
      target_date: r[5] ?? '',
      monthly_sip_inr: r[6] ? Number(r[6]) : null,
      expected_return_pct: Number(r[7] ?? 0),
      created_at: r[8] ?? '',
      updated_at: r[9] ?? '',
    }));
}

export async function createGoal(
  data: Omit<Goal, 'id' | 'created_at' | 'updated_at'>,
): Promise<Goal> {
  const now = new Date().toISOString();
  const goal: Goal = { ...data, id: uuidv4(), created_at: now, updated_at: now };
  await appendRow(TABS.GOALS, [
    goal.id,
    goal.goal_name,
    goal.goal_type,
    goal.target_amount_inr,
    goal.current_savings_inr,
    goal.target_date,
    goal.monthly_sip_inr,
    goal.expected_return_pct,
    goal.created_at,
    goal.updated_at,
  ]);
  return goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const rows = await readTab(TABS.GOALS);
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return;
  await clearRow(TABS.GOALS, rowIndex + 1, 10);
}

// ─── Assets ────────────────────────────────────────────────────────────────

export async function listAssets(): Promise<Asset[]> {
  const rows = await readTab(TABS.ASSETS);
  return rows
    .slice(1)
    .filter(Boolean)
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? '',
      asset_type: (r[1] ?? 'other') as Asset['asset_type'],
      description: r[2] ?? '',
      current_value_inr: Number(r[3] ?? 0),
      purchase_value_inr: Number(r[4] ?? 0),
      purchase_date: r[5] ?? '',
      created_at: r[6] ?? '',
      updated_at: r[7] ?? '',
    }));
}

export async function createAsset(
  data: Omit<Asset, 'id' | 'created_at' | 'updated_at'>,
): Promise<Asset> {
  const now = new Date().toISOString();
  const asset: Asset = { ...data, id: uuidv4(), created_at: now, updated_at: now };
  await appendRow(TABS.ASSETS, [
    asset.id,
    asset.asset_type,
    asset.description,
    asset.current_value_inr,
    asset.purchase_value_inr,
    asset.purchase_date,
    asset.created_at,
    asset.updated_at,
  ]);
  return asset;
}

export async function deleteAsset(id: string): Promise<void> {
  const rows = await readTab(TABS.ASSETS);
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return;
  await clearRow(TABS.ASSETS, rowIndex + 1, 8);
}

// ─── Insurance ─────────────────────────────────────────────────────────────

export async function listInsurance(): Promise<Insurance[]> {
  const rows = await readTab(TABS.INSURANCE);
  return rows
    .slice(1)
    .filter(Boolean)
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? '',
      policy_type: (r[1] ?? 'other') as Insurance['policy_type'],
      insurer_name: r[2] ?? '',
      sum_assured_inr: Number(r[3] ?? 0),
      annual_premium_inr: Number(r[4] ?? 0),
      members_covered: r[5] ?? '',
      expiry_date: r[6] ?? '',
      created_at: r[7] ?? '',
      updated_at: r[8] ?? '',
    }));
}

export async function createInsurance(
  data: Omit<Insurance, 'id' | 'created_at' | 'updated_at'>,
): Promise<Insurance> {
  const now = new Date().toISOString();
  const policy: Insurance = { ...data, id: uuidv4(), created_at: now, updated_at: now };
  await appendRow(TABS.INSURANCE, [
    policy.id,
    policy.policy_type,
    policy.insurer_name,
    policy.sum_assured_inr,
    policy.annual_premium_inr,
    policy.members_covered,
    policy.expiry_date,
    policy.created_at,
    policy.updated_at,
  ]);
  return policy;
}

export async function deleteInsurance(id: string): Promise<void> {
  const rows = await readTab(TABS.INSURANCE);
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return;
  await clearRow(TABS.INSURANCE, rowIndex + 1, 9);
}

// ─── Snapshots ─────────────────────────────────────────────────────────────

export async function listSnapshots(): Promise<Snapshot[]> {
  const rows = await readTab(TABS.SNAPSHOTS);
  return rows
    .slice(1)
    .filter(Boolean)
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? '',
      snapshot_name: r[1] ?? '',
      snapshot_date: r[2] ?? '',
      financial_health_score: Number(r[3] ?? 0),
      total_income_annual_inr: Number(r[4] ?? 0),
      total_expenses_annual_inr: Number(r[5] ?? 0),
      total_investments_inr: Number(r[6] ?? 0),
      total_liabilities_inr: Number(r[7] ?? 0),
      net_worth_inr: Number(r[8] ?? 0),
      savings_rate_pct: Number(r[9] ?? 0),
      score_breakdown_json: r[10] ?? '{}',
      created_at: r[11] ?? '',
    }));
}

export async function createSnapshot(data: Omit<Snapshot, 'id' | 'created_at'>): Promise<Snapshot> {
  const now = new Date().toISOString();
  const snapshot: Snapshot = { ...data, id: uuidv4(), created_at: now };
  await appendRow(TABS.SNAPSHOTS, [
    snapshot.id,
    snapshot.snapshot_name,
    snapshot.snapshot_date,
    snapshot.financial_health_score,
    snapshot.total_income_annual_inr,
    snapshot.total_expenses_annual_inr,
    snapshot.total_investments_inr,
    snapshot.total_liabilities_inr,
    snapshot.net_worth_inr,
    snapshot.savings_rate_pct,
    snapshot.score_breakdown_json,
    snapshot.created_at,
  ]);
  return snapshot;
}
