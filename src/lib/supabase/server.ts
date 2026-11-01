import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdminRole, type AdminUser } from '@/lib/auth/types';
import {
  ADMIN_SESSION_COOKIE,
  getAdminUser,
  isAdminAuthConfigured,
  verifyAdminSessionToken,
} from '@/lib/adminSession';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co'
);

/**
 * عميل Supabase للخادم (Server Components / Route Handlers).
 * Supabase هنا للبيانات فقط، وليس للهوية أو الأدوار.
 * يجب إنشاء عميل جديد في كل طلب.
 */
export async function createClient() {
  if (!isServerSupabaseConfigured) {
    throw new Error('Supabase غير مهيأ على الخادم.');
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * يقرأ جلسة الأدمن الموحّدة (كلمة سر واحدة) من الكوكي الموقّعة.
 * لا يعتمد على Supabase Auth ولا على أدوار من قاعدة البيانات.
 */
export async function getSessionProfile(): Promise<AdminUser | null> {
  if (!isAdminAuthConfigured) return null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!(await verifyAdminSessionToken(token))) return null;
    return getAdminUser();
  } catch {
    return null;
  }
}

/** يفرض وجود جلسة صالحة، وإلا يعيد التوجيه لصفحة الدخول. */
export async function requireUser(nextPath = '/admin'): Promise<AdminUser> {
  const user = await getSessionProfile();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/** يفرض أن المستخدم هو المشرف العام الوحيد المخوّل بالدخول. */
export async function requireAdmin(nextPath = '/admin'): Promise<AdminUser> {
  const user = await requireUser(nextPath);
  if (!isAdminRole(user.role)) {
    redirect('/login');
  }
  return user;
}
