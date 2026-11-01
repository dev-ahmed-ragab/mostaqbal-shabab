import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminUser,
  isAdminAuthConfigured,
  verifyAdminPassword,
} from '@/lib/adminSession';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_IP = 10;

// حدّ أقصى بسيط للمحاولات (best-effort). في بيئة Serverless لا يُعتمد عليه
// كحل وحيد؛ يجب إضافة Rate Limiting على مستوى المنصة (Upstash/Cloudflare).
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  if (attempts.size > 5_000) attempts.clear();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

function json(body: unknown, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export async function POST(request: Request) {
  if (!isAdminAuthConfigured) {
    return json(
      { success: false, error: 'خدمة الدخول غير مهيأة على الخادم.' },
      503
    );
  }

  let password = '';

  try {
    const body = await request.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return json({ success: false, error: 'طلب غير صالح.' }, 400);
  }

  if (!password) {
    return json(
      { success: false, error: 'يرجى إدخال كلمة المرور.' },
      400
    );
  }

  if (password.length > 200) {
    return json({ success: false, error: 'بيانات الدخول غير صالحة.' }, 400);
  }

  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip =
    forwarded.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown';

  if (isRateLimited(`ip:${ip}`, MAX_ATTEMPTS_PER_IP)) {
    return json(
      { success: false, error: 'محاولات كثيرة. يرجى المحاولة بعد دقيقة.' },
      429
    );
  }

  if (!verifyAdminPassword(password)) {
    // رسالة موحّدة لا تكشف أي تفاصيل عن سبب الفشل.
    return json({ success: false, error: 'كلمة المرور غير صحيحة.' }, 401);
  }

  try {
    const token = await createAdminSessionToken();
    const response = json(
      { success: true, user: getAdminUser() },
      200
    );
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      token,
      adminSessionCookieOptions()
    );
    return response;
  } catch {
    return json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب.' },
      500
    );
  }
}
