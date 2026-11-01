import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  sanitizeNextPath,
} from '@/lib/auth/types';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const requestedNext = rawNext ? sanitizeNextPath(rawNext, '/account') : null;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('missing_code')}`
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('not_configured')}`
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore in Server Component
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('auth_failed')}`
    );
  }

  // الدور من جدول profiles فقط، وليس من user_metadata.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle<{ role: string | null }>();

  const home = '/admin';
  const destination =
    !requestedNext || requestedNext.startsWith('/admin')
      ? home
      : requestedNext;

  return NextResponse.redirect(`${origin}${destination}`);
}
