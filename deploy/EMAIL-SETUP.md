# Email delivery setup

Reports are emailed automatically when a scan finishes, from
`hello@orb-itworks.com` via Hostinger SMTP.

About 15 minutes, one time.

---

## Step 1 — Create the mailbox

Hostinger panel → **Emails** → **Email Accounts** → your domain.

If `hello@orb-itworks.com` does not exist, create it and set a password.
**Write that password down** — you need it in step 2 and Hostinger will not
show it again.

---

## Step 2 — Add the password locally

Open `frontend\.env.local` and fill in the blank. **Keep the quotes:**

```
SMTP_PASSWORD="your-mailbox-password"
```

The quotes matter. Without them, a `#` anywhere in the password starts a
comment and everything after it is thrown away — login then fails with
`535 authentication failed`, even though the password is correct.

The other SMTP values are already correct for Hostinger.

---

## Step 3 — Add it on the server

```bash
ssh root@2.25.134.7
nano /opt/orbitscanner/frontend/.env.local
```

Paste the same email block, then save (`Ctrl+O`, `Enter`, `Ctrl+X`) and
restart:

```bash
systemctl restart orbit-web
```

---

## Step 4 — Set the Calendly link

Every booking button points here:

```
https://calendly.com/orbitworksofficial01/30min
```

This is now the built-in default, so the buttons work even if the variable is
never set. To point them somewhere else, set it in **both** `.env.local` files
(local and server):

```
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/orbitworksofficial01/30min
```

This one is `NEXT_PUBLIC_`, so it is baked in at build time — the server needs
a rebuild, not just a restart:

```bash
bash /opt/orbitscanner/deploy/update.sh
```

---

## Step 5 — Protect deliverability

**This step is not optional.** Without it, reports land in spam.

Hostinger → **Domains** → orb-itworks.com → **DNS records**. Add:

| Type | Name | Value |
|---|---|---|
| TXT | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@orb-itworks.com` |

If an SPF record already exists, **edit it** rather than adding a second — two
SPF records are worse than none, and mail servers reject the pair.

For **DKIM**, Hostinger generates the record: Emails → your domain → **DNS
settings / DKIM**. Enable it and add the record it gives you.

DNS takes up to 30 minutes to propagate.

---

## Step 6 — Test it

Run a scan on the live site with your own email address. The report should
arrive within a minute.

If it does not, check the log:

```bash
journalctl -u orbit-web -n 50 --no-pager | grep -i mail
```

---

## Troubleshooting

**"SMTP is not configured"** — `SMTP_PASSWORD` is empty, or the server was not
restarted after the edit.

**"Invalid login" / "535 authentication failed"** — first check the password is
wrapped in double quotes (see step 2). An unquoted `#` truncates it silently.
Otherwise the password is wrong: reset it in Hostinger and update both
`.env.local` files.

**Email arrives in spam** — step 5 was skipped or the DNS has not propagated.
Check with an [SPF lookup tool](https://mxtoolbox.com/spf.aspx).

**"Connection timeout"** — some hosts block outbound port 465. Try 587
instead:

```
SMTP_PORT=587
```

The code switches from implicit TLS to STARTTLS automatically.

---

## What the email contains

- Overall score with its colour-coded band
- All six section scores with weights
- The AI summary and top 3 critical gaps
- A button to the full report
- A booking CTA linking to Calendly

Written in table-based HTML with inline styles, because Outlook renders with
Word's engine and Gmail strips `<style>` blocks. A plain-text alternative is
sent alongside it — its absence is itself a spam signal.

**Sending never blocks a scan.** If SMTP fails the visitor still gets their
report on screen, and the failure is logged.
