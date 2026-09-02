import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signUpSchema } from '@/lib/validation';
import { SITE_URL } from '@/lib/links';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { email, password, full_name } = parsed.data;
  const supabase = await createClient();

  // emailRedirectTo is sent per-request rather than relying on the project's
  // Site URL, which otherwise sends confirmation links to whatever that field
  // happens to hold (localhost, in our case).
  const origin = new URL(request.url).origin;
  const redirectBase =
    origin.includes('localhost') || origin.includes('127.0.0.1')
      ? origin
      : SITE_URL;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${redirectBase}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    user: data.user,
    // When email confirmation is on, no session is returned yet.
    needsConfirmation: !data.session,
  });
}
