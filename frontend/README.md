# OrbitScanner — Next.js frontend

The visitor-facing app for the Orbit Works AI Business Audit Tool.

## Architecture

Two services, deployed separately:

```
Next.js (Vercel)                 Python FastAPI (Railway)
├─ /scan       lead form         ├─ 6 analysis modules
├─ /report     visual report     ├─ orchestrator (asyncio.gather)
├─ auth + session                ├─ Claude + Groq analysis
└─ scan quota                    ├─ Supabase write
                                 └─ Playwright PDF
        └──────── HTTP ────────────────┘
              PYTHON_API_URL
```

**The Python service is the source of truth for audit data.** It runs every
module and writes the row to Supabase itself. Next.js never duplicates that
write — it only reads reports back and layers auth/quota on top.

## Setup

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000
```

The Python service must be running for scans to work:

```bash
cd "../ORBIT WORKS BUSINESS AUDIT"
python api.py                # http://localhost:8000
```

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `PYTHON_API_URL` | server | Base URL of the FastAPI audit service |
| `NEXT_PUBLIC_SUPABASE_URL` | both | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | both | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Quota accounting; bypasses RLS |
| `FREE_SCANS_PER_ACCOUNT` | server | Free scans per account (default 3) |

`SUPABASE_SERVICE_ROLE_KEY` must never carry the `NEXT_PUBLIC_` prefix.

## Design tokens

Carried over from the OrbitWorks AEO landing page so the two read as one product:

- Background `#070B14`, panel `#0A0F1E`, card `#101828`
- Brand crimson `#F3124E`, Orbit cyan `#00D4FF`
- Display font Space Grotesk, body font Manrope
- Score colours: green above 70, amber 40–70, red below 40
