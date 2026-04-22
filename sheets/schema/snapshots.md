# Tab: snapshots

Stores point-in-time snapshots of the Financial Health Score and key metrics.

## Columns

| Column                    | Type             | Required | Description                           |
| ------------------------- | ---------------- | -------- | ------------------------------------- |
| id                        | string           | Yes      | Unique row ID (UUID)                  |
| snapshot_name             | string           | Yes      | User label e.g. "April 2026 Baseline" |
| snapshot_date             | ISO8601 date     | Yes      | Date of snapshot                      |
| financial_health_score    | number           | Yes      | Score 0–100 at time of snapshot       |
| total_income_annual_inr   | number           | Yes      | Total gross annual income             |
| total_expenses_annual_inr | number           | Yes      | Total annual expenses                 |
| total_investments_inr     | number           | Yes      | Total investment portfolio value      |
| total_liabilities_inr     | number           | Yes      | Total outstanding loan balances       |
| net_worth_inr             | number           | Yes      | Assets + Investments − Liabilities    |
| savings_rate_pct          | number           | Yes      | (Income − Expenses) / Income × 100    |
| score_breakdown_json      | string           | Yes      | JSON string of sub-scores by category |
| created_at                | ISO8601 datetime | Yes      | When snapshot was saved               |

## Notes

- Snapshots are read-only once saved — never update an existing snapshot row.
- `score_breakdown_json` stores the detailed score breakdown as a JSON string for comparison views.
