// Shared, dependency-free authentication types and helpers.
// نظام إداري فقط (admin-only): كل مستخدم مصادق = أدمن.

export type UserRole = 'admin';

export type AdminRole = UserRole;

/** كل المستخدمين أدمن؛ لذا كلهم "staff". */
export type StaffRole = 'admin';

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
    label: 'أدمن',
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

/** شكل صف جدول profiles في Supabase. */
export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_super_admin: boolean | null;
  created_at?: string | null;
}

const VALID_ROLES: UserRole[] = ['admin'];

export function normalizeRole(_value: unknown): UserRole {
  return 'admin';
}

export function isAdminRole(_role: UserRole | null | undefined): boolean {
  return true;
}

export function isStaffRole(_role: UserRole | null | undefined): boolean {
  return true;
}

export function homePathForRole(_role: UserRole | null | undefined): string {
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

export function profileToAdminUser(
  row: Partial<ProfileRow> & { id: string },
  fallbackName?: string
): AdminUser {
  const email = row.email || '';
  return {
    id: row.id,
    email,
    name:
      row.full_name?.trim() ||
      fallbackName?.trim() ||
      (row.username?.trim() || '') ||
      email.split('@')[0] ||
      'مستخدم',
    username: row.username || undefined,
    avatar: row.avatar_url || undefined,
    isSuperAdmin: !!row.is_super_admin,
    role: 'admin',
    loggedInAt: new Date().toISOString(),
  };
}
