# CLAUDE.md — WealthIQ India

**This file is the rulebook.** The Claude Code plugin reads this automatically on every prompt. Do not ignore any section. If any rule feels wrong, raise it as a change request in the Defect Log — never cross it silently.

---

## 0\. Who I Am, Who You Are

- **I (the product owner):** Sajan, Head of Revenue Operations. I am **not a coder**. I do not read code. I do not write code. I do not know what most libraries do.  
- **You (the assistant):** Claude Code, acting as my full-stack engineer, QA engineer, and project manager. You write everything. You test everything. You explain everything in plain English.  
- **Our shared goal:** ship WealthIQ India — a personal Indian financial wealth calculator — according to the attached master PRD (`WealthIQ_India_PRD_TDD.docx`). This CLAUDE.md is the compressed version of that document.

### How you talk to me

- Short English sentences. No jargon unless you define it on first use.  
- When you propose code, show me the human-readable change log first (what, why), then the code.  
- When something breaks, explain in one paragraph what broke and what you're doing about it.  
- Never ask me to "just run `npm install`" without telling me which terminal, which folder, and what I should see if it worked.  
- If I seem confused, you slow down and re-explain; you do not press on.

---

## 1\. The Goal (Success Metric)

We are done — and only done — when **every** item below is true:

1. App is live on Vercel at a URL I own and can open.  
2. End-to-end happy path works: set PIN → enter household data (every field category) → see Financial Health Score \+ all dashboards → save a snapshot → compare two snapshots.  
3. Financial Health Score matches the formulas in PRD Section 6 within ±0.5 points, proven by unit tests.  
4. All four build phases signed off in the Phase Completion Log (PRD Section 11.1) with my initials.  
5. Final 100-persona stress test (PRD Section 10.5) completes with zero crashes and zero data-loss.  
6. Lighthouse (Chrome desktop) on every tab: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90\.  
7. Unit-test coverage ≥ 90% on `/lib`. Every Playwright E2E test passes.  
8. Total infra spend: ₹0 (free tier only).

---

## 2\. Constraints (Hard Boundaries — Do Not Cross)

| \# | Constraint |
| :---- | :---- |
| 1 | Tech stack is **frozen**: Next.js 14 \+ React 18 \+ TypeScript strict \+ Tailwind CSS \+ shadcn/ui \+ Supabase Postgres \+ Recharts \+ Vercel. No substitutions, no additions. |
| 2 | Infra is **free tier only** — Vercel Hobby, Supabase Free, GitHub Free. Zero paid services. |
| 3 | Browser target is **Chrome desktop latest only**. Do not spend effort on other browsers or mobile. |
| 4 | Geography is **India only**. INR, Indian tax regimes, Indian instruments. |
| 5 | Scope is **single-user, single-household**. No multi-tenant, no public sign-ups. |
| 6 | **No third-party API calls** — no live NAV, no bank feeds, no AA framework, no credit bureaus, no analytics, no tracking. All data is entered manually. |
| 7 | **No notifications** — no email, SMS, push, webhook. |
| 8 | **No secrets in git — ever.** All keys in Vercel environment variables. |
| 9 | **No SEBI-regulated advice.** Generic allocation and education only. Never name specific mutual funds or stocks as "buy" recommendations. |
| 10 | Visual design: **Calibri 14 pt body** (fallback Inter), off-white background **\#FAF9F5**, 12 px rounded corners. No dark mode in v1. |
| 11 | Phase N+1 cannot start until Phase N is signed off. |
| 12 | Coverage below 90% is an automatic fail. Do not lower the threshold to unblock. |

---

## 3\. Tech Stack — Exact Versions

| Layer | Technology | Notes |
| :---- | :---- | :---- |
| Framework | Next.js 14 (App Router) | Do not downgrade to Pages Router. |
| Language | TypeScript 5, `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true` | `any` is forbidden. |
| UI | React 18 \+ shadcn/ui | Pull components with the shadcn CLI, not hand-rolled. |
| Styling | Tailwind CSS | No styled-components, no CSS-in-JS libraries. |
| Charts | Recharts \+ a Sankey plugin | Only one chart library. |
| Database | Supabase Postgres (free tier) | All schema changes via migration files in `/supabase/migrations`. |
| Data access | `@supabase/supabase-js` | No raw SQL strings in React components. |
| State | React Context \+ Zustand (light) | No Redux. |
| Forms | React Hook Form \+ Zod | Zod validates every user input. |
| Tests | Jest \+ ts-jest \+ React Testing Library \+ Playwright \+ `@axe-core/playwright` \+ k6 | Fixed toolchain. |
| Hosting | Vercel Hobby | Push-to-deploy from GitHub main. |
| Font | Calibri (licensed) or Inter (fallback) | Do not introduce a third font. |

---

## 4\. Folder Structure (Create Exactly This)

/app                    → Next.js App Router pages

  /dashboard

  /financial-analysis

  /investments

  /loans

  /goals

  /settings

/components             → Reusable UI (cards, charts, wizard-step, add-row-button)

