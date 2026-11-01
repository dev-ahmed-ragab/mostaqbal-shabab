// جلسة الأدمن الموحّدة: كلمة سر واحدة + كوكي موقّعة HttpOnly.
// لا تعتمد على Supabase Auth ولا على أدوار متعددة.
//
// متغيرات البيئة المطلوبة (خادمية فقط، بدون NEXT_PUBLIC_):
//   ADMIN_LOGIN_PASSWORD   كلمة السر الوحيدة
//   ADMIN_SESSION_SECRET   مفتاح توقيع عشوائي طويل (32 بايت على الأقل)
//   ADMIN_SESSION_TTL_HOURS  مدة الجلسة بالساعات (افتراضي 168 = 7 أيام)

import type { AdminUser } from '@/lib/auth/types';

export const ADMIN_SESSION_COOKIE = 'mostaqbal_admin_session';

const SESSION_SUBJECT = 'mohamed-elazab';

const ADMIN_LOGIN_PASSWORD = process.env.ADMIN_LOGIN_PASSWORD || '';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || '';
const SESSION_TTL_HOURS = Number(
  process.env.ADMIN_SESSION_TTL_HOURS || '168'
);

export const isAdminAuthConfigured = Boolean(
  ADMIN_LOGIN_PASSWORD &&
    ADMIN_SESSION_SECRET &&
    ADMIN_SESSION_SECRET.length >= 32
);

export const ADMIN_IDENTITY = {
  id: SESSION_SUBJECT,
  email: 'elazab@mostaqbal-watan.org',
  name: 'المهندس / محمد العزب',
  username: 'mohamed_elazab',
  avatar: '/leaders/avatar-azab.jpg',
  avatar_url: '/leaders/avatar-azab.jpg',
  isSuperAdmin: true,
  role: 'admin' as const,
};

export function getAdminUser(): AdminUser {
  return { ...ADMIN_IDENTITY, loggedInAt: new Date().toISOString() };
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.max(1, SESSION_TTL_HOURS) * 3600,
  };
}

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded =
    normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** مقارنة ثابتة الزمن لتقليل تسريب المعلومات عبر التوقيت. */
function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function hmacSha256(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ADMIN_SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

export function verifyAdminPassword(input: string): boolean {
  if (!ADMIN_LOGIN_PASSWORD) return false;
  return timingSafeEqual(input, ADMIN_LOGIN_PASSWORD);
}

export async function createAdminSessionToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: SESSION_SUBJECT,
    iat: now,
    exp: now + Math.max(1, SESSION_TTL_HOURS) * 3600,
  };
  const body = bytesToBase64Url(
    encoder.encode(JSON.stringify(payload))
  );
  const signature = await hmacSha256(body);
  return `${body}.${signature}`;
}

export async function verifyAdminSessionToken(
  token: string | null | undefined
): Promise<boolean> {
  if (!token || !ADMIN_SESSION_SECRET) return false;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!body || !signature) return false;

  const expected = await hmacSha256(body);
  if (!timingSafeEqual(signature, expected)) return false;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(body))
    ) as { sub?: unknown; exp?: unknown };
    if (payload.sub !== SESSION_SUBJECT) return false;
    if (typeof payload.exp !== 'number') return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
