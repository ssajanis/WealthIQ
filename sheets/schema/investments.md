# Tab: investments

Stores all household investments and savings instruments.

## Columns

| Column                     | Type             | Required | Description                                                                                                                                          |
| -------------------------- | ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                         | string           | Yes      | Unique row ID (UUID)                                                                                                                                 |
| instrument                 | enum             | Yes      | `mutual_fund_equity` / `mutual_fund_debt` / `mutual_fund_hybrid` / `ppf` / `epf` / `nps` / `fd` / `rd` / `stocks` / `gold` / `real_estate` / `other` |
| name                       | string           | Yes      | User label e.g. "SBI Nifty 50 Index Fund"                                                                                                            |
| investment_type            | enum             | Yes      | `sip` / `lumpsum` / `recurring`                                                                                                                      |
| monthly_amount_inr         | number           | No       | Monthly SIP or recurring amount (for `sip` / `recurring` types)                                                                                      |
| current_value_inr          | number           | Yes      | Current market / book value in INR                                                                                                                   |
| expected_annual_return_pct | number           | Yes      | Expected annual return % (e.g. 12 for 12%)                                                                                                           |
| start_date                 | ISO8601 date     | Yes      | When this investment started                                                                                                                         |
| created_at                 | ISO8601 datetime | Yes      | Row creation timestamp                                                                                                                               |
| updated_at                 | ISO8601 datetime | Yes      | Last update timestamp                                                                                                                                |

## Notes

- No live NAV data — all values are entered manually.
- Do not store specific fund names as buy recommendations (SEBI constraint).
