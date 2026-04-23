**WealthIQ India**

_(working name — subject to change)_

Personal Financial Wealth Calculator — Web Application

**Combined PRD \+ TDD \+ Wireframes \+ Data Model \+ Roadmap**

Version 1.2 • April 17, 2026

Prepared for: Sajan  
Prepared by: Claude (acting as Software Engineer)

# **1\. Document Overview**

This single document is the master specification for the WealthIQ India web application. It combines seven artifacts that are normally separate:

• Product Requirements Document (PRD) — what we are building and why.

• Technical Design Document (TDD) — how we will build it.

• Wireframes (textual) — page-by-page UI description.

• Data Model — database tables, columns, and relationships.

• Roadmap — phased delivery plan from MVP to v2.

• Coding & Testing Guardrails — rules the AI coding agent must follow.

• Phase Completion Log & Defect Log — live trackers updated as work progresses.

## **1.1 Purpose**

WealthIQ India is a single-user, household-aware personal financial wealth calculator that helps an individual capture income, expenses, investments, loans, goals, and insurance; computes a Financial Health Score; and provides intelligent recommendations on which loans to close first and how to allocate investments to reach financial goals.

## **1.2 Intended Audience**

This document is written for a non-coder product owner working with an implementation partner (developer, agency, or AI coding assistant). It is detailed enough that the implementation partner can build the application without further clarification on scope.

## **1.3 Terminology Used**

• PRD — Product Requirements Document: the "what" and "why" of the product.

• TDD — Technical Design Document: the "how", including stack and architecture.

• SRS — Software Requirements Specification: often used interchangeably with PRD.

• Wireframe — a low-fidelity sketch of each screen.

• ERD — Entity Relationship Diagram: a map of database tables and their links.

• MVP — Minimum Viable Product: the smallest version worth shipping.

## **1.4 Goal — The Exact Success Metric**

This project is "done" only when every item below is true. No partial credit.

• The app is live on Vercel at a URL Sajan owns and can open.

• A new user can complete the full happy path end-to-end: set PIN → enter household data (every field category) → see a Financial Health Score and all dashboard widgets → save a snapshot → compare two snapshots.

• The Financial Health Score for any input matches the formulas in Section 6 within ±0.5 points, proven by unit tests.

• All four build phases signed off in the Phase Completion Log (Section 11.1) with your initials.

• Final 100-persona stress test (Section 10.5) completes with zero crashes, zero data-loss incidents, and score bands that behave monotonically (healthier persona → higher score).

• Lighthouse (Chrome desktop): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90 on every tab.

• Unit test coverage ≥ 90% on /lib; every Playwright E2E test passes.

• Total infrastructure spend: ₹0 (free tier only). The only cost is Claude Code plugin usage.

## **1.5 Constraints — Hard Boundaries That Cannot Be Crossed**

If the coding agent (or you) feels a constraint is blocking progress, raise it in the Defect Log as a change request rather than crossing it. Breaking any constraint triggers Section 1.7 (Failure Conditions).

• Tech stack is frozen: Next.js 14 \+ React 18 \+ Tailwind \+ shadcn/ui \+ Supabase \+ Recharts \+ Vercel. No substitutions, no adding a second charting library, no switching to Vue or Svelte.

• Infrastructure is free tier only — Vercel Hobby, Supabase Free, GitHub Free. Zero paid services.

• Browser target: Chrome desktop (latest) only. Do not spend effort on Safari, Firefox, Edge, or any mobile browser.

• Geography: India only. INR, Indian tax regimes, Indian instruments. Do not generalise to other currencies or tax systems.

• Scope: single-user, single-household. No multi-tenant, no sign-ups, no user management.

• No third-party API calls — no live NAV feeds, no bank connections, no Account Aggregator, no credit bureau, no external analytics or tracking. All data is entered manually.

• No notifications of any kind — no email, SMS, push, webhook.

• No secrets in the git repository — ever. All keys go in Vercel environment variables.

• No SEBI-regulated advice. The app gives generic allocation and education only. It does not name specific mutual funds or stocks as "buy" recommendations.

• Visual design: Calibri 14 pt body, off-white background \#FAF9F5, 12 px rounded corners. No dark mode in v1.

• Process: Phase N+1 cannot start until Phase N is signed off in the Phase Completion Log.

• Quality floor: below 90% unit coverage is an automatic fail — do not "temporarily lower the threshold to unblock".

## **1.6 Output Format — The Specific Structure Expected**

Every unit of work produced by the Claude Code plugin must conform to one of the three formats below. Anything outside these formats is rejected.

### **1.6.1 Every Pull Request**

• Branch name: feat/p{phase}-{short-kebab-case-name} (example: feat/p2-loan-priority-engine).

• Commit messages: Conventional Commits (feat:, fix:, test:, chore:, docs:, refactor:).

• PR title: same conventional prefix \+ one-line summary.

• PR description: WHAT changed, WHY, WHICH PRD section number it implements.

• Files changed: a bulleted list in the PR body.

• Tests added: a bulleted list with the new coverage percentage.

• Screenshots: required for any UI change.

• Self-review comment from Claude at the bottom of the PR ending with the literal word APPROVED or a numbered list of required changes.

### **1.6.2 Every Phase Completion**

• Updated row in the Phase Completion Log table (Section 11.1).

• Lighthouse report — four numbers (Performance, Accessibility, Best Practices, SEO) for every tab.

• Coverage report — % per file under /lib, plus overall.

• Playwright HTML report — pass/fail per test.

• Screenshot pack from the end-of-phase sanity test — one per tab, taken with the standard test dataset from Section 10.4.

• Your initials in the "Signed by" column of the log.

### **1.6.3 Final Product Delivery**

• A deployed URL on Vercel that loads in under 2 seconds.

• A GitHub repository containing: /app, /components, /lib, /types, /public, /tests, plus CLAUDE.md and README.md at the root.

• A README.md that lets a fresh developer run the app locally in under 10 minutes.

• A SQL migration file that recreates the empty Supabase schema.

• k6 load test report and 100-persona stress test report, committed to /tests/reports.

• A populated Phase Completion Log and Defect Log in this document.

## **1.7 Failure Conditions — What Makes the Output Unacceptable**

If any of these is true at phase sign-off or final delivery, the work is rejected. No discussion, no partial credit, no "we'll fix it in v2".

