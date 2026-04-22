# Tab: expenses

Stores monthly household expenses by category.

## Columns

| Column             | Type             | Required | Description                                                                                                          |
| ------------------ | ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| id                 | string           | Yes      | Unique row ID (UUID)                                                                                                 |
| category           | enum             | Yes      | `housing` / `food` / `transport` / `utilities` / `healthcare` / `education` / `entertainment` / `clothing` / `other` |
| description        | string           | Yes      | Free-text label e.g. "Monthly rent", "School fees"                                                                   |
| monthly_amount_inr | number           | Yes      | Monthly spend in INR                                                                                                 |
| is_fixed           | boolean          | Yes      | True if this is a fixed cost (rent, EMI) vs variable                                                                 |
| created_at         | ISO8601 datetime | Yes      | Row creation timestamp                                                                                               |
| updated_at         | ISO8601 datetime | Yes      | Last update timestamp                                                                                                |

## Notes

- EMIs are captured in the `loans` tab, not here.
- All amounts are monthly. Annual = monthly × 12 in calculations.
