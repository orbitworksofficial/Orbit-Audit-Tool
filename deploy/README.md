# Hosting OrbitScanner on your VPS

Both apps run on one server. Nginx decides what goes where:

```
http://YOUR-IP/            →  Next.js frontend   (port 3000)
http://YOUR-IP/api/audit   →  Python backend     (port 8000)
```

About 20 minutes, start to finish.

---

## Before you start

You need three things:

1. Your VPS **IP address** and **root password** — Hostinger panel → VPS → Overview
2. A **GitHub account**
3. Both `.env` files from your computer (you will paste them in Step 5)

---

## Step 1 — Put your code on GitHub

Open PowerShell **on your Windows machine**:

```powershell
cd "d:\ORBIT WORKS BUSINESS AUDIT"
git add .
git commit -m "Ready for VPS"
```

Now go to [github.com/new](https://github.com/new), create an empty repository,
and copy its URL. Back in PowerShell:

```powershell
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

Your API keys are **not** uploaded — `.gitignore` excludes every `.env` file.
That is why Step 5 exists.

---

## Step 2 — Log in to the server

```powershell
ssh root@YOUR-SERVER-IP
```

Type `yes` if it asks about a fingerprint, then enter your root password.
You are now on the server. Every command below runs there.

---

## Step 3 — Download your code

```bash
apt update && apt install -y git
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git /opt/orbitscanner
```

---

## Step 4 — Backend secrets

```bash
nano "/opt/orbitscanner/ORBIT WORKS BUSINESS AUDIT/.env"
```

Open `ORBIT WORKS BUSINESS AUDIT\.env` on your computer, copy everything, and
paste it into the terminal (right-click pastes in PuTTY; `Ctrl+Shift+V` in
Windows Terminal).

Save and close: `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## Step 5 — Frontend secrets

```bash
nano /opt/orbitscanner/frontend/.env.local
```

Paste your local `frontend\.env.local`, then **change one line**:

```
PYTHON_API_URL=http://127.0.0.1:8000
```

The two apps now live on the same machine, so the frontend talks to the
backend over localhost instead of the internet.

Save and close the same way.

---

## Step 6 — Run the setup script

```bash
bash /opt/orbitscanner/deploy/setup-vps.sh https://github.com/YOUR-USERNAME/YOUR-REPO.git
```

Takes 5–10 minutes. It installs Python, Node, Nginx and a firewall, builds both
apps, and sets them to start automatically whenever the server reboots.

It prints your live URL when it finishes.

---

## Step 7 — Check it works

Open `http://YOUR-SERVER-IP` in your browser.

Then go to `/scan`, run a real audit, and confirm:

- the report appears after 30–60 seconds
- **Download PDF** produces a file
- the row shows up in Supabase → Table Editor → `audit_reports`

---

## Everyday commands

```bash
# Are both apps running?
systemctl status orbit-api orbit-web

# Watch the backend live (useful during a scan)
journalctl -u orbit-api -f

# Restart after editing a .env file
systemctl restart orbit-api orbit-web

# Deploy new code (after pushing to GitHub)
bash /opt/orbitscanner/deploy/update.sh
```

---

## Adding your domain

1. At your domain registrar, add an **A record** pointing to your server IP.
2. Wait a few minutes, then on the server:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

You get a free SSL certificate, `https` is configured automatically, and it
renews itself.

3. In Supabase → Authentication → URL Configuration, set the Site URL to
   `https://yourdomain.com`.

---

## If something breaks

**Site will not load.**
`systemctl status orbit-api orbit-web` shows which app failed.
`journalctl -u orbit-api -n 50` shows why.

**Scans fail straight away.**
Almost always a wrong or missing key in the backend `.env`. Check with
`journalctl -u orbit-api -n 50`, fix the file, then
`systemctl restart orbit-api`.

**Reports do not save.**
`SUPABASE_KEY` must be the **service_role** key, not the anon key. Row Level
Security rejects the anon key and the write fails without an obvious error.

**Scan cuts off around 60 seconds.**
Nginx defaults to a 60s timeout and a scan takes 100–155s. The config sets
300s — if you edited it, make sure `proxy_read_timeout 300s;` is still there,
then `nginx -t && systemctl reload nginx`.

**Frontend build fails on missing environment variables.**
`.env.local` must exist *before* the build, because Next.js bakes
`NEXT_PUBLIC_*` values into the bundle. Create it, then re-run Step 6.

---

## What is running

| Piece | Where | Purpose |
|---|---|---|
| `orbit-api` | port 8000 | Python audit engine |
| `orbit-web` | port 3000 | Next.js site |
| `nginx` | port 80 | Routes traffic, handles timeouts |
| Supabase | cloud | Database (already live) |

Both apps run as systemd services, so they restart on crash and come back
after a reboot without you touching anything.
