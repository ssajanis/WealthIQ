# Tab: loans

Stores all household liabilities (loans, credit cards, etc.).

## Columns

| Column                   | Type             | Required | Description                                                                             |
| ------------------------ | ---------------- | -------- | --------------------------------------------------------------------------------------- |
| id                       | string           | Yes      | Unique row ID (UUID)                                                                    |
| loan_type                | enum             | Yes      | `home_loan` / `car_loan` / `personal_loan` / `education_loan` / `credit_card` / `other` |
| lender_name              | string           | Yes      | e.g. "HDFC Bank", "SBI"                                                                 |
| principal_inr            | number           | Yes      | Original loan amount in INR                                                             |
| outstanding_inr          | number           | Yes      | Current outstanding balance in INR                                                      |
| annual_interest_rate_pct | number           | Yes      | Annual interest rate % (e.g. 8.5 for 8.5%)                                              |
| emi_inr                  | number           | Yes      | Monthly EMI in INR                                                                      |
| tenure_remaining_months  | number           | Yes      | Months left to repay                                                                    |
| start_date               | ISO8601 date     | Yes      | Loan disbursement date                                                                  |
| created_at               | ISO8601 datetime | Yes      | Row creation timestamp                                                                  |
| updated_at               | ISO8601 datetime | Yes      | Last update timestamp                                                                   |

## Notes

- EMI is captured here; do not also add it to the `expenses` tab.
- Loan priority score is computed in `/lib/loan-priority.ts`.
