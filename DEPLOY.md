# Deploying OrbitScanner

Two services, two platforms, both with free/cheap tiers:

```
Vercel                          Render
└─ frontend/  (Next.js)   →     └─ ORBIT WORKS BUSINESS AUDIT/  (FastAPI)
       Supabase (already live, nothing to deploy)
```

Total time: about 30 minutes. Deploy the **backend first** — the frontend needs
its URL.

---

## Step 0 — Push to GitHub (once)

Both platforms deploy from a repo.

```bash
cd "d:\ORBIT WORKS BUSINESS AUDIT"
git init
git add .
git commit -m "OrbitScanner: audit backend + Next.js frontend"
```

Create an empty repo on github.com, then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

**Before pushing, confirm no secrets are staged:**

```bash
git status --short | grep -i "\.env"     # must print nothing
```

The root `.gitignore` already excludes `.env`, `.env.local`, `venv/` and
`node_modules/`.

---

## Step 1 — Backend on Render

1. [render.com](https://render.com) → sign in with GitHub
2. **New** → **Web Service** → pick your repo
3. Render reads `render.yaml` and fills in the settings. Confirm:
   - Root directory: `ORBIT WORKS BUSINESS AUDIT`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn api:app --host 0.0.0.0 --port $PORT`
   - Instance type: **Free**
4. **Environment** → add each secret from your local
   `ORBIT WORKS BUSINESS AUDIT\.env`:

   | Key | Value |
   |---|---|
   | `GROQ_API_KEY` | from your .env |
   | `ANTHROPIC_API_KEY` | from your .env |
   | `GOOGLE_PAGESPEED_API_KEY` | from your .env |
   | `DATAFORSEO_LOGIN` | from your .env |
   | `DATAFORSEO_PASSWORD` | from your .env |
   | `PERPLEXITY_API_KEY` | from your .env |
   | `SUPABASE_URL` | from your .env |
   | `SUPABASE_KEY` | the **service_role** key |

5. **Create Web Service**. First build takes 2–3 minutes.
6. Verify: open `https://your-service.onrender.com/docs` — you should see the
   FastAPI docs page.

**Copy that URL. The frontend needs it.**

### About the free tier

The free instance sleeps after 15 minutes idle and takes ~50s to wake, so the
first scan after a quiet period feels slow. Everything else works: PDFs are
printed by the visitor's browser, so the 512MB limit is not a problem.

Upgrade to Starter ($7/mo) only if the cold starts bother you.

---

## Step 2 — Frontend on Vercel

1. [vercel.com](https://vercel.com) → sign in with GitHub
2. **Add New** → **Project** → pick the same repo
3. Set **Root Directory** to `frontend` — this matters; the build fails
   otherwise
4. Framework preset: **Next.js** (auto-detected)
5. **Environment Variables** — add all four:

   | Key | Value |
   |---|---|
   | `PYTHON_API_URL` | your Render URL, no trailing slash |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://ykwmqixhqfzuucnnenmv.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from `frontend\.env.local` |
   | `SUPABASE_SERVICE_ROLE_KEY` | from `frontend\.env.local` |

   Never put `NEXT_PUBLIC_` on the service-role key.

6. **Deploy**. Takes 2–3 minutes.

---

## Step 3 — Connect them

**Allow your Vercel domain through CORS.** `api.py` currently uses
`allow_origins=["*"]`, which works but is open to anyone. To tighten it, edit
`api.py`:

```python
allow_origins=["https://your-app.vercel.app"],
```

**Point Supabase at your live domain** so auth emails link correctly:
Supabase → **Authentication** → **URL Configuration** → set Site URL to your
Vercel domain, and add `https://your-app.vercel.app/**` to Redirect URLs.

---

## Step 4 — Test it live

1. Open your Vercel URL
2. Go to `/scan`, run a real audit
3. Confirm the report appears (30–60s)
4. Click **Download PDF**
5. Check the row landed: Supabase → **Table Editor** → `audit_reports`

---

## Costs

| Service | Tier | Cost |
|---|---|---|
| Vercel | Hobby | Free |
| Render | Free | Free |
| Supabase | Free | Free (500MB) |
| **Fixed** | | **$0** |

Plus roughly **$0.12 per scan** in API credits (DataForSEO, Perplexity,
Claude). The rate limits in `frontend/.env.local` — 3 scans per email and 10
per IP per day — are what stop that bill running away.

---

## Troubleshooting

**Scan times out.** Vercel Hobby caps functions at 60s, but an audit takes
30–60s and can exceed it. `maxDuration = 300` in `app/api/scan/route.ts`
requires **Vercel Pro ($20/mo)**. On Hobby, scans of slow sites will fail —
this is the one real limitation of the free setup.

**PDF download.** Handled entirely by the visitor's browser — the button
opens the print dialog, where they choose "Save as PDF". Nothing to configure
on the server, and no Chromium to install.

**Reports don't save.** `SUPABASE_KEY` on Render must be the `service_role`
key. Row Level Security is on, so the anon key is rejected and the write fails
silently.

**Frontend can't reach the backend.** `PYTHON_API_URL` must include
`https://` and must not end in `/`.

---

## Custom domain

Vercel → project → **Settings** → **Domains** → add `orb-itworks.com` (or a
subdomain such as `scan.orb-itworks.com`) and follow the DNS instructions. SSL
is automatic. Update the Supabase Site URL afterwards.
