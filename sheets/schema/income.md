# Tab: income

Stores all household income sources.

## Columns

| Column            | Type             | Required | Description                                             |
| ----------------- | ---------------- | -------- | ------------------------------------------------------- |
| id                | string           | Yes      | Unique row ID (UUID)                                    |
| source_name       | string           | Yes      | Label e.g. "Primary Salary", "Rental - Flat 2B"         |
| source_type       | enum             | Yes      | `salary` / `business` / `rental` / `interest` / `other` |
| gross_annual_inr  | number           | Yes      | Annual gross income in INR                              |
| is_primary_earner | boolean          | Yes      | True for the household's primary earner                 |
| tax_regime        | enum             | Yes      | `old` / `new` — Indian income tax regime                |
| created_at        | ISO8601 datetime | Yes      | Row creation timestamp                                  |
| updated_at        | ISO8601 datetime | Yes      | Last update timestamp                                   |

## Notes

- All monetary values are in INR (Indian Rupees), stored as plain numbers (no ₹ symbol).
- tax_regime determines which slab rates apply in `/lib/tax.ts`.
