# WealthIQ India

Personal Indian household financial wealth calculator.

## What this is

A single-user web app that calculates your Financial Health Score based on income, expenses, investments, loans, and goals — all entered manually. No bank feeds. No external data. India/INR only.

---

## How to run locally (10 minutes)

### Step 1 — Prerequisites

You need Node.js installed. Check by opening a terminal and typing:
```
node --version
```
It should print a version number like `v20.x.x`. If not, download it from nodejs.org.

### Step 2 — Get the code

Open a terminal, then type:
```
git clone https://github.com/ssajanis/WealthIQ.git
cd WealthIQ
```

### Step 3 — Install dependencies

```
npm install
```

You should see a message like "added 500 packages". If you see red errors, stop and ask for help.

### Step 4 — Set environment variables

Copy the example file:
```
cp .env.local.example .env.local
```

Open `.env.local` in any text editor and fill in the two values (get these from the Supabase dashboard → Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 5 — Start the app

```
npm run dev
```

Open your browser and go to: **http://localhost:3000**

You should see the WealthIQ home page.

---

## How to deploy to Vercel

1. Push your changes to GitHub (`git push origin main`).
2. Vercel automatically picks up the push and deploys within ~2 minutes.
3. Open your Vercel dashboard to see the live URL.

First-time setup:
- Go to vercel.com → Add New Project → Import from GitHub → select `WealthIQ`.
- Under Environment Variables, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Environment variables

| Variable | Where to find it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public key | Yes |

**Never put these in code or commit them to git.**

---

## How to restore the database

All database structure lives in `/supabase/migrations`. To apply to a fresh Supabase project:

1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref vbuurnummozdgfctelcn`
3. Push migrations: `supabase db push`

---

## How to run tests

```
npm test              # unit tests (Jest)
npm run test:e2e      # end-to-end tests (requires app running on localhost:3000)
```

---

## Tech stack

Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Recharts · Vercel
