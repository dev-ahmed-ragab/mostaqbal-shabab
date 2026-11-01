import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/supabase/server';

export async function GET() {
  const user = await getSessionProfile();

  const response = NextResponse.json(
    user ? { authenticated: true, user } : { authenticated: false, user: null },
    { status: 200 }
  );
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}
