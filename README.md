# RHTP Tracker — Deployment Guide

## What this does
- Displays live data for all 50 states' Rural Health Transformation Program updates
- Automatically re-scans every night at **2:00 AM UTC** using Vercel Cron
- Manually triggerable via the "Update All Now" button
- Each update searches CMS.gov, HHS.gov, and every state's DOH website using Claude AI + web search
- Results are cached in Vercel KV (Redis) so the page loads instantly

---

## Step-by-step deployment

### 1. Prerequisites
- Node.js 18+ installed locally
- A [Vercel account](https://vercel.com) (free tier works)
- A [GitHub account](https://github.com)
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

---

### 2. Push to GitHub

```bash
cd rhtp-tracker
git init
git add .
git commit -m "Initial RHTP tracker"
gh repo create rhtp-tracker --public --push
# or: create repo on github.com, then git remote add origin ... && git push
```

---

### 3. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select `rhtp-tracker`
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** (it will fail — that's fine, we need to add env vars next)

---

### 4. Add Vercel KV (free Redis database)

1. In your Vercel project dashboard → **Storage** tab
2. Click **Create Database** → choose **KV**
3. Name it `rhtp-kv`, region closest to you → **Create**
4. Click **Connect to Project** → select your project
5. Vercel automatically adds `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN` to your env vars

---

### 5. Add environment variables

In Vercel project → **Settings** → **Environment Variables**, add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your Anthropic API key) |
| `CRON_SECRET` | any random string, e.g. `mysecrettoken123` |

---

### 6. Redeploy

```bash
# Trigger a fresh deploy (or just push any commit)
git commit --allow-empty -m "trigger deploy"
git push
```

Or click **Redeploy** in the Vercel dashboard.

---

### 7. Run the first update

1. Open your live site (e.g. `https://rhtp-tracker.vercel.app`)
2. Click **"Update All Now"**
3. Wait 5–8 minutes — progress bar shows current state being scanned
4. After that, every night at 2:00 AM UTC, it runs automatically

---

## File structure

```
rhtp-tracker/
├── pages/
│   ├── index.jsx              # Frontend UI
│   └── api/
│       ├── data.js            # Returns cached data to frontend
│       ├── manual-update.js   # Triggered by "Update All Now" button
│       └── cron/
│           └── nightly.js     # Called by Vercel Cron at 2AM UTC
├── lib/
│   ├── states.js              # All 50 states data + award amounts
│   ├── storage.js             # Vercel KV read/write helpers
│   └── claude.js              # Claude API + prompt helpers
├── vercel.json                # Cron schedule definition
└── package.json
```

---

## Cron schedule

`vercel.json` defines:
```json
{ "path": "/api/cron/nightly", "schedule": "0 2 * * *" }
```
This runs at **2:00 AM UTC** daily (10 PM ET / 7 PM PT).
To change the time, edit the cron expression. [crontab.guru](https://crontab.guru) is helpful.

---

## Cost estimate

| Service | Free tier | Expected usage |
|---------|-----------|----------------|
| Vercel Hobby | Free | Cron + serverless functions |
| Vercel KV | 30,000 req/mo free | ~150 reads/day = ~4,500/mo |
| Anthropic API | Pay per use | ~51 calls/night × $0.003 ≈ **$0.15/night** |

Total: ~**$4–5/month** in Anthropic API costs.

---

## Troubleshooting

**Cron not running?**
- Vercel Cron requires the **Pro plan** for schedules under 1/day. The free Hobby plan supports daily crons.
- Check **Vercel dashboard → Logs → Cron Jobs** to see execution history.

**"Unauthorized" on manual update?**
- Make sure `CRON_SECRET` env var matches what's set in Vercel.

**KV errors?**
- Confirm Vercel KV is connected to your project under the **Storage** tab.
- Env vars `KV_REST_API_URL` and `KV_REST_API_TOKEN` must be present.
