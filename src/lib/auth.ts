import { supabase, isSupabaseConfigured } from './supabase/client';
import {
  profileToAdminUser,
  type AdminUser,
  type ProfileRow,
  type UserRole,
} from './auth/types';

export * from './auth/types';

export const AUTH_CHANGE_EVENT = 'mostaqbal_auth_state_changed';

// ذاكرة مؤقتة للعرض فقط. المصدر الوحيد للحقيقة هو جلسة Supabase + جدول profiles،
// والتحقق النهائي من الصلاحيات يتم على الخادم (proxy + layouts).
let cachedUser: AdminUser | null = null;
let authListenerBound = false;

function dispatchAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
  }
}

function bindAuthListener() {
  if (authListenerBound || typeof window === 'undefined' || !supabase) return;
  authListenerBound = true;

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      cachedUser = null;
      dispatchAuthChange();
      return;
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // نحدّث الملف الشخصي (الدور) من قاعدة البيانات وليس من بيانات الجلسة.
      void authService.refresh();
    }
  });
}

async function fetchProfileForCurrentSession(): Promise<AdminUser | null> {
  if (typeof document !== 'undefined') {
    const isDemoAdmin = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('mostaqbal_admin_session='));
    if (isDemoAdmin) {
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
  }

  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, username, avatar_url, is_super_admin, created_at')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  if (!profile) {
    return profileToAdminUser(
      {
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata?.full_name as string | undefined) || null,
      },
      user.email || undefined
    );
  }

  return profileToAdminUser(profile, user.email || undefined);
}

export const authService = {
  /**
   * آخر مستخدم تم التحقق منه من الخادم/الجلسة (للعرض فقط).
   * لا تستخدمه لاتخاذ قرار أمني.
   */
  getCurrentUser(): AdminUser | null {
    return cachedUser;
  },

  /** يملأ الذاكرة المؤقتة فوراً عند توفر الملف الشخصي من الخادم. */
  prime(user: AdminUser | null): void {
    cachedUser = user;
  },

  /** يتحقق من الجلسة ويحدّث الدور من جدول profiles. */
  async refresh(): Promise<AdminUser | null> {
    if (typeof window === 'undefined') return cachedUser;

    try {
      bindAuthListener();
      const user = await fetchProfileForCurrentSession();
      cachedUser = user;
      dispatchAuthChange();
      return user;
    } catch {
      cachedUser = null;
      dispatchAuthChange();
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    return (await authService.refresh()) !== null;
  },

  /**
   * فحص الصلاحيات بحسب الدور (لإخفاء/إظهار عناصر الواجهة فقط).
   * التحقق الفعلي والأمني يتم على الخادم وفي سياسات RLS.
   */
  can(
    user: AdminUser | null | undefined,
    action:
      | 'manage_committees'
      | 'manage_users'
      | 'transfer_complaint'
      | 'resolve_complaint'
      | 'update_progress'
      | 'access_admin_portal'
  ): boolean {
    if (!user) return false;
    if (action === 'manage_users') return !!user.isSuperAdmin;
    return true;
  },

  /**
   * تسجيل الخروج: يحذف جلسة Supabase (والكوكيز) ويمسح الذاكرة المؤقتة.
   */
  async logout(): Promise<void> {
    cachedUser = null;

    if (typeof document !== 'undefined') {
      document.cookie =
        'mostaqbal_admin_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // ignore
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }

    dispatchAuthChange();
  },

  /**
   * الاستماع لتغييرات حالة تسجيل الدخول والخروج في التطبيق.
   */
  subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    bindAuthListener();
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    };
  },
};

export type { AdminUser, UserRole };