• A financial calculation produces a wrong number — SIP future value, EMI, tax outgo, or Financial Health Score deviates from the formula in Section 6\.

• A Critical severity bug is open at phase sign-off time (see SLA table in Section 9.8).

• A secret, API key, PIN, or secret-answer appears in git history, browser localStorage, network logs, or server logs.

• Any test is disabled, skipped, or commented out to make CI pass.

• Code is merged to main without passing lint \+ typecheck \+ unit tests \+ Playwright E2E \+ AI review.

• Tech stack drift — any attempt to swap Recharts for another library, swap Supabase for Firebase, swap Tailwind for styled-components, etc.

• Any Supabase table lacks Row Level Security enabled with a written policy.

• Phase N+1 is started before Phase N is signed off in the Completion Log.

• Accessibility score drops below 95 on any page; a serious or critical axe-core finding is present.

• Sanity test screenshots do not match the wireframe description in Section 4\.

• The deployed URL is unavailable for more than 15 minutes during the final stress test.

• Any persona agent report contains a data-loss incident (input entered then lost).

• User input is transmitted to any external service (violates the no-third-party constraint in Section 1.5).

• A "Never-Do" rule from Section 9.9 is violated.

• CLAUDE.md is missing from the repo root, or is out of date relative to this document.

# **2\. Product Requirements Document (PRD)**

## **2.1 Product Vision**

A clean, desktop-first web application that lets an Indian household enter their complete financial picture on a single screen, receive an objective Financial Health Score, and get intelligent, data-backed suggestions on whether to pre-close loans or invest — with detailed growth projections that help meet future goals such as retirement, a home purchase, or a child's education.

## **2.2 Target User**

• Geography: India only (INR, Indian tax regimes, Indian investment instruments).

• User type: personal user managing household finances (self \+ spouse \+ dependents).

• Technical literacy: non-technical; expects a clean, guided, wizard-like experience.

• Deployment type: single-user application; no multi-tenant or public sign-ups in v1.

## **2.3 Product Goals (what we WILL do)**

1\. Capture complete household financial data across Income, Expenses, Investments, Loans, Insurance, and Goals.

2\. Compute a 0–100 Financial Health Score using a weighted, transparent methodology.

3\. Project investments (SIP, Lumpsum, RD, FD, PPF, NPS, Gold, Real Estate) with inflation-adjusted returns.

4\. Recommend loan closure priority using user-selected strategy (Avalanche, Snowball, or Hybrid).

5\. Save timestamped snapshots (up to 20\) and compare them side-by-side and as deltas.

6\. Compare Old vs New Indian tax regime based on user inputs.

7\. Present all information with rich, interactive charts (12 chart types).

## **2.4 Non-Goals (what we will NOT do in v1)**

• Multi-tenant SaaS — this is a single-user application.

• Bank / Account Aggregator integration — all data is entered manually.

• Live stock or mutual fund NAV feeds — user enters values manually.

• Mobile-native apps or PWA — desktop web browser only.

• Notifications (email / SMS / push) — explicitly out of scope.

• Data export (CSV / PDF) — out of scope unless prioritized in v2.

• Dark mode — out of scope.

• Specific named fund / stock recommendations (regulatory complexity) — user picks instruments manually.

## **2.5 Information Architecture — Tabs**

The application has six top-level tabs in this order:

| \#  | Tab                | Purpose                                                                                                 |
| :-- | :----------------- | :------------------------------------------------------------------------------------------------------ |
| 1   | Dashboard          | Combined financial snapshot, score, and access to saved snapshots.                                      |
| 2   | Financial Analysis | Two-page wizard (Income+Expenses → Investments+Loans) that runs the full analysis and saves a snapshot. |
| 3   | Investments        | Focused investment tracker, SIP/lumpsum projections, goal-planning calculator.                          |
| 4   | Loans              | Focused loan tracker with prioritization engine.                                                        |
| 5   | Goals              | Goal setup (Retirement, Home, etc.) and progress tracking.                                              |
| 6   | Settings           | Profile (household members), tax regime comparison, PIN/passcode, preset rates, reset.                  |

## **2.6 Feature List by Tab**

### **2.6.1 Dashboard Tab**

• Net Worth widget (total assets minus total liabilities).

• Financial Health Score gauge (0–100 with band label).

• Income vs Expenses vs Savings — stacked bar (last 12 months if monthly data exists, else most recent).

• Asset Allocation donut (Equity, Debt, Gold, Real Estate, Cash, Other).

• Debt Snapshot — total outstanding, EMI load, debt-to-income ratio.

• Goal Progress strip — one mini progress bar per active goal.

• Saved Snapshots list — up to 20, with "View", "Compare", and "Delete" actions.

• Quick links to Financial Analysis, Investments, Loans.

### **2.6.2 Financial Analysis Tab**

This is the data-capture wizard. It is structured as two pages with a Next button between them, and a Run Analysis button at the end of page 2\.

**Page 1 — Income & Expenses:**

• Income block: Salary (self), Salary (spouse), Business / Freelance, Rental, Interest / Dividend, Capital Gains, Pension, Other. Every row has an Add (+) button so the user can add custom income sources.

• Expenses block: Rent / EMI (auto-linked from Loans), Utilities, Groceries, Transport, Dining, Healthcare, Education, Entertainment, Subscriptions, Domestic help, Insurance premiums (auto-linked), Other. Add (+) button for custom expenses.

• Frequency toggle per row: Monthly / Quarterly / Annual — system normalises to annual internally.

**Page 2 — Investments & Loans:**

• Investment block: House (Primary \+ Second Home), Land, Gold (physical \+ digital / SGB), Equity Mutual Fund Lumpsum, Equity Mutual Fund SIP, Debt Mutual Fund, FD, RD, PPF, NPS, EPF, Stocks, Bonds, Cash / Savings, Crypto, Other. Add (+) for custom.

• Loan block: Home, Car, Personal, Education, Gold, Credit Card, LAP, Business, Other. Add (+) for custom.

• Run Analysis button — computes score, runs projections, prompts user to Save Snapshot.

### **2.6.3 Investments Tab**

• List view of all investments from Financial Analysis, filterable by asset class.

• SIP Projection calculator: inputs (monthly SIP, years, expected return, step-up % p.a.), outputs (nominal corpus, inflation-adjusted corpus, total invested, gains).

• Lumpsum Projection calculator.

• Goal Planner reverse calculator: user enters target corpus and horizon, system outputs required monthly SIP at each risk profile's expected return.

