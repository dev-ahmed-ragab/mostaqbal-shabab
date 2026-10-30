import { supabase, isSupabaseConfigured } from './supabase/client';

const ADMIN_STORAGE_KEY = 'mostaqbal_admin_session_v4';
export const AUTH_CHANGE_EVENT = 'mostaqbal_auth_state_changed';

export type UserRole = 
  | 'admin'             // المشرف العام (مدير المنظومة وأمانة التنظيم المركزية)
  | 'super_admin'       // توافق قديم للأدمن العام
  | 'committee_head'    // رئيس اللجنة
  | 'executive_member'  // عضو تنفيذي معتمد
  | 'member'            // عضو عادي / عضو متابعة
  | 'citizen';          // مواطن

export type AdminRole = UserRole;

export interface RoleMeta {
  role: UserRole;
  label: string;
  rank: number; // للتحقق من التسلسل الهرمي (الأدمن أعلى)
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const ROLES_META: Record<string, RoleMeta> = {
  admin: {
    role: 'admin',
    label: 'المشرف العام (أمانة التنظيم)',
    rank: 100,
    badgeBg: 'bg-[#133063]',
    badgeText: 'text-white',
    badgeBorder: 'border-blue-900',
    description: 'صلاحيات كاملة لإدارة كافة اللجان، إضافة لجان جديدة، ترقية الأعضاء، واعتماد القرارات.',
  },
  super_admin: {
    role: 'admin',
    label: 'المشرف العام (أمانة التنظيم)',
    rank: 100,
    badgeBg: 'bg-[#133063]',
    badgeText: 'text-white',
    badgeBorder: 'border-blue-900',
    description: 'صلاحيات كاملة لإدارة كافة اللجان، إضافة لجان جديدة، ترقية الأعضاء، واعتماد القرارات.',
  },
  committee_head: {
    role: 'committee_head',
    label: 'رئيس اللجنة',
    rank: 80,
    badgeBg: 'bg-[#00a3e0]',
    badgeText: 'text-white',
    badgeBorder: 'border-cyan-600',
    description: 'إدارة شؤون لجنته، اعتماد التأشيرات والقرارات النهائية، وإسناد المهام للأعضاء.',
  },
  executive_member: {
    role: 'executive_member',
    label: 'عضو تنفيذي',
    rank: 60,
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    badgeBorder: 'border-indigo-700',
    description: 'المتابعة الميدانية للشكاوى، تسجيل ملاحظات التنفيذ، وتحديث حالات العمل اليومية.',
  },
  member: {
    role: 'member',
    label: 'عضو لجنة',
    rank: 40,
    badgeBg: 'bg-slate-700',
    badgeText: 'text-white',
    badgeBorder: 'border-slate-800',
    description: 'الاطلاع على طلبات اللجنة والمشاركة في الأنشطة الميدانية واللقاءات الجماهيرية.',
  },
  citizen: {
    role: 'citizen',
    label: 'مواطن',
    rank: 10,
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    badgeBorder: 'border-emerald-700',
    description: 'تقديم الطلبات والشكاوى، ومتابعة حالتها وطباعة الإيصالات الرسمية بخصوصية تامة.',
  },
};

export interface CommitteeDef {
  id: string;
  name: string;
  headName: string;
  rapporteur: string;
  description: string;
  phone?: string;
  activeCount?: number;
  status?: 'active' | 'archived';
  createdAt?: string;
}

export const OFFICIAL_COMMITTEES: CommitteeDef[] = [
  {
    id: 'youth',
    name: 'لجنة رعاية الشباب',
    headName: 'أ. سامر التلاوي',
    rapporteur: 'م. محمود الجزار',
    description: 'المسؤولة عن شؤون وأنشطة الشباب والرياضة ومراكز الشباب والتوظيف والمبادرات.',
    phone: '01123456789',
    status: 'active',
    createdAt: '2026-01-01',
  },
  {
    id: 'citizen_affairs',
    name: 'لجنة خدمة المواطنين والتضامن الاجتماعي',
    headName: 'أمانة خدمة المواطنين',
    rapporteur: 'مسؤول المتابعة والتضامن',
    description: 'المسؤولة عن خدمات التضامن الاجتماعي، المساعدات، والمطالب الجماهيرية العامة.',
    phone: '01012345678',
    status: 'active',
    createdAt: '2026-01-01',
  },
];

export interface AdminUser {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  committeeId: string; // 'all' for admin or specific committee id like 'youth'
  committeeName: string;
  phone?: string;
  avatar?: string;
  loggedInAt: string;
}

export type AuthUser = AdminUser;

function dispatchAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
  }
}

