# Complete VPS Guide — from zero to a live website

Written for someone who has never used a VPS. Every command is copy-paste.
No prior Linux knowledge assumed.

---

## What a VPS actually is

A VPS is a computer that lives in a data centre and never turns off. You
control it by typing commands instead of clicking — there is no desktop, no
mouse, no windows. Just a black screen where you type.

That sounds harder than it is. You will type about 15 commands total, and I
have written every one of them below.

**Why you need one:** your Python backend takes 100–155 seconds to run a scan.
Shared hosting kills anything that slow, and only supports PHP anyway. A VPS
has no such limits because the whole machine is yours.

---

## What we are building

```
        Someone visits scan.yourdomain.com
                      │
                      ▼
              ┌───────────────┐
              │     Nginx     │   the receptionist: reads the address
              │   (port 80)   │   and sends each request to the right app
              └───────┬───────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
   ┌───────────┐            ┌─────────────┐
   │  Next.js  │            │   FastAPI   │
   │ port 3000 │            │  port 8000  │
   │ the pages │            │  the scans  │
   └───────────┘            └─────────────┘
                                   │
                                   ▼
                             Supabase (cloud)
                             already running
```

All of this sits on your one VPS.

---

# PART 0 — Creating the VPS in Hostinger

Skip this if your VPS is already set up and you have its IP address.

## 0.1 Find your VPS