• Comparison chart: a user-selected plan compared against FD, RD, PPF, and Equity benchmarks.

• Year-by-year growth table for the selected plan.

### **2.6.4 Loans Tab**

• List view of all loans with: principal outstanding, interest rate, EMI, tenure remaining, total interest left.

• Closure priority engine — user picks Avalanche, Snowball, or Hybrid; system ranks loans and explains the ranking.

• Prepayment simulator: enter a lumpsum amount; system shows months saved and interest saved if applied to the top-ranked loan.

• Bubble chart: x \= interest rate, y \= tenure left, bubble size \= outstanding balance, color \= tax-deductible or not.

• Invest-vs-Prepay advisor: compares expected after-tax return of investment against the effective after-tax cost of the loan.

### **2.6.5 Goals Tab**

• Pre-built templates: General, Retirement, Home Purchase, Child Education, Child Marriage, Car, Vacation, Custom.

• Each goal captures: name, target amount, target date, current progress (manually entered or linked to investments), priority.

• Progress visualisation: radial progress ring per goal and a consolidated timeline view.

• On-track indicator: green / amber / red based on required monthly contribution vs current savings rate.

### **2.6.6 Settings Tab**

• Profile: household members (name, relation, age, dependent flag).

• PIN / passcode: set 4-digit PIN; optional secret-question recovery.

• Tax regime comparison: side-by-side Old vs New regime estimated tax outgo based on Income block.

• Preset rate overrides: user can change defaults (Equity 12%, Debt 7%, Gold 8%, Real Estate 8%, PPF 7.1%, NPS 10%, Inflation 6%).

• Risk profile questionnaire: 10 questions; output Conservative / Moderate / Aggressive.

• Reset: wipe all data (with double confirmation).

## **2.7 Financial Health Score Methodology**

The score is a weighted sum of eight dimensions, each scored 0–100, and rolled up into a single 0–100 number. Weights are fixed and transparent:

| Dimension                  | Weight | What is measured                                                 |
| :------------------------- | :----- | :--------------------------------------------------------------- |
| Savings Rate               | 20%    | (Annual Income − Annual Expenses) ÷ Annual Income                |
| Emergency Fund Coverage    | 15%    | Cash \+ Liquid funds ÷ Monthly Expenses (target 6–12 months)     |
| Debt-to-Income Ratio       | 15%    | Total EMIs ÷ Take-home income (lower is better; cap at 40%)      |
| Insurance Adequacy         | 10%    | Term (≥10× annual income) \+ Family health ≥ ₹10L floor          |
| Investment Diversification | 15%    | Herfindahl-style spread across Equity/Debt/Gold/Real Estate/Cash |
| Net Worth Growth           | 10%    | Year-over-year change from prior snapshot                        |
| Goal Progress              | 10%    | Weighted % completion across active goals                        |
| Tax Efficiency             | 5%     | 80C \+ 80D \+ NPS utilisation vs statutory ceilings              |

**Score bands:**

• Poor: 0 – 39

• Fair: 40 – 59

• Good: 60 – 79

• Excellent: 80 – 100

## **2.8 Loan Prioritization Logic**

User picks one of three strategies on the Loans tab. All three produce a ranked list of loans with a one-line explanation per loan:

• Avalanche: sort by interest rate descending (mathematically optimal — saves the most interest).

• Snowball: sort by outstanding balance ascending (psychologically motivating — quick wins first).

• Hybrid (recommended): effective cost \= interest rate × (1 − tax benefit %); then rank descending. Home loan effective rate drops because of Sec 24(b) and 80C benefit; credit card stays near the top.

## **2.9 Invest-vs-Prepay Decision Rule**

For each loan, the app compares the loan's effective after-tax cost with the user's risk-profile expected return:

• If effective loan cost \> expected investment return → recommendation is PREPAY.

• If effective loan cost \< expected investment return by \> 2% → recommendation is INVEST.

• Otherwise → recommendation is SPLIT (hedge).

The rule is displayed with the numbers that produced it, not as a black box.

## **2.10 User Flows (happy path)**

• First-time user: Open app → set 4-digit PIN → complete Profile → (optional) Risk Profile questionnaire → Financial Analysis → Save Snapshot → Dashboard.

• Returning user: Open app → enter PIN → Dashboard → drill into any tab → optionally start a new Financial Analysis to refresh the snapshot.

• Goal-planning flow: Goals → New Goal → set target and date → system computes required monthly SIP at each risk profile.

• Loan review flow: Loans → pick strategy → see ranked list → enter a lumpsum in the Prepayment Simulator → see months/interest saved.

# **3\. Technical Design Document (TDD)**

## **3.1 Architecture Overview**

Three-tier web application deployed on free-tier services:

• Frontend: Next.js 14 (React 18\) hosted on Vercel free tier.

• Backend: Next.js API Routes (serverless functions) on the same Vercel deployment — no separate backend server to manage.

• Database: Supabase Postgres free tier (500 MB, plenty for a personal app).

## **3.2 Tech Stack — Locked**

| Layer              | Technology                       | Why                                                                          |
| :----------------- | :------------------------------- | :--------------------------------------------------------------------------- |
| Frontend framework | Next.js 14 (App Router)          | Free Vercel hosting, React ecosystem, strong SEO not needed but DX is great. |
| UI library         | React 18 \+ shadcn/ui            | Clean, Claude-like components out of the box.                                |
| Styling            | Tailwind CSS                     | Rapid styling, matches shadcn/ui.                                            |
| Charts             | Recharts \+ a Sankey plugin      | Free, React-native, covers all 12 required chart types.                      |
| Database           | Supabase Postgres                | Free tier, SQL, row-level security.                                          |
| Data access        | Supabase JS SDK                  | Typed queries, built-in auth hooks (not using auth in v1).                   |
| State management   | React Context \+ Zustand (light) | Keeps wizard state between pages.                                            |
| Form handling      | React Hook Form \+ Zod           | Validation, simple.                                                          |
| Hosting            | Vercel free tier                 | Push-to-deploy, SSL, custom domain.                                          |
| Source control     | GitHub private repo              | Free.                                                                        |
| Font               | Calibri (fallback: Inter)        | Calibri is not web-safe; served via local @font-face or fallback to Inter.   |

**Note on Calibri:**

