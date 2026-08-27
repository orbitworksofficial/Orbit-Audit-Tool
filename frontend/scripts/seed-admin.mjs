/**
 * Creates (or promotes) an admin account.
 *
 * The SQL seed block can only promote an account that already exists. This
 * creates one outright — email pre-confirmed, so there is no confirmation
 * email to wait for and no rate limit to hit.
 *
 * Usage, from the frontend directory:
 *   node scripts/seed-admin.mjs you@example.com "YourPassword123!"
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node scripts/seed-admin.mjs <email> <password>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

// Read .env.local directly: this runs outside Next.js, so process.env is bare.
const env = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env.local');
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing } = await db.auth.admin.listUsers();
const found = existing?.users?.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase()
);

let userId;

if (found) {
  console.log(`Account already exists — promoting ${email}`);
  userId = found.id;
  // Confirm the email too, in case it was created through the signup form.
  await db.auth.admin.updateUserById(userId, { email_confirm: true });
} else {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip the confirmation email entirely
    user_metadata: { full_name: 'Administrator' },
  });
  if (error) {
    console.error('Could not create the account:', error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log(`Created ${email}`);
}

const { error: profileError } = await db.from('profiles').upsert(
  {
    id: userId,
    email,
    full_name: 'Administrator',
    is_admin: true,
    is_active: true,
    scan_limit: 9999,
    scans_used: 0,
    bonus_scans: 0,
  },
  { onConflict: 'id' }
);

if (profileError) {
  console.error('Account exists but the admin flag failed:', profileError.message);
  process.exit(1);
}

console.log('');
console.log('  Admin ready');
console.log('  ------------------------------------');
console.log(`  Email     ${email}`);
console.log(`  Password  ${password}`);
console.log('  Sign in at /login, then open /admin');
console.log('');