export const authService = {
  /**
   * التحقق مما إذا كان المستخدم مسجل الدخول حالياً
   */
  async isAuthenticated(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // 1. فحص جلسة Supabase أولاً إن وجدت
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          return true;
        }
      } catch {
        // continue
      }
    }

    // 2. فحص الجلسة المحفوظة محلياً
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY) || sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (!stored) return false;

    try {
      const user = JSON.parse(stored);
      return Boolean(user && user.role);
    } catch {
      return false;
    }
  },

  /**
   * جلب بيانات المستخدم الحالي
   */
  getCurrentUser(): AdminUser | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY) || sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as AdminUser;
      // تسوية الأدوار
      if (parsed.role === 'super_admin') {
        parsed.role = 'admin';
      }
      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * فحص الصلاحيات بحسب الدور
   */
  can(user: AdminUser | null | undefined, action: 'manage_committees' | 'manage_users' | 'transfer_complaint' | 'resolve_complaint' | 'update_progress' | 'access_admin_portal'): boolean {
    if (!user) return false;
    const role = user.role === 'super_admin' ? 'admin' : user.role;

    switch (action) {
      case 'manage_committees':
        // فقط الأدمن العام يمكنه إضافة أو إدارة اللجان المركزية
        return role === 'admin';

      case 'manage_users':
        // الأدمن العام ورئيس اللجنة
        return role === 'admin' || role === 'committee_head';

      case 'transfer_complaint':
        // تحويل الشكاوى بين اللجان خاص بالأدمن العام
        return role === 'admin';

      case 'resolve_complaint':
        // اعتماد إنهاء أو رفض الشكوى (أدمن أو رئيس لجنة)
        return role === 'admin' || role === 'committee_head';

      case 'update_progress':
        // تحديث سير العمل وإضافة ملاحظات ميدانية
        return role === 'admin' || role === 'committee_head' || role === 'executive_member';

      case 'access_admin_portal':
        // المشرفون وأعضاء اللجان فقط (المواطن غير مصرح له بلوحة الإدارة)
        return role !== 'citizen';

      default:
        return false;
    }
  },

  /**
   * التحقق من الرمز السري المباشر وتحديد الدور والصلاحيات
   */
  verifyPasscode(passcode: string): { valid: boolean; user?: AdminUser } {
    const clean = passcode.trim().toLowerCase();

    // 1. صلاحيات الأدمن العام (Admin - أمانة التنظيم واللجان)
    const adminCodes = ['admin', 'admin123', 'admin2026', 'mostaqbal2026', 'superadmin'];
    if (adminCodes.includes(clean)) {
      return {
        valid: true,
        user: {
          id: 'u-admin-1',
          email: 'admin@mostaqbal-watan.org',
          name: 'الأدمن العام (أمانة التنظيم واللجان)',
          role: 'admin',
          committeeId: 'all',
          committeeName: 'كافة لجان حزب مستقبل وطن',
          phone: '01000000001',
          loggedInAt: new Date().toISOString(),
        },
      };
    }

    // 2. صلاحيات رئيس لجنة رعاية الشباب (Committee Head)
    const committeeHeadCodes = ['shabab', 'head', 'talawe', 'talawe2026', '123456'];
    if (committeeHeadCodes.includes(clean)) {
      return {
        valid: true,
        user: {
          id: 'u-head-1',
          email: 'samer.talawe@mostaqbal-watan.org',
          name: 'أ. سامر التلاوي (رئيس لجنة رعاية الشباب)',
          role: 'committee_head',
          committeeId: 'youth',
          committeeName: 'لجنة رعاية الشباب',
          phone: '01123456789',
          loggedInAt: new Date().toISOString(),
        },
      };
    }

    // 3. صلاحيات العضو التنفيذي (Executive Member)
    const execCodes = ['tanfeez', 'exec', 'gazzar', 'gazzar2026'];
    if (execCodes.includes(clean)) {
      return {
        valid: true,
        user: {
          id: 'u-exec-1',
          email: 'mahmoud.gazzar@mostaqbal-watan.org',
          name: 'م. محمود الجزار (مقرر تنفيذي معتمد)',
          role: 'executive_member',
          committeeId: 'youth',
          committeeName: 'لجنة رعاية الشباب',
          phone: '01012345678',
          loggedInAt: new Date().toISOString(),
        },
      };
    }

    // 4. صلاحيات العضو العادي (Regular Committee Member)
    const memberCodes = ['member', 'azab', 'ozv'];
    if (memberCodes.includes(clean)) {
      return {
        valid: true,
        user: {
          id: 'u-member-1',
          email: 'mohamed.azab@mostaqbal-watan.org',
          name: 'أ. محمد العزب (عضو لجنة الشباب)',
          role: 'member',
          committeeId: 'youth',
          committeeName: 'لجنة رعاية الشباب',
          phone: '01234567890',
          loggedInAt: new Date().toISOString(),
        },
      };
    }

    // 5. حساب المواطن التجريبي (Citizen)
    const citizenCodes = ['citizen', 'mowaten', 'user'];
    if (citizenCodes.includes(clean)) {
      return {
        valid: true,
        user: {
          id: 'u-citizen-1',
          email: 'ahmed.citizen@example.com',
          name: 'أحمد محمود إبراهيم (مواطن)',
          role: 'citizen',
          committeeId: 'youth',
          committeeName: 'لجنة رعاية الشباب',
          phone: '01012345678',
          loggedInAt: new Date().toISOString(),
        },
      };
    }

    return { valid: false };
  },

  /**
   * حفظ جلسة المستخدم وإرسال إشعار فوري للواجهات
   */
  setSession(user: AdminUser, persistent: boolean = true): void {
    if (typeof window !== 'undefined') {
      const normalized: AdminUser = {
        ...user,
        role: user.role === 'super_admin' ? 'admin' : user.role,
      };
      const payload = JSON.stringify(normalized);
      if (persistent) {
        localStorage.setItem(ADMIN_STORAGE_KEY, payload);
      }
      sessionStorage.setItem(ADMIN_STORAGE_KEY, payload);
      dispatchAuthChange();
    }
  },

  /**
   * تسجيل الخروج الفوري ومسح الجلسة
   */
  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
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
   * الاستماع لتغييرات حالة تسجيل الدخول والخروج في التطبيق بالكامل
   */
  subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    };
  },
};
