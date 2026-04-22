# Tab: goals

Stores the household's financial goals.

## Columns

| Column              | Type             | Required | Description                                                                                      |
| ------------------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------ |
| id                  | string           | Yes      | Unique row ID (UUID)                                                                             |
| goal_name           | string           | Yes      | e.g. "Retirement", "Children's Education", "Foreign Holiday"                                     |
| goal_type           | enum             | Yes      | `retirement` / `education` / `home_purchase` / `vehicle` / `emergency_fund` / `travel` / `other` |
| target_amount_inr   | number           | Yes      | Target corpus in INR                                                                             |
| current_savings_inr | number           | Yes      | Amount already saved towards this goal                                                           |
| target_date         | ISO8601 date     | Yes      | When the goal must be achieved                                                                   |
| monthly_sip_inr     | number           | No       | Monthly SIP allocated to this goal                                                               |
| expected_return_pct | number           | Yes      | Expected annual return on savings for this goal                                                  |
| created_at          | ISO8601 datetime | Yes      | Row creation timestamp                                                                           |
| updated_at          | ISO8601 datetime | Yes      | Last update timestamp                                                                            |

## Notes

- Goal projections are computed in `/lib/calculations.ts`.