Calibri is a proprietary Microsoft font and cannot be freely served on a public website. The recommendation is to license Calibri for web use, OR use Inter / Segoe UI-style fallback which is visually very close. The base font size is 14 px throughout.

## **3.3 Hosting & Infrastructure (all free tier)**

• Vercel Hobby plan — 100 GB bandwidth/month, SSL, CI/CD from GitHub, serverless functions.

• Supabase Free plan — 500 MB database, 1 GB file storage, 50 k monthly active users (we need 1).

• GitHub Free — unlimited private repos.

• Domain: optional; Vercel provides a .vercel.app subdomain for free.

## **3.4 Authentication — Option A**

There is no real login. The app uses a local PIN gate plus Supabase Row Level Security (RLS) with an anonymous API key:

• First launch: user sets a 4-digit PIN and (optionally) a secret question \+ answer for recovery.

• PIN is hashed with bcrypt and stored in the users table (single-row).

• Subsequent launches: user enters PIN; on success, the app reads a session token from browser localStorage and queries Supabase.

• Supabase RLS policies restrict reads/writes to the single anonymous user identity — adequate for a personal app, not suitable if it ever goes multi-tenant.

## **3.5 Security & Privacy**

• HTTPS end-to-end (Vercel-managed SSL).

• PIN bcrypt-hashed; never stored or transmitted in plaintext.

• Supabase at-rest encryption (AES-256).

• DPDP Act (India): personal data is the user's own; no third-party sharing; no analytics tracking.

• No cookies beyond the Supabase session cookie.

• No external API calls in v1 (no live NAV, no bank feeds).

## **3.6 Folder Structure (reference)**

The implementation partner should create the following structure:

• /app → Next.js App Router pages (dashboard, financial-analysis, investments, loans, goals, settings).

• /components → Reusable UI pieces (cards, charts, wizard-step, add-row button).

• /lib → calculations.ts (all formulas), score.ts, loan-priority.ts, tax.ts, supabase.ts.

• /types → TypeScript interfaces for every table.

• /public → Static assets, fonts.

# **4\. Wireframes (textual)**

Each tab is described top-to-bottom as the user would scroll. Visual wireframes are to be produced by the implementation partner in Figma based on these descriptions.

## **4.1 Global Shell**

• Top bar: app logo (left), household name (centre), settings gear (right).

• Left sidebar (fixed, 220 px wide): six tab icons with labels — Dashboard, Financial Analysis, Investments, Loans, Goals, Settings.

