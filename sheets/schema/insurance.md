# Tab: insurance

Stores insurance policies held by the household.

## Columns

| Column             | Type             | Required | Description                                           |
| ------------------ | ---------------- | -------- | ----------------------------------------------------- |
| id                 | string           | Yes      | Unique row ID (UUID)                                  |
| policy_type        | enum             | Yes      | `term_life` / `health` / `vehicle` / `home` / `other` |
| insurer_name       | string           | Yes      | e.g. "LIC", "Star Health"                             |
| sum_assured_inr    | number           | Yes      | Cover amount in INR                                   |
| annual_premium_inr | number           | Yes      | Annual premium in INR                                 |
| members_covered    | string           | Yes      | Free text e.g. "Self, Spouse, 2 children"             |
| expiry_date        | ISO8601 date     | Yes      | Policy expiry / next renewal date                     |
| created_at         | ISO8601 datetime | Yes      | Row creation timestamp                                |
| updated_at         | ISO8601 datetime | Yes      | Last update timestamp                                 |

## Notes

- Insurance adequacy score is part of the Financial Health Score in `/lib/score.ts`.
