# Migration notes

## Order

1. `supabase_schema.sql` (Python project) — creates `audit_reports`.
2. `migration.sql` (this folder) — adds profiles, quota, RLS.

Run both in the Supabase SQL Editor.

## Action required after running migration.sql

`migration.sql` turns on Row Level Security for `audit_reports`. The Python
service inserts rows with whatever key is in `SUPABASE_KEY`. If that is the
**anon** key, its inserts will start failing silently — `save_audit_report`
already catches the error and returns `None`, so you will lose reports without
an obvious crash.

**Fix:** set `SUPABASE_KEY` in the Python `.env` to the **service role** key.

That is safe: the Python service is server-side only and never exposes the key
to a browser. No Python code changes are needed — only the env value.

To confirm which key you have, decode the JWT at jwt.io and check the `role`
claim: it reads `anon` or `service_role`.

## Quota

`FREE_SCANS_PER_ACCOUNT` in the Next.js env is documentation only. The real
limit lives in `profiles.scan_limit`, defaulting to 3, so support can top up a
single account with a SQL update rather than a redeploy:

```sql
UPDATE public.profiles SET scan_limit = 10 WHERE email = 'someone@example.com';
```
