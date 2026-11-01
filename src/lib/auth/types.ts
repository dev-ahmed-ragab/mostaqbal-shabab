// Shared, dependency-free authentication types and helpers.
// نموذج الدخول: هوية واحدة فقط (المهندس / محمد العزب) بكلمة سر واحدة.
// لا توجد أدوار متعددة ولا حسابات مواطنين/موظفين.

export type UserRole = 'admin';

export type AdminRole = UserRole;

export interface RoleMeta {
  role: UserRole;
  label: string;
  rank: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const ROLES_META: Record<UserRole, RoleMeta> = {
  admin: {
    role: 'admin',
    label: 'المشرف العام',
    rank: 100,
    badgeBg: 'bg-[#133063]',
    badgeText: 'text-white',
    badgeBorder: 'border-blue-900',
    description: 'صلاحيات كاملة لإدارة المنظومة.',
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

export const YOUTH_SECRETARIAT: CommitteeDef = {
  id: 'youth',
  name: 'أمانة الشباب',
  headName: 'أمين الشباب',
  rapporteur: 'أمين مساعد تنفيذي',
  description: 'الأمانة المسؤولة عن شؤون وأنشطة الشباب ومتابعة طلباتهم بمركز بركة السبع.',
  phone: '01123456789',
  status: 'active',
  createdAt: '2026-01-01',
};

/** أمانة الشباب هي الأمانة الوحيدة في المنظومة. */
export const OFFICIAL_COMMITTEES: CommitteeDef[] = [YOUTH_SECRETARIAT];

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  avatar_url?: string;
  isSuperAdmin?: boolean;
  role?: UserRole;
  loggedInAt: string;
}

export type AuthUser = AdminUser;

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === 'admin';
}

/** السوبر أدمن لم يعد مفهوماً منفصلاً؛ الهوية الوحيدة هي المشرف العام. */
export function isSuperAdminUser(
  user: Pick<AdminUser, 'role' | 'isSuperAdmin'> | null | undefined
): boolean {
  return !!user && isAdminRole(user.role);
}

export function homePathForRole(): string {
  return '/admin';
}

export function sanitizeNextPath(
  raw: string | null | undefined,
  fallback = '/admin'
): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const parsed = new URL(value, 'https://internal.invalid');
    if (parsed.origin !== 'https://internal.invalid') return fallback;
    if (parsed.username || parsed.password) return fallback;
    if (!parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
