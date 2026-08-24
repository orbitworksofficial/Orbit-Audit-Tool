import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readQuota } from '@/lib/quota';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  return NextResponse.json(await readQuota(user.id));
}
