/**
 * Playwright global setup — logs in once and saves session state to
 * tests/e2e/.auth/session.json so all tests reuse the same session cookie.
 *
 * Usage: set E2E_PIN env var to the 4-6 digit app PIN, or it will try the
 * default test PIN from the PLAYWRIGHT_PIN env var.
 */
import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, '.auth/session.json');

export default async function globalSetup(_config: FullConfig) {
  const pin = process.env['E2E_PIN'] ?? process.env['PLAYWRIGHT_PIN'];
  if (!pin) {
    // No PIN provided — skip auth setup (tests that need auth will be skipped gracefully)
    console.log('[setup] No E2E_PIN set — skipping session setup. Data-entry tests may fail.');
    return;
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Hit the verify endpoint to get a session cookie
    const res = await page.request.post('http://localhost:3000/api/auth/verify', {
      data: { pin },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok()) {
      const body = await res.text();
      console.error(`[setup] Auth failed (${res.status()}): ${body}`);
      await browser.close();
      return;
    }

    // Save cookies to file so tests can reuse them
    await context.storageState({ path: AUTH_FILE });
    console.log('[setup] Session saved to', AUTH_FILE);
  } catch (err) {
    console.error('[setup] Auth setup error:', err);
  }

  await browser.close();
}
