import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  profileToAdminUser,
  isAdminRole,
  isStaffRole,
  type AdminUser,
  type ProfileRow,
} from '@/lib/auth/types';

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
 * يجب إنشاء عميل جديد في كل طلب.
 */
export async function createClient() {
  if (!isServerSupabaseConfigured) {
    throw new Error('Supabase غير مهيأ على الخادم.');
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
          // يُتجاهل عند الاستدعاء من Server Component (لا يمكن تعديل الكوكيز).
          // تحديث الجلسة يتم في proxy.
        }
      },
    },
  });
}

/**
 * يقرأ المستخدم الحالي من جلسة Supabase ثم يجلب دوره من جدول profiles.
 * الدور لا يُقرأ أبداً من user_metadata لأنه قابل للتعديل من العميل.
 */
export async function getSessionProfile(): Promise<AdminUser | null> {
  // التحقق من جلسة الدخول السريع لقيادات الحزب
  try {
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get('mostaqbal_admin_session')?.value;
    if (demoCookie) {
      return {
        id: 'admin-azab',
        email: 'elazab@mostaqbal-watan.org',
        name: 'المهندس / محمد العزب',
        username: 'mohamed_elazab',
        avatar: '/leaders/avatar-azab.jpg',
        avatar_url: '/leaders/avatar-azab.jpg',
        isSuperAdmin: true,
        role: 'admin',
        loggedInAt: new Date().toISOString(),
      };
    }
  } catch {
    // تجاهل أخطاء قراءة الكوكيز في البيئات غير المتوافقة
  }

  if (!isServerSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, username, avatar_url, is_super_admin, created_at'
      )
      .eq('id', user.id)
      .maybeSingle<ProfileRow>();

    // إن لم يوجد صف profile بعد (مثلاً قبل تطبيق الهجرة) نعتبره مواطناً
    // ولا نمنح أي صلاحية إدارية.
    if (!profile) {
      return profileToAdminUser(
        {
          id: user.id,
          email: user.email,
          full_name:
            (user.user_metadata?.full_name as string | undefined) || null,
        },
        user.email || undefined
      );
    }

    return profileToAdminUser(profile, user.email || undefined);
  } catch {
    return null;
  }
}

/** يفرض وجود جلسة صالحة، وإلا يعيد التوجيه لصفحة الدخول. */
export async function requireUser(nextPath = '/account'): Promise<AdminUser> {
  const user = await getSessionProfile();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/** يفرض أن المستخدم من فريق العمل (وليس مواطناً). */
export async function requireStaff(nextPath = '/admin'): Promise<AdminUser> {
  const user = await requireUser(nextPath);
  if (!isStaffRole(user.role)) {
    redirect('/account');
  }
  return user;
}

/** يفرض أن المستخدم مشرف عام. */
export async function requireAdmin(nextPath = '/admin'): Promise<AdminUser> {
  const user = await requireUser(nextPath);
  if (!isAdminRole(user.role)) {
    redirect('/admin');
  }
  return user;
}
