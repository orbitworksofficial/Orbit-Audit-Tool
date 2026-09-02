import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Email-confirmation landing point.
 *
 * Supabase sends the user here with a one-time ?code=. Exchanging it sets the
 * session cookies, so the user arrives already signed in rather than being
 * asked to log in again straight after confirming.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Supabase reports failures (expired or already-used links) as query params
  // rather than an error status.
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        errorDescription ?? 'That confirmation link is no longer valid.'
      )}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  );

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        'That confirmation link has expired. Sign in to request a new one.'
      )}`
    );
  }

  // Confirmed and signed in. `next` allows returning to wherever they were.
  const next = searchParams.get('next');
  return NextResponse.redirect(`${origin}${next ?? '/dashboard?confirmed=1'}`);
}