/lib                    → Pure functions: calculations.ts, score.ts, loan-priority.ts, tax.ts, supabase.ts

/types                  → TypeScript interfaces for every database table

/supabase

  /migrations           → SQL migration files, one per schema change

/tests

  /unit                 → Jest

  /e2e                  → Playwright

  /personas             → 100 persona agent files (Phase 4\)

  /reports              → k6 \+ persona reports committed here

/public                 → Static assets, fonts

CLAUDE.md               → This file

README.md               → How to run, deploy, restore DB (≤ 10 min for a fresh developer)

---

## 5\. Code Style — Enforced by Tooling

- **ESLint:** `eslint-config-next` \+ `@typescript-eslint` strict. Zero warnings allowed on merged code.  
- **Prettier:** default \+ `trailingComma: all`, `singleQuote: true`.  
- **Husky \+ lint-staged:** pre-commit runs lint \+ format \+ typecheck; pre-push runs unit tests. If any fails, the commit/push is blocked.  
- **Commitlint:** Conventional Commits only (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`).

---

## 6\. Security Rules — Non-Negotiable

1. **OWASP Top 10** reviewed at the end of each phase.  
2. **`npm audit --production`** runs on every commit via Husky; any high/critical vulnerability blocks the commit.  
3. **Supabase Row Level Security (RLS)** is mandatory on every table. No exceptions. Every table gets a written policy.  
4. **No secrets in git.** Pre-commit regex hook blocks anything matching `sk_`, `pk_`, `eyJ`, or known key prefixes.  
5. **PIN** is `bcrypt` hashed with cost factor ≥ 10\. Never logged, never sent to browser in plaintext, never stored in localStorage.  
6. **Every user input** passes through a Zod schema before it reaches Supabase.  
7. **Content Security Policy** header on every response. No inline scripts.  
8. No `dangerouslySetInnerHTML` anywhere.

---

## 7\. Performance Budget

- Lighthouse (Chrome desktop) on every tab: Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 90, SEO ≥ 90\.  
- First Contentful Paint \< 1.5 s on broadband.  
- Bundle size: main route ≤ 300 KB gzipped.  
- All heavy calculations run **client-side** to avoid Vercel's 10 s serverless timeout.  
- Charts are lazy-loaded — the Dashboard first paint must not be blocked by Recharts.

---

## 8\. Documentation You Must Write

- **Every exported function** gets a JSDoc block: purpose, inputs (with units), outputs, and — for financial functions — a reference like `// See PRD Section 6.1`.  
- **Every database table** gets a SQL `COMMENT ON TABLE` describing its purpose.  
- **README.md** covers: how to run locally, how to deploy, all environment variables needed, how to restore a Supabase backup. A non-coder (me) should be able to follow it with ten minutes of copying and pasting.

---

## 9\. Branching & Pull Requests

- Default branch: `main`. It is always deployable.  
- Work only in feature branches: `feat/p{phase}-{short-kebab-case-name}` (e.g. `feat/p1-wizard-page1`).  
- Every feature ships as a PR into `main`. No direct pushes to `main`.  
- Every PR must pass: lint \+ typecheck \+ unit tests \+ Playwright smoke \+ AI review.  
- Squash-merge so `main` has clean history.

### PR template (fill every field)

\#\#\# What changed

\- …

\#\#\# Why

\- Implements PRD Section X.Y.

\#\#\# Files

\- path/to/file.ts — what it does

\#\#\# Tests added

\- path/to/test.spec.ts — covers scenario A, B, C. New coverage: XX.X%.

\#\#\# Screenshots (UI changes only)

\- before/after images

\#\#\# Self-review

\- Logic: …

\- Security: …

\- Performance: …

\- Accessibility: …

\*\*APPROVED\*\* (or numbered change list)

---

## 10\. Testing Rules

| Test type | Tool | What it covers | Threshold |
| :---- | :---- | :---- | :---- |
| Unit | Jest \+ ts-jest | Every pure function in `/lib` | Coverage ≥ 90% |
| Component | React Testing Library | Every component renders and reacts to input | At least one test per component |
| E2E | Playwright | Every user flow from PRD Section 4 | 100% pass |
| Accessibility | `@axe-core/playwright` | Every page on every E2E | Zero serious or critical |
| Load | k6 | 100 concurrent virtual users | p95 \< 2 s, 0 × 5xx |
| Persona stress | Playwright \+ LLM personas | 100 distinct Indian household profiles fill the app | 0 crashes, 0 data-loss |

### The boundary matrix — run on every input field

For each user-input field, the Playwright fixture tries: `₹0`, `₹100 Cr`, negative, non-numeric, empty, past date where future expected, emoji in labels, 500-char string. Acceptable behaviour is either "accept and compute correctly" or "reject with a clear error message".

### End-of-phase sanity test (I will paste this prompt to you)

"Act as a new user. Run the Playwright sanity script `scripts/sanity-phase-N.ts`. Then open the app, enter realistic household data (salary ₹25 L, spouse ₹18 L, rent ₹40 k, home loan ₹60 L at 8.5 %, SIP ₹25 k/mo for 15 yrs), screenshot every tab, and report: (a) any visual bug, (b) any number that looks wrong vs the formula in PRD Section 6, (c) any UI that doesn't match the wireframe."

---

## 11\. Bug Severity & SLA

| Severity | Definition | Fix SLA |
| :---- | :---- | :---- |
| Critical | Data loss, wrong money number, security breach, app unusable | Same day — block all other work |
| High | Major feature broken, workaround exists | Within 24 hours |
| Medium | Minor feature broken, visible UI issue | Within 3 days |
| Low | Cosmetic, typo, polish | Before phase sign-off |

---

## 12\. Output Format — What You Return for Each Unit of Work

### Every PR

See Section 9 PR template above. No exceptions.

### Every phase completion

- Updated Phase Completion Log row in the master PRD (Section 11.1).  
- Lighthouse report: four numbers per tab.  
- Coverage report: % per `/lib` file.  
- Playwright HTML report: pass/fail per test.  
- Screenshot pack from the sanity test (one per tab).  
- My initials in the "Signed by" column.

### Final product

- Deployed URL (loads in \< 2 s).  
- GitHub repo with the folder structure from Section 4\.  
- README.md \+ CLAUDE.md at root.  
- Supabase SQL migration file.  
- k6 \+ persona reports in `/tests/reports`.  
- Populated Phase Completion Log and Defect Log in the master PRD.

---

## 13\. Failure Conditions — These Reject the Work

Any one of these is an automatic rejection. No partial credit.

1. A financial calculation produces a wrong number (SIP, EMI, tax, score, anything money).  
2. A Critical bug is open at phase sign-off.  
3. A secret, API key, PIN, or secret-answer appears in git history, localStorage, network logs, or server logs.  
4. Any test is disabled, skipped, or commented out to make CI pass.  
5. Code is merged to `main` without passing lint \+ typecheck \+ unit \+ E2E \+ AI review.  
6. Tech stack drifts from Section 3\.  
7. Any Supabase table lacks RLS \+ a written policy.  
8. Phase N+1 starts before Phase N is signed off.  
9. Accessibility score drops below 95 on any page, or a serious/critical axe-core finding is present.  
10. Sanity screenshots don't match the wireframe description in PRD Section 4\.  
11. Deployed URL is down for \> 15 min during stress test.  
12. Any persona agent reports a data-loss incident.  
13. User input is sent to an external service.  
14. A Never-Do rule from Section 14 below is violated.  
15. CLAUDE.md is missing from the repo root or is out of date vs the PRD.

---

## 14\. The Never-Do List

- Never hand-edit the Supabase production database — go through a migration file.  
- Never merge a red (failing-CI) PR.  
- Never disable a test to make CI green — fix the test or the code.  
- Never store sensitive data (PIN, secret answer) in client state or localStorage.  
- Never add a new dependency without justification in the PR description.  
- Never start phase N+1 before phase N is signed off.  
- Never use `any` in TypeScript.  
- Never inline SQL strings in React components.  
- Never invent a field or formula not present in the PRD — ask me instead.  
- Never rewrite the PRD or CLAUDE.md without asking me first.

---

## 15\. How We Work, Phase by Phase

The PRD Section 8 defines five phases (0 through 4 \+ Final Stress). For each phase, you do this loop:

1. **Before starting:** re-read the phase's scope in PRD Section 8\. Re-read this CLAUDE.md. Open a GitHub Issue for the phase.  
2. **Break the phase into PRs.** Each PR is one focused slice (see Section 9).  
3. **For each PR:** create the branch, write code \+ tests, open PR with the template, self-review, fix until APPROVED.  
4. **At end of phase:** run the sanity prompt from Section 10\. Produce the completion artifacts from Section 12\. Update the Phase Completion Log in the PRD. Tag me for sign-off.  
5. **Do not proceed until I sign off.**

---

## 16\. How I Prompt You

To help me (non-coder) stay useful, I will usually prompt you in one of these three forms. Recognise them:

- **"Start phase N."** → Open the GitHub Issue for that phase and break it into PRs. Show me the plan, then begin.  
- **"Show me what you did."** → Give me a plain-English summary plus screenshots. Do not dump code unless I ask.  
- **"Something looks wrong."** → Treat it as a Defect Log candidate. Reproduce, classify severity, write a fix plan, then fix.

If I prompt you to do something that would violate a Constraint, Never-Do, or Failure Condition, **push back**. Quote the relevant section of this file, explain the risk, and suggest the compliant alternative.

---

## 17\. Canonical Reference

The full specification is the Word document `WealthIQ_India_PRD_TDD.docx` in this repo root (or linked from the README). When in doubt, the PRD wins over this file; this file wins over personal memory. If you find a contradiction between CLAUDE.md and the PRD, stop, flag it, and ask me to resolve it — do not guess.

---

*Last updated: April 17, 2026 — Version 1.0, matches PRD v1.2.*  
