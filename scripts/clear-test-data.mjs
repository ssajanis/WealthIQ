// Clears all data rows from every tab EXCEPT households (PIN is preserved).
// Headers in row 1 are kept. Run after test runs to reset the sheet.
// Usage: node scripts/clear-test-data.mjs
import { config } from 'dotenv';
import { google } from 'googleapis';

config({ path: '.env.local' });

const SHEET_ID = process.env.SHEET_ID;
const SA_JSON = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

const DATA_TABS = [
  'income',
  'expenses',
  'investments',
  'loans',
  'goals',
  'assets',
  'insurance',
  'snapshots',
];

const auth = new google.auth.GoogleAuth({
  credentials: SA_JSON,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

for (const tab of DATA_TABS) {
  // Clear everything from row 2 downward — row 1 (headers) is untouched.
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A2:ZZ`,
  });
  console.log(`  ✓ ${tab} cleared`);
}

console.log('\nAll test data cleared. Household / PIN untouched.');
