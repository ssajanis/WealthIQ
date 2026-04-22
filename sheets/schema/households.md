# Tab: households

Stores the single household's profile and PIN hash.

## Columns

| Column     | Type             | Required | Description                                         |
| ---------- | ---------------- | -------- | --------------------------------------------------- |
| id         | string           | Yes      | Fixed value `"household_1"` — single-user app       |
| pin_hash   | string           | Yes      | bcrypt hash (cost ≥ 10) of the user's 4–6 digit PIN |
| created_at | ISO8601 datetime | Yes      | When the household was first set up                 |
| updated_at | ISO8601 datetime | Yes      | Last modification timestamp                         |

## Notes

- This tab has exactly one data row.
- The PIN is never stored in plaintext anywhere.
- Never read or write this tab from a React component — use `/lib/sheets.ts` only.
