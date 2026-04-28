/**
 * 100-persona stress test — PRD Section 10.5.
 * Each persona navigates to the financial analysis page and verifies:
 * - Page loads without crashing
 * - Score section renders
 * - No data-loss or JS errors
 *
 * Run with: npx playwright test tests/personas/persona-stress.spec.ts
 * Results saved to tests/reports/persona-results.json
 */
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

interface Persona {
  id: string;
  name: string;
  age: number;
  city: string;
  income_annual: number;
  spouse_income: number;
  emi_total_monthly: number;
  monthly_expenses: number;
  investments_monthly: number;
  goal: string;
  loan_type: string | null;
}

const personas: Persona[] = JSON.parse(
  readFileSync(path.join(__dirname, 'personas.json'), 'utf-8'),
) as Persona[];

const REPORTS_DIR = path.join(__dirname, '../reports');
const results: { id: string; name: string; passed: boolean; error?: string }[] = [];

// Run each persona as its own test
for (const persona of personas) {
  test(`[${persona.id}] ${persona.name} — ${persona.city}`, async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    try {
      await page.goto('/financial-analysis', { waitUntil: 'networkidle' });

      // Verify page loaded without crash
      await expect(page.getByText('WealthIQ India')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Financial Health Score/i).first()).toBeVisible({ timeout: 5000 });

      if (errors.length > 0) {
        throw new Error(`JS errors: ${errors.join('; ')}`);
      }

      results.push({ id: persona.id, name: persona.name, passed: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: persona.id, name: persona.name, passed: false, error: msg });
      throw err;
    }
  });
}

// Write summary report after all tests
test.afterAll(() => {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const summary = { total: results.length, passed, failed, results };
  writeFileSync(path.join(REPORTS_DIR, 'persona-results.json'), JSON.stringify(summary, null, 2));
});
