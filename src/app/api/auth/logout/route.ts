import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from '@/lib/adminSession';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...adminSessionCookieOptions(),
    maxAge: 0,
  });
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}
