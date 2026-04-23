// One-off script to reset the PIN hash in Google Sheets.
// Usage: node scripts/reset-pin.mjs
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { google } from 'googleapis';

config({ path: '.env.local' });

const NEW_PIN = '082016';
const SHEET_ID = process.env.SHEET_ID;
const SA_JSON = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

const auth = new google.auth.GoogleAuth({
  credentials: SA_JSON,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const hash = await bcrypt.hash(NEW_PIN, 10);
console.log('New hash generated.');

// Update row 2 (first data row) of the households tab
await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: 'households!A2:D2',
  valueInputOption: 'RAW',
  requestBody: {
    values: [['household_1', hash, '', new Date().toISOString()]],
  },
});

console.log('PIN reset to 082016 successfully.');