• Content area: off-white Claude-like background (\#FAF9F5), 14 px Calibri body text, dark charcoal headings.

• All cards use soft rounded corners (12 px), subtle shadow, and 24 px padding.

## **4.2 Dashboard Wireframe**

• Row 1 (full width): Financial Health Score gauge (left, 50%), Net Worth card (right, 50%).

• Row 2: Income / Expenses / Savings stacked bar (66%) and Asset Allocation donut (33%).

• Row 3: Debt Snapshot card (33%), Goal Progress strip (66%).

• Row 4: Saved Snapshots table — columns: Date, Net Worth, Score, Actions (View / Compare / Delete).

## **4.3 Financial Analysis Wireframe**

Wizard with progress indicator at the top ("Step 1 of 2" / "Step 2 of 2").

**Page 1:**

• Left column: Income section with category rows and an Add (+) row.

• Right column: Expenses section with category rows and an Add (+) row.

• Footer: Next button (primary).

**Page 2:**

• Left column: Investments section with grouped rows by asset class.

• Right column: Loans section with grouped rows by loan type.

• Footer: Back, Run Analysis (primary).

• Post-analysis modal: summary of Score \+ Net Worth, with Save Snapshot and Discard buttons.

## **4.4 Investments Wireframe**

• Top: filter pills (All / Equity / Debt / Gold / Real Estate / Cash).

• Left 60%: list of investments (table view with amount, expected return, current value).

• Right 40%: tabs — SIP Projection, Lumpsum Projection, Goal Planner.

• Below: year-by-year growth table and comparison chart.

## **4.5 Loans Wireframe**

• Top: strategy selector (Avalanche / Snowball / Hybrid).

• Below: ranked loan list with one-line explanations.

• Right side: Bubble chart \+ Prepayment Simulator input.

• Bottom: Invest-vs-Prepay advisor panel.

## **4.6 Goals Wireframe**

• Grid of goal cards, each showing: name, target ₹, target date, radial progress ring, status chip.

• Add Goal (+) tile always visible.

• Clicking a goal opens a detail drawer with required monthly SIP and projection chart.

## **4.7 Settings Wireframe**

• Sections as collapsible cards: Profile, Household, PIN, Tax Regime Compare, Preset Rates, Risk Profile, Danger Zone (Reset).

# **5\. Data Model**

Postgres schema on Supabase. All tables have created_at and updated_at timestamps (omitted below for brevity).

## **5.1 users (single row)**

| Column               | Type    | Notes                               |
| :------------------- | :------ | :---------------------------------- | -------- | ---------- |
| id                   | uuid PK | Single row — the one user           |
| pin_hash             | text    | bcrypt hash of 4-digit PIN          |
| secret_question      | text    | optional                            |
| secret_answer_hash   | text    | bcrypt                              |
| household_name       | text    |                                     |
| tax_regime_preferred | text    | old                                 | new      | compare    |
| risk_profile         | text    | conservative                        | moderate | aggressive |
| preset_rates         | jsonb   | overrides for equity/debt/gold/etc. |

## **5.2 household_members**

| Column       | Type    | Notes |
| :----------- | :------ | :---- | ------ | ----- | ------ | ----- |
| id           | uuid PK |       |
| name         | text    |       |
| relation     | text    | self  | spouse | child | parent | other |
| age          | int     |       |
| is_dependent | bool    |       |

## **5.3 income_items**

| Column    | Type    | Notes                                    |
| :-------- | :------ | :--------------------------------------- | --------- | ------ |
| id        | uuid PK |                                          |
| member_id | uuid FK | → household_members                      |
| category  | text    | salary, rental, business, interest, etc. |
| label     | text    | user-defined label for custom rows       |
| amount    | numeric | in INR                                   |
| frequency | text    | monthly                                  | quarterly | annual |

## **5.4 expense_items**

| Column    | Type    | Notes                                                      |
| :-------- | :------ | :--------------------------------------------------------- | --------- | ------ |
| id        | uuid PK |                                                            |
| category  | text    | rent, utilities, groceries, etc.                           |
| label     | text    |                                                            |
| amount    | numeric |                                                            |
| frequency | text    | monthly                                                    | quarterly | annual |
| is_linked | bool    | true if auto-sourced (e.g., loan EMI or insurance premium) |

## **5.5 investments**

| Column               | Type    | Notes                     |
| :------------------- | :------ | :------------------------ | ------- | ---- | ----------- | ---- | ----- | --- | ----- | ---- | ----- | ---- | ------------- | --- | ------ | ------ |
| id                   | uuid PK |                           |
| asset_class          | text    | equity                    | debt    | gold | real_estate | cash | other |
| instrument_type      | text    | sip                       | lumpsum | fd   | rd          | ppf  | nps   | epf | stock | bond | house | land | gold_physical | sgb | crypto | custom |
| label                | text    | user label                |
| invested_amount      | numeric | cumulative invested       |
| current_value        | numeric | user-entered market value |
| monthly_contribution | numeric | for SIP / RD / PPF / NPS  |
| start_date           | date    |                           |
| expected_return_pct  | numeric | overrides preset if set   |

## **5.6 loans**

| Column                 | Type    | Notes                                            |
| :--------------------- | :------ | :----------------------------------------------- | --- | -------- | --------- | ---- | ----------- | --- | -------- | ------ |
| id                     | uuid PK |                                                  |
| loan_type              | text    | home                                             | car | personal | education | gold | credit_card | lap | business | custom |
| label                  | text    |                                                  |
| principal_outstanding  | numeric |                                                  |
| interest_rate_pct      | numeric |                                                  |
| emi                    | numeric |                                                  |
| tenure_months_left     | int     |                                                  |
| is_tax_deductible      | bool    | true for home loan (24b / 80C), education (80E)  |
| tax_benefit_pct        | numeric | effective saving as % (computed or user-entered) |
| prepayment_penalty_pct | numeric |                                                  |

## **5.7 insurance_policies**

| Column            | Type    | Notes |
| :---------------- | :------ | :---- | ------ | ------- | ---- | ----- |
| id                | uuid PK |       |
| insured_member_id | uuid FK |       |
| policy_type       | text    | term  | health | vehicle | home | other |
| sum_insured       | numeric |       |
| annual_premium    | numeric |       |
| insurer           | text    |       |
| renewal_date      | date    |       |

## **5.8 goals**

| Column                | Type     | Notes    |
| :-------------------- | :------- | :------- | ---------- | ---- | --------- | -------- | --- | -------- | ------ |
| id                    | uuid PK  |          |
| template              | text     | general  | retirement | home | education | marriage | car | vacation | custom |
| name                  | text     |          |
| target_amount         | numeric  |          |
| target_date           | date     |          |
| current_progress      | numeric  |          |
| priority              | int      | 1..5     |
| linked_investment_ids | uuid\[\] | optional |

## **5.9 snapshots**

| Column          | Type        | Notes                                                |
| :-------------- | :---------- | :--------------------------------------------------- |
| id              | uuid PK     |                                                      |
| taken_at        | timestamptz |                                                      |
| net_worth       | numeric     |                                                      |
| financial_score | numeric     | 0–100                                                |
| score_breakdown | jsonb       | the 8 dimension scores                               |
| payload         | jsonb       | full copy of income/expense/investment/loan snapshot |

Retention rule: when a 21st snapshot is saved, the oldest is deleted (FIFO).

## **5.10 Entity Relationships (textual ERD)**

• users 1 — n household_members

• household_members 1 — n income_items

• household_members 1 — n insurance_policies

• users 1 — n expense_items / investments / loans / goals / snapshots

# **6\. Financial Logic & Formulas**

## **6.1 SIP Future Value**

**FV \= P × \[((1 \+ r)^n − 1\) ÷ r\] × (1 \+ r)**

• P \= monthly SIP amount

• r \= monthly return rate (annual return ÷ 12 ÷ 100\)

• n \= number of months

• Inflation-adjusted FV \= FV ÷ (1 \+ inflation)^years

## **6.2 Lumpsum Future Value**

**FV \= P × (1 \+ r)^n where r is annual return, n in years.**

## **6.3 Step-up SIP**

Yearly step-up of x% — compute 12 months at each level, compound each year's closing balance forward.

## **6.4 Reverse Goal Calculator**

Given target FV, years n, and expected monthly rate r, required monthly SIP is:

**P \= FV ÷ { \[((1 \+ r)^n − 1\) ÷ r\] × (1 \+ r) }**

## **6.5 Loan EMI**

**EMI \= \[P × r × (1 \+ r)^n\] ÷ \[(1 \+ r)^n − 1\]**

With P \= principal, r \= monthly rate, n \= months.

## **6.6 Old vs New Tax Regime — v1 assumptions**

• Old regime: slab tax after standard deduction ₹50,000 \+ 80C (₹1.5 L) \+ 80D \+ 24(b) \+ HRA.

• New regime (FY25-26): revised slabs with ₹75,000 standard deduction; most exemptions not allowed.

• App computes tax outgo under both and shows which is lower given user's inputs.

• Slabs are stored in a config file that the implementation partner updates yearly.

## **6.7 Financial Score Scoring Functions**

• Savings Rate: 100 if ≥ 30%, 0 if ≤ 0%, linear in between.

• Emergency Fund: 100 if ≥ 12 months, 50 if 6 months, 0 if 0 months.

• Debt-to-Income: 100 if ≤ 15%, 0 if ≥ 50%, linear in between (inverse).

• Insurance Adequacy: Term 60 pts \+ Health 40 pts; each partial.

• Diversification: 100 × (1 − Herfindahl Index across asset classes).

• Net Worth Growth: 100 if ≥ 15% YoY, 0 if ≤ −10% YoY.

• Goal Progress: weighted average of (current_progress ÷ target_amount).

• Tax Efficiency: sum of (actual ÷ ceiling) across 80C, 80D, NPS, capped at 100\.

# **7\. Charts Catalog**

All 12 charts are rendered using Recharts. Each chart has the following spec.

| \#  | Chart               | Where it lives            | Data                                              |
| :-- | :------------------ | :------------------------ | :------------------------------------------------ |
| 1   | Line chart          | Investments, Goals        | Corpus growth over time                           |
| 2   | Donut / Pie         | Dashboard                 | Asset allocation                                  |
| 3   | Stacked bar         | Dashboard                 | Monthly income vs expenses vs savings             |
| 4   | Waterfall           | Financial Analysis output | Salary → Taxes → Expenses → Savings → Investments |
| 5   | Sankey              | Dashboard                 | Cash flow: inflows → outflows                     |
| 6   | Gauge               | Dashboard                 | Financial Health Score                            |
| 7   | Heatmap             | Investments / Budget      | Month-by-category expense intensity               |
| 8   | Area                | Investments               | Net worth projection over 20 yrs                  |
| 9   | Grouped bar         | Investments               | Actual vs projected returns                       |
| 10  | Bubble              | Loans                     | Rate vs tenure vs balance                         |
| 11  | Range / candlestick | Investments               | Best / worst / expected SIP corpus                |
| 12  | Tree map            | Expenses                  | Hierarchical expense categories                   |
| —   | Radar               | Dashboard                 | Financial health across 8 dimensions              |

# **8\. Delivery Roadmap**

Phased delivery so you can validate each piece before the next.

## **8.1 Phase 0 — Setup (week 1\)**

• GitHub repo created.

• Supabase project \+ schema deployed from SQL migration file.

• Vercel project linked to GitHub.

• Calibri font licensed or Inter fallback decided.

## **8.2 Phase 1 — MVP (weeks 2–4)**

• PIN gate \+ Profile \+ Household members.

• Financial Analysis wizard (both pages, Add buttons, Run Analysis).

• Dashboard with Score gauge, Net Worth, Asset Allocation donut, Stacked bar.

• Snapshots save and list.

## **8.3 Phase 2 — Intelligence (weeks 5–6)**

• Loans tab with Avalanche / Snowball / Hybrid engine and Bubble chart.

• Investments tab with SIP / Lumpsum / Goal Planner and comparison chart.

• Invest-vs-Prepay advisor.

## **8.4 Phase 3 — Goals, Insurance, Tax (week 7\)**

• Goals tab with templates and radial progress.

• Insurance tracking \+ coverage-gap recommendations.

• Old vs New tax regime compare in Settings.

## **8.5 Phase 4 — Polish (week 8\)**

• Remaining charts (Sankey, Waterfall, Heatmap, Tree map, Radar, Range chart).

• Snapshot Compare view (side-by-side \+ delta).

• Risk profile questionnaire.

• QA pass, accessibility check, Lighthouse score.

## **8.6 Deferred to v2 (not built now)**

• Data export (CSV / PDF).

• Notifications (email).

• Mobile responsive / PWA.

• Dark mode.

• Live NAV / price feeds.

• Bank statement CSV import / AA integration.

• Specific mutual fund and stock recommendations (SEBI compliance track).

# **9\. Coding Guardrails**

You will build this in VS Code using the Claude Code plugin. These are the non-negotiable rules for the AI coding agent (and you, when reviewing). Every rule here is enforced by tooling where possible, so it cannot be forgotten.

## **9.1 CLAUDE.md — The Plugin's Rulebook**

The single most important file in the repo. Claude Code reads this automatically on every prompt. Keep it at the repo root. Suggested contents:

• Project purpose (one paragraph from Section 2.1 of this document).

• Tech stack (copy from Section 3.2).

• Folder structure (copy from Section 3.6).

• Code style rules (see 9.2).

• Security rules (see 9.5).

• Never-do list: never commit secrets, never use localStorage for sensitive data, never inline SQL, never skip tests, never disable the linter, never use "any" in TypeScript.

## **9.2 Code Style — Enforced Automatically**

| Tool                 | Purpose                     | Setting                                                           |
| :------------------- | :-------------------------- | :---------------------------------------------------------------- |
| ESLint               | Catch bugs and bad patterns | eslint-config-next \+ @typescript-eslint strict                   |
| Prettier             | Consistent formatting       | default \+ trailingComma: all, singleQuote: true                  |
| TypeScript           | Type safety                 | strict: true, noImplicitAny: true, noUncheckedIndexedAccess: true |
| Husky \+ lint-staged | Run on every commit         | Block the commit if lint/format/typecheck fails                   |
| Commitlint           | Consistent commit messages  | Conventional Commits (feat:, fix:, chore:, test:)                 |

## **9.3 Branching & Pull Request Rules**

• Default branch: main (always deployable).

• Work in feature branches: feat/\<phase\>-\<short-name\> (e.g., feat/p1-wizard-page1).

• Open a PR into main for every feature — no direct pushes to main.

• PR must pass: lint, typecheck, unit tests, Playwright smoke, AI review.

• Squash-merge PRs so main has clean history.

## **9.4 AI Code Review (Option A)**

• Every PR: Claude Code reviews the diff before merge. It checks logic, security, clarity, and test coverage.

• End of each phase: a dedicated AI Audit Pass — prompt Claude Code to re-read every line added during the phase and file issues for bugs, duplication, performance smells, and missing edge cases.

• You only merge when Claude signs off in the PR comment ("APPROVED" or a numbered list of required changes).

## **9.5 Security Guardrails**

• OWASP Top 10 checklist reviewed at end of each phase (injection, broken auth, XSS, etc.).

• npm audit \--production runs on every commit via Husky; high/critical vulnerabilities block the commit.

• Supabase Row Level Security policies are mandatory on every table — no unprotected tables, ever.

• No secrets in the repo. All keys in Vercel environment variables. A pre-commit hook blocks commits containing strings that look like keys (regex on pk\_, sk\_, eyJ, etc.).

• PIN is bcrypt-hashed (cost factor ≥ 10). Never logged, never sent to the browser in plaintext.

• All user input validated with Zod before it reaches the database.

• Content Security Policy header set on every response; no inline scripts.

## **9.6 Performance Guardrails**

• Lighthouse score targets (Chrome desktop): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90\.

• First Contentful Paint \< 1.5 s on a standard broadband connection.

• Every calculation-heavy function runs client-side (so we don't hit Vercel's 10-second function timeout).

• Charts lazy-loaded so the Dashboard first paint isn't blocked by Recharts.

• Bundle size budget: main route ≤ 300 KB gzipped.

## **9.7 Documentation Rules**

• Every exported function has a JSDoc block describing inputs, outputs, units, and — for financial functions — the formula reference (e.g., "// See Section 6.1 of PRD").

• Every database table has a comment describing its purpose.

• README.md covers: how to run locally, how to deploy, environment variables needed, how to restore the database.

## **9.8 Bug Severity & Fix SLAs**

| Severity | Definition                                                   | Fix SLA                            |
| :------- | :----------------------------------------------------------- | :--------------------------------- |
| Critical | Data loss, wrong money number, security breach, app unusable | Same day — block all other work    |
| High     | Major feature broken but workaround exists                   | Within 24 hours                    |
| Medium   | Minor feature broken, visible UI issue                       | Within 3 days                      |
| Low      | Cosmetic, typo, nice-to-have polish                          | Within the phase / before sign-off |

## **9.9 The Never-Do List**

• Never hand-edit the production Supabase database — always go through a migration file.

• Never merge a red (failing-CI) PR.

• Never disable a test to make CI green — fix the test or fix the code.

• Never store sensitive data (PIN, secret answer) in client state or localStorage.

• Never add a new dependency without a justification comment in the PR.

• Never launch phase N \+ 1 before phase N is signed off in the Phase Completion Log (Section 11).

# **10\. Testing Guardrails**

Since you are not a tester, Claude does the heavy lifting. The guardrails below define what "tested" means so nothing slips through.

## **10.1 Test Stack**

| Layer             | Tool                                | What it tests                                                                                             |
| :---------------- | :---------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| Unit              | Jest \+ ts-jest                     | Pure calculation functions (SIP, EMI, score, tax) — every formula in Section 6\.                          |
| Component         | React Testing Library               | Each UI component renders and reacts to user input.                                                       |
| End-to-end (E2E)  | Playwright                          | Full browser flows — "a user sets a PIN, completes the wizard, saves a snapshot, compares two snapshots." |
| Accessibility     | axe-core (via @axe-core/playwright) | Every page checked for WCAG issues on every E2E run.                                                      |
| Load / stress     | k6                                  | 100 concurrent simulated users hitting the app.                                                           |
| AI-persona stress | Playwright \+ Claude Code           | 100 LLM-driven personas each filling in the app differently.                                              |

## **10.2 Coverage Target**

• Unit test coverage: ≥ 90% of /lib (all calculation files).

• Component coverage: every component under /components has at least one rendering test.

• CI fails if coverage drops below the threshold (Jest \--coverage \--coverage-threshold).

## **10.3 End-to-End Coverage — Every Flow**

You said "test everything." Playwright tests exist for every flow visible in the wireframes:

• First-time PIN setup \+ secret question.

• Returning-user PIN entry (correct, incorrect, 3 incorrect attempts lockout).

• PIN recovery via secret question.

• Add, edit, delete a household member.

• Financial Analysis Page 1 — add/edit/delete every income and expense category, plus custom Add (+) row.

• Financial Analysis Page 2 — every investment type, every loan type, plus custom Add (+).

• Run Analysis → Score shown → Save Snapshot.

• Dashboard — every widget renders correctly for (a) empty state, (b) small numbers, (c) large numbers in crores.

• Investments tab — SIP, Lumpsum, Goal Planner, year-by-year table, comparison chart.

• Loans tab — switch strategies, prepayment simulator, Invest-vs-Prepay advisor.

• Goals tab — create goal (each of the 8 templates), edit, delete, on-track/off-track states.

• Settings tab — every toggle and text input.

• Snapshot compare — side-by-side view \+ delta view.

• 20-snapshot FIFO cap — saving the 21st snapshot deletes the oldest.

• Reset — double confirmation then full wipe.

## **10.4 End-of-Phase Sanity Test — Run by Claude**

After every phase, you open a fresh Claude Code session and paste this prompt:

_"Act as a new user. Run the Playwright sanity script scripts/sanity-phase-N.ts. Then open the app, enter realistic household data (salary ₹25L, spouse ₹18L, rent ₹40k, home loan ₹60L at 8.5%, SIP ₹25k/mo for 15 yrs), screenshot every tab, and report: (a) any visual bug, (b) any number that looks wrong vs the formula in PRD Section 6, (c) any UI that doesn't match the wireframe."_

The sanity script is an automated smoke test; the screenshot review is the human-style check Claude adds on top.

## **10.5 Final Stress Test — Load \+ AI Personas (Option C)**

Once Phase 4 is complete, we run two stress tests in sequence:

### **10.5.1 Load Test (k6)**

• 100 concurrent virtual users ramp up over 1 minute.

• Each VU performs: PIN login → Dashboard load → Financial Analysis submit → Snapshot save.

• Pass criteria: p95 latency \< 2 s, zero 5xx errors, Supabase connection pool not exhausted.

### **10.5.2 AI-Persona Test (100 agents)**

• 100 Playwright browser sessions, each driven by a Claude Code agent with a unique persona.

• Persona library: young salaried Bangalore techie, Mumbai DINK couple, retired Kolkata pensioner, Delhi business owner with credit-card debt, Chennai NRI with rental income, etc. — 100 distinct profiles authored up front.

• Each agent: fills the entire app with persona-consistent data, runs analysis, and returns a structured report with any observation that seems wrong (e.g., "my retirement goal shows as on-track but I have no emergency fund — the score should have penalised me").

• Pass criteria: zero crashes, zero data-loss incidents, score bands behave monotonically (higher score ↔ healthier persona).

## **10.6 Every-Field Boundary Matrix (Option B)**

Beyond happy-path data, we run a boundary matrix test that exercises every input field with:

• Zero value (₹0).

• Very large value (₹100 Cr).

• Negative value — should be rejected with a clear error.

• Non-numeric input — should be rejected.

• Empty / blank — should be either optional or required with a clear message.

• Past date where a future date is expected — should be rejected.

• Unicode / emoji in label fields — should be preserved.

• Very long string (500 chars) in label fields — should be truncated gracefully.

Automated via a Playwright fixture that iterates a data-driven matrix.

## **10.7 Accessibility & Regression**

• Every E2E test runs axe-core on every page. Serious or critical a11y issues fail the build.

• Regression rule: the entire test suite (unit \+ component \+ E2E \+ a11y) runs at the end of each phase, and before every main-branch merge.

## **10.8 Browser Target**

Chrome latest, desktop only. Other browsers documented as "not supported" in README until v2.

## **10.9 What Claude Does vs What You Do**

| Activity                                  | Who                                          |
| :---------------------------------------- | :------------------------------------------- |
| Write unit / component / E2E tests        | Claude Code                                  |
| Run tests in CI (GitHub Actions)          | Automated on every push                      |
| End-of-phase sanity test with screenshots | Claude Code (you paste the prompt from 10.4) |
| Review screenshots \+ sign off phase      | You                                          |
| Final load test (k6)                      | Claude Code                                  |
| Final 100-persona stress test             | Claude Code                                  |
| Read persona reports \+ sign off          | You                                          |

# **11\. Phase Completion Log**

Update this table at the end of every phase. A phase is not "done" until every column has a value and you sign the last column.

**Completion criteria per phase (all must be true):**

• All features for the phase are built and merged to main.

• Unit test coverage ≥ 90% for files touched in the phase.

• All Playwright E2E tests pass.

• Lighthouse: Performance ≥ 90, Accessibility ≥ 95\.

• End-of-phase AI audit pass complete — all Critical/High issues fixed.

• End-of-phase sanity test (Section 10.4) complete — screenshots reviewed by you.

• Your signature in the last column of the table below.

## **11.1 Completion Tracker**

| Phase                             | Status      | Date | Coverage | E2E | Lighthouse | Sanity | Signed by |
| :-------------------------------- | :---------- | :--- | :------- | :-- | :--------- | :----- | :-------- |
| Phase 0 — Setup                   | Not started | —    | —        | —   | —          | —      | —         |
| Phase 1 — MVP                     | Not started | —    | —        | —   | —          | —      | —         |
| Phase 2 — Intelligence            | Not started | —    | —        | —   | —          | —      | —         |
| Phase 3 — Goals / Insurance / Tax | Not started | —    | —        | —   | —          | —      | —         |
| Phase 4 — Polish                  | Not started | —    | —        | —   | —          | —      | —         |
| Final — Stress Test               | Not started | —    | —        | —   | —          | —      | —         |

_Claude will mark "Complete" with the dated results once each phase is verified, then you add your initials in the last column._

# **12\. Defect Log**

Running log of every bug found. Claude appends to this during testing; you (or Claude) update Status when it's fixed.

We use GitHub Issues as the system of record, but this table is the single human-readable summary so you always know where we stand.

| ID  | Date found | Severity | Phase | Short description     | Status | Fixed on |
| :-- | :--------- | :------- | :---- | :-------------------- | :----- | :------- |
| —   | —          | —        | —     | No defects logged yet | —      | —        |

_Severity key: Critical \= money/data/security; High \= major feature broken; Medium \= minor bug; Low \= cosmetic. (See Section 9.8 for SLAs.)_

# **13\. Risks, Assumptions & Open Questions**

## **13.1 Risks**

• Calibri licensing — proprietary font; public hosting requires a license. Mitigation: use Inter or Segoe UI fallback.

• Supabase free tier DB size (500 MB) — ample for now, but snapshots with full payload JSON could grow. Mitigation: 20-snapshot FIFO cap.

• Vercel free tier function timeout (10 s) — long calculations on big input. Mitigation: client-side computation for all projections.

• Manual data entry fatigue — user loses motivation. Mitigation: Add buttons, minimal required fields, smart defaults.

• DPDP compliance if the app is ever shared — v1 is personal only. Mitigation: document this boundary; revisit if sharing.

• Return assumptions are not guarantees — visible disclaimer on every projection screen.

## **13.2 Assumptions**

• The user will run a full Financial Analysis at least quarterly to keep data fresh.

• Preset return rates (Equity 12%, Debt 7%, Gold 8%, Real Estate 8%, PPF 7.1%, NPS 10%, Inflation 6%) are reasonable long-term averages.

• Tax slabs are updated once a year by the implementation partner when the Union Budget changes them.

• All INR amounts are displayed with Indian digit grouping (₹12,34,567) and short forms (₹1.2 Cr, ₹45.6 L).

## **13.3 Open Questions Still to Close**

8\. Final app name — "WealthIQ India" is a placeholder. Alternatives: ArthaIQ, FinCompass, NetWorthy, PaisaPlan, SankhyaWealth.

9\. Calibri licensing — will you license it, or accept Inter as the live font?

10.Should the PIN have a secret-question recovery, or no recovery at all?

11.In case of dispute between snapshot's tax_regime and current tax_regime in Settings — which one drives the Dashboard's displayed tax?

12.When a user deletes a loan that is auto-linked to an expense row, should the expense row delete too, or become manual?

# **14\. Glossary**

| Term    | Meaning                                                                   |
| :------ | :------------------------------------------------------------------------ |
| SIP     | Systematic Investment Plan — a recurring monthly mutual fund investment.  |
| RD / FD | Recurring Deposit / Fixed Deposit — bank savings instruments.             |
| PPF     | Public Provident Fund — 15-yr government-backed tax-free instrument.      |
| NPS     | National Pension System — retirement scheme with tax benefit under 80CCD. |
| EPF     | Employees' Provident Fund — employer-matched retirement saving.           |
| SGB     | Sovereign Gold Bond — RBI-issued gold-linked bond.                        |
| ELSS    | Equity-Linked Savings Scheme — tax-saving mutual fund (80C).              |
| LAP     | Loan Against Property — secured loan on real estate.                      |
| DPDP    | Digital Personal Data Protection Act (India).                             |
| AA      | Account Aggregator — RBI-regulated consented data framework.              |
| NAV     | Net Asset Value — daily price of a mutual fund unit.                      |
| RLS     | Row Level Security — Postgres feature to restrict row access.             |
| MVP     | Minimum Viable Product.                                                   |
| ERD     | Entity Relationship Diagram.                                              |

# **15\. What Was Missing from Your Original Ask**

For your reference — these are the gaps I plugged while scoping this document:

• A name for the artifact you wanted (it's called a combined PRD \+ TDD).

• A Goals module — your "3 Cr in 5 years" question belongs here, not in Investments.

• An Emergency Fund dimension — every serious financial plan is built on this first.

• An Insurance module with coverage-gap advice.

• A Tax Planning module (Old vs New regime).

• A Net Worth trend tracker via snapshots.

• A Budget / monthly-tracking thought (you chose one-time plan for v1).

• A Risk Profile questionnaire to drive investment suggestions.

• An explicit Financial Score methodology with weights.

• An Invest-vs-Prepay decision rule that compares after-tax yields.

• Data-model design — nine Postgres tables.

• A phased roadmap so you can ship in 8 weeks, not 8 months.

• Explicit Non-Goals — so the implementation partner doesn't sneak scope in.

• Risks and Open Questions — things we still need to close.

_— End of document —_
