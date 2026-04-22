# WealthIQ India

Personal Indian financial wealth calculator. Runs locally on your computer — no cloud, no subscription, no data shared anywhere except your own private Google Sheet.

---

## What you need before starting

1. A Google account (Gmail)
2. Node.js installed (already done if you're reading this)
3. About 10 minutes

---

## Step 1 — Create your Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it `WealthIQ`.
3. Copy the Sheet ID from the URL. The URL looks like:
   `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`**`/edit`
   The bold part is your Sheet ID. Save it — you'll need it in Step 3.

---

## Step 2 — Create a Google Service Account

A Service Account is a special Google account that lets this app read and write your Sheet without needing your password.

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (call it `WealthIQ`).
3. In the left menu go to **APIs & Services → Library**. Search for "Google Sheets API" and click **Enable**.
4. Go to **APIs & Services → Credentials**. Click **Create Credentials → Service Account**.
5. Give it a name (e.g. `wealthiq-bot`). Click **Done**.
6. Click the service account email you just created. Go to the **Keys** tab. Click **Add Key → Create new key → JSON**. A `.json` file will download.
7. Open that `.json` file in Notepad. You'll need its contents in Step 3.
8. Back in the Service Account list, copy the email address (looks like `wealthiq-bot@your-project.iam.gserviceaccount.com`).
9. Go back to your Google Sheet. Click **Share** (top right). Paste the service account email and give it **Editor** access.

---

## Step 3 — Set up environment variables

In the `wealthiq` folder, create a file called `.env.local` (copy from `.env.local.example`):

```
GOOGLE_SERVICE_ACCOUNT_JSON=<paste the entire contents of the JSON file here as one line>
SHEET_ID=<your Sheet ID from Step 1>
PIN_HASH_SECRET=<any long random password you make up — at least 32 characters>
```

**Important:** The JSON file has line breaks inside the `private_key` field. You need to keep those as `\n` (two characters: backslash + n) when pasting into one line. The easiest way is to open the JSON in a text editor and use Find & Replace to replace every actual newline inside the `private_key` value with `\n`.

---

## Step 4 — Run the app

Open a terminal, navigate to the `wealthiq` folder, and run:

```bash
npm run dev
```

You should see:

```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

Open Chrome and go to [http://localhost:3000](http://localhost:3000). The app will ask you to set a PIN on first launch.

---

## Environment variables reference

| Variable                      | Where to get it                               | Example                                        |
| ----------------------------- | --------------------------------------------- | ---------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The downloaded `.json` key file (as one line) | `{"type":"service_account",...}`               |
| `SHEET_ID`                    | Google Sheet URL                              | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms` |
| `PIN_HASH_SECRET`             | Make one up — 32+ random characters           | `xK9#mQ2...`                                   |

---

## How to restore data from a Sheet backup

Your data lives in the Google Sheet. If you switch computers or lose your local files:

1. Clone or copy this project to the new computer.
2. Follow Steps 2–4 above, pointing to the same Sheet ID.
3. All your data will be there — no restore needed.

---

## Running tests

```bash
npm run test:unit        # Unit tests (Jest)
npm run test:e2e         # End-to-end tests (Playwright) — requires app running
```

---

## Tech stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · shadcn/ui · Google Sheets API · Recharts