Log in at [hpanel.hostinger.com](https://hpanel.hostinger.com).

Click **VPS** in the top menu. Your server appears in the list.

- If it says **"Setup"** or **"Start setup"** — click it and continue below.
- If it already shows an **IP address** and **Running** — you are done with
  Part 0. Go to Part 1.

## 0.2 Choose the operating system

Hostinger asks what to install. You will see options like "Plain OS",
"Operating System with Panel", and application templates.

Choose **Plain OS** (sometimes labelled "Operating System"), then pick:

> **Ubuntu 24.04 LTS**

That exact one. Here is why it matters:

- **Ubuntu** — every command in this guide is written for it
- **24.04** — includes Python 3.12, which your backend needs
- **LTS** — Long Term Support, security updates until 2029

**Do not** pick a template with a control panel (CyberPanel, cPanel, Plesk) or
an app template (WordPress, Docker). Those install extra software that fights
with what we are about to set up — they take over port 80, which Nginx needs.

## 0.3 Set the root password

Hostinger asks you to create a **root password**.

Root is the master account with complete control over the server. Make it
strong — this server is exposed to the internet and gets probed by bots within
minutes of going live.

**Write it down somewhere safe now.** You need it in Part 1, and recovering it
means resetting through the panel.

## 0.4 SSH keys (optional)

Hostinger may offer to add an SSH key. **Skip this** — it is a
password-free login method that is more secure but adds setup steps. Password
login works fine for now, and you can add a key later.

## 0.5 Wait for installation

Hostinger installs the OS. Takes 2–5 minutes. The status moves through
"Installing" and lands on **Running**.

## 0.6 Collect what you need

When it finishes, go to **VPS → your server → Overview** and note:

| Thing | Looks like | Used for |
|---|---|---|
| **IP address** | `168.231.94.12` | connecting, and pointing your domain |
| **Root password** | what you set in 0.3 | logging in |

Those two get you into Part 1.

> **If you ever need to start over:** Hostinger → VPS → **Settings** →
> **Operating System** → **Change OS** reinstalls everything in about 2
> minutes. Nothing you do on the server is permanent, so there is no way to
> break it beyond repair.

---

# PART 1 — Getting into your VPS

You need the **IP address** and **root password** from Part 0.6.

## 1.1 Connect from Windows

Open **PowerShell** (press `Windows`, type `powershell`, hit Enter) and run:

```powershell
ssh root@YOUR-IP-ADDRESS
```

Replace `YOUR-IP-ADDRESS` with your real IP. So it looks like
`ssh root@168.231.94.12`.

**First time only**, it asks:

```
Are you sure you want to continue connecting (yes/no)?
```

Type `yes` and press Enter.

Then it asks for your password. **Type it and press Enter — nothing appears on
screen while you type.** No dots, no stars. That is normal; it is hiding your
password. Just type it and hit Enter.

You are in when you see something like:

```
root@srv123456:~#
```

That is the server waiting for commands. **Every command from here until
Part 6 gets typed into this window.**

> **If you get disconnected** at any point, just run the `ssh` command again.
> Nothing is lost.

---

# PART 2 — Preparing the server

## 2.1 Update the system

```bash
apt update && apt upgrade -y
```

This downloads the latest security patches. Takes 1–3 minutes and prints a lot
of text — that is fine, let it finish.

If a purple screen appears asking about a new version of a config file, press
Enter to accept the default.

## 2.2 Install the tools we need

```bash
apt install -y git curl nano
```

- **git** — downloads your code from GitHub
- **curl** — fetches things from the internet
- **nano** — a simple text editor for the terminal

## 2.3 Install Python and Node

```bash
apt install -y python3 python3-venv python3-pip nginx ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Check they installed:

```bash
python3 --version
node --version
```

You should see something like `Python 3.12.3` and `v20.19.0`. If either says
"command not found", re-run the install command above it.

---

# PART 3 — Getting your code onto the server

Your code lives on GitHub. The server downloads it from there.

## 3.1 Push your latest changes (on your Windows machine)

Open a **second PowerShell window** — keep the SSH one open.

```powershell
cd "d:\ORBIT WORKS BUSINESS AUDIT"
git add .
git commit -m "Latest changes before deploy"
git push
```

If it asks for a username and password, use your GitHub username and a
**Personal Access Token** (GitHub no longer accepts your account password).
Get one at: GitHub → Settings → Developer settings → Personal access tokens →
Tokens (classic) → Generate new token → tick **repo** → copy it.

Paste the token where it asks for a password.

## 3.2 Download the code onto the server

Back in your **SSH window**:

```bash
git clone https://github.com/orbitworksofficial/Orbit-Audit-Tool.git /opt/orbitscanner
```

If your repo is private, it asks for your username and that same token.

Check it worked:

```bash
ls /opt/orbitscanner
```

You should see `frontend`, `deploy`, and `ORBIT WORKS BUSINESS AUDIT`.

---

# PART 4 — Adding your secret keys

Your API keys are deliberately **not** on GitHub — that would expose them to
anyone. So you paste them onto the server by hand, once.

## 4.1 Backend keys

```bash
nano "/opt/orbitscanner/ORBIT WORKS BUSINESS AUDIT/.env"
```

An empty editor opens.

On your Windows machine, open this file:
`d:\ORBIT WORKS BUSINESS AUDIT\ORBIT WORKS BUSINESS AUDIT\.env`

Select all (`Ctrl+A`), copy (`Ctrl+C`), then in the SSH window **right-click**
to paste.

Save and exit:

| Key | Does |
|---|---|
| `Ctrl+O` | save |
| `Enter` | confirm the filename |
| `Ctrl+X` | exit |

## 4.2 Frontend keys

```bash
nano /opt/orbitscanner/frontend/.env.local
```

Paste your local `d:\ORBIT WORKS BUSINESS AUDIT\frontend\.env.local`.

**Then change one line.** Find:

```
PYTHON_API_URL=http://localhost:8000
```

Both apps now live on the same machine, so make it:

```
PYTHON_API_URL=http://127.0.0.1:8000
```

Save and exit the same way (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

# PART 5 — Building and starting everything

## 5.1 Run the setup script

```bash
bash /opt/orbitscanner/deploy/setup-vps.sh https://github.com/orbitworksofficial/Orbit-Audit-Tool.git
```

This takes 5–10 minutes. It:

- installs your Python packages
- builds the Next.js site
- creates two background services so both apps start automatically
- configures Nginx to route traffic
- turns on the firewall

When it finishes it prints your live address.

## 5.2 Check both apps are running

```bash
systemctl status orbit-api orbit-web
```

Look for **`active (running)`** in green for both. Press `q` to exit that view.

If either says `failed`, see the troubleshooting section at the bottom.

## 5.3 See your site

Open a browser and go to `http://YOUR-IP-ADDRESS`.

Your site should load. It is live on the internet.

---

# PART 6 — Connecting your Hostinger subdomain

Right now the site only answers to a bare IP. Let us give it a real address
like `scan.orb-itworks.com`.

## 6.1 Point the subdomain at your server

In Hostinger: **Domains** → your domain → **DNS / Nameservers** →
**DNS records**.

Add a new record:

| Field | Value |
|---|---|
| Type | **A** |
| Name | `scan` |
| Points to | your VPS IP address |
| TTL | leave default |

Click **Add Record**.

> The **Name** field is just the subdomain part. Entering `scan` gives you
> `scan.orb-itworks.com`. Entering `@` would use the root domain instead.

DNS takes 5–30 minutes to spread across the internet. Check whether it is
ready by running this on the server:

```bash
ping -c 2 scan.orb-itworks.com
```

When it shows your VPS IP, you are ready for the next step.

## 6.2 Tell Nginx about the domain

```bash
nano /etc/nginx/sites-available/orbitscanner
```

Find this line near the top:

```
    server_name _;
```

Change it to your subdomain:

```
    server_name scan.orb-itworks.com;
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`), then apply:

```bash
nginx -t && systemctl reload nginx
```

`nginx -t` checks for mistakes first. If it says **"syntax is ok"** and
**"test is successful"**, you are fine. If it reports an error, re-open the
file and check for a missing semicolon.

## 6.3 Add free HTTPS

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d scan.orb-itworks.com
```

It asks for:

- **an email address** — for expiry warnings
- **agree to terms** — type `Y`
- **share your email** — `N` is fine

It then fetches a certificate and rewrites your Nginx config for HTTPS
automatically. Renewal is automatic too.

Visit `https://scan.orb-itworks.com` — you should see a padlock.

## 6.4 Tell Supabase about the new address

Supabase dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://scan.orb-itworks.com`
- **Redirect URLs**: add `https://scan.orb-itworks.com/**`

Without this, signup confirmation emails link to the wrong place.

---

# PART 7 — Test everything

1. Open `https://scan.orb-itworks.com`
2. Click through to **/scan**
3. Enter a real business and website, submit
4. Wait 30–60 seconds for the report
5. Click **Download PDF**
6. Check Supabase → **Table Editor** → `audit_reports` for the new row

If all six work, you are done.

---

# Everyday commands

Keep these somewhere handy.

```bash
# Connect to the server
ssh root@YOUR-IP

# Are both apps running?
systemctl status orbit-api orbit-web

# Watch the backend live — leave this open while running a scan
journalctl -u orbit-api -f      # Ctrl+C to stop watching

# Restart after changing a .env file
systemctl restart orbit-api orbit-web

# Deploy new code (after git push from Windows)
bash /opt/orbitscanner/deploy/update.sh
```

---

# When something breaks

**The site will not load at all.**

```bash
systemctl status orbit-api orbit-web
```

Whichever says `failed` is the problem. Then:

```bash
journalctl -u orbit-api -n 50
```

This shows the last 50 log lines and usually names the cause outright.

**Scans fail immediately.**

Nearly always a wrong or missing key in the backend `.env`. Check the log
above, then:

```bash
nano "/opt/orbitscanner/ORBIT WORKS BUSINESS AUDIT/.env"
systemctl restart orbit-api
```

**Reports do not save to Supabase.**

`SUPABASE_KEY` must be the **service_role** key, not the anon key. Row Level
Security rejects the anon key and the write fails without a visible error.

**The scan cuts off around 60 seconds.**

Nginx's default timeout is 60s and your scans need up to 155s. Check the
config still has it:

```bash
grep proxy_read_timeout /etc/nginx/sites-available/orbitscanner
```

It should say `300s`. If not, edit it back and run
`nginx -t && systemctl reload nginx`.

**The domain does not work but the IP does.**

DNS has not spread yet — wait up to 30 minutes. Check progress:

```bash
ping -c 2 scan.orb-itworks.com
```

**I am completely stuck.**

Reboot fixes more than you would expect:

```bash
reboot
```

Your connection drops. Wait 30 seconds, then `ssh root@YOUR-IP` again. Both
apps restart on their own.

---

# Useful things to know

**You cannot break it permanently.** Hostinger can reinstall the OS from the
panel in about 2 minutes. If the server gets into a mess, wipe it and start
from Part 2.

**Nothing runs on your PC.** Once deployed, the site stays up whether your
computer is on or not.

**`Ctrl+C` stops a running command.** Use it if something hangs.

**Tab completes filenames.** Type `nano /opt/orb` then press Tab — it fills in
the rest.

**Up-arrow repeats commands.** Faster than retyping.
