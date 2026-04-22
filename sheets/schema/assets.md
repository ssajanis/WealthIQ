# Tab: assets

Stores physical and illiquid assets (property, gold, vehicles, etc.).

## Columns

| Column             | Type             | Required | Description                                  |
| ------------------ | ---------------- | -------- | -------------------------------------------- |
| id                 | string           | Yes      | Unique row ID (UUID)                         |
| asset_type         | enum             | Yes      | `property` / `gold` / `vehicle` / `other`    |
| description        | string           | Yes      | e.g. "2BHK Flat - Andheri", "Gold jewellery" |
| current_value_inr  | number           | Yes      | Estimated current market value in INR        |
| purchase_value_inr | number           | Yes      | Original purchase price in INR               |
| purchase_date      | ISO8601 date     | Yes      | When this asset was acquired                 |
| created_at         | ISO8601 datetime | Yes      | Row creation timestamp                       |
| updated_at         | ISO8601 datetime | Yes      | Last update timestamp                        |

## Notes

- Values are manually entered; no live price feeds.
- Net worth = (investment values + asset values) − outstanding loan balances.
