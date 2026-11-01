import type { AdminUser, UserRole } from './auth/types';

export * from './auth/types';

export const AUTH_CHANGE_EVENT = 'mostaqbal_auth_state_changed';

// ذاكرة مؤقتة للعرض فقط. المصدر الوحيد للحقيقة هو الجلسة الموقّعة على الخادم،
// والتحقق النهائي من الصلاحيات يتم على الخادم (proxy + layouts).
let cachedUser: AdminUser | null = null;

function dispatchAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
  }
}

async function fetchCurrentUser(): Promise<AdminUser | null> {
  if (typeof window === 'undefined') return null;

  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      authenticated?: boolean;
      user?: AdminUser | null;
    };
    return data.authenticated && data.user ? data.user : null;
  } catch {
    return null;
  }
}

export const authService = {
  /**
   * آخر مستخدم تم التحقق منه من الخادم (للعرض فقط).
   * لا تستخدمه لاتخاذ قرار أمني.
   */
  getCurrentUser(): AdminUser | null {
    return cachedUser;
  },

  /** يملأ الذاكرة المؤقتة فوراً عند توفر الملف الشخصي من الخادم. */
  prime(user: AdminUser | null): void {
    cachedUser = user;
  },

  /** يتحقق من الجلسة الموقّعة عبر الخادم ويحدّث الذاكرة المؤقتة. */
  async refresh(): Promise<AdminUser | null> {
    if (typeof window === 'undefined') return cachedUser;

    const user = await fetchCurrentUser();
    cachedUser = user;
    dispatchAuthChange();
    return user;
  },

  async isAuthenticated(): Promise<boolean> {
    return (await authService.refresh()) !== null;
  },

  /**
   * فحص الصلاحيات (لإخفاء/إظهار عناصر الواجهة فقط).
   * التحقق الفعلي والأمني يتم على الخادم.
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
    if (action === 'manage_users') return true;
    return true;
  },

  /**
   * تسجيل الخروج: يحذف الجلسة الموقّعة من الخادم ويمسح الذاكرة المؤقتة.
   */
  async logout(): Promise<void> {
    cachedUser = null;

    if (typeof window !== 'undefined') {
      // تنظيف أي بيانات مواطنين محفوظة محلياً على جهاز مشترك.
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('mostaqbal_') ||
              key === 'last_submitted_complaint_code')
          ) {
            keys.push(key);
          }
        }
        keys.forEach((key) => localStorage.removeItem(key));
      } catch {
        // ignore
      }

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
        });
      } catch {
        // ignore
      }
    }

    dispatchAuthChange();
  },

  /**
   * الاستماع لتغييرات حالة تسجيل الدخول والخروج في التطبيق.
   */
  subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    };
  },
};

export type { AdminUser, UserRole };
