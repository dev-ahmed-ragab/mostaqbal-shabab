'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Award, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  Building2, 
  Check, 
  AlertCircle,
  Crown,
  Zap,
  Hammer,
  User,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';
import { authService, AdminUser, UserRole, ROLES_META, CommitteeDef } from '@/lib/auth';
import { committeesService } from '@/lib/committeesService';

interface AppUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  committeeId: string;
  committeeName: string;
  roleTitle: string;
  joinedAt: string;
  reviewedCount?: number;
  decisionsCount?: number;
  lastActive?: string;
  recentActions?: string[];
}

const STORAGE_USERS_KEY = 'mostaqbal_app_users_v2';

const INITIAL_USERS: AppUserRecord[] = [
  {
    id: 'u-admin-1',
    name: 'المحاسب / محمد بط',
    email: 'admin@mostaqbal-watan.org',
    phone: '01512345678',
    role: 'admin',
    committeeId: 'all',
    committeeName: 'كافة لجان حزب مستقبل وطن',
    roleTitle: 'أمين التنظيم بالمحافظة (المشرف العام)',
    joinedAt: '2026/01/01',
    reviewedCount: 48,
    decisionsCount: 35,
    lastActive: 'منذ 10 دقائق',
    recentActions: [
      'اعتماد نقل 4 شكاوى إلى لجنة الإسكان والمرافق',
      'التصديق النهائي على تأشيرة لجنة رعاية الشباب رقم #WY-2026-882',
      'إصدار التقرير الإحصائي المجمع لمحافظة المنوفية',
    ],
  },
  {
    id: 'u-head-1',
    name: 'أ. سامر التلاوي',
    email: 'samer.talawe@mostaqbal-watan.org',
    phone: '01123456789',
    role: 'committee_head',
    committeeId: 'youth',
    committeeName: 'لجنة رعاية الشباب',
    roleTitle: 'رئيس لجنة رعاية الشباب',
    joinedAt: '2026/01/10',
    reviewedCount: 38,
    decisionsCount: 29,
    lastActive: 'اليوم 02:15 م',
    recentActions: [
      'الموافقة على طلب تنظيم دورة رمضانية بمركز شباب شبين الكوم',
      'توجيه تأشيرة رسمية لمديرية الشباب والرياضة بالمنوفية',
      'اعتماد دعم إنارة وتطوير الملعب الخماسي بمركز شباب الباجور',
    ],
  },
  {
    id: 'u-exec-1',
    name: 'م. محمود الجزار',
    email: 'mahmoud.gazzar@mostaqbal-watan.org',
    phone: '01012345678',
    role: 'executive_member',
    committeeId: 'youth',
    committeeName: 'لجنة رعاية الشباب',
    roleTitle: 'مقرر لجنة رعاية الشباب التنفيذي',
    joinedAt: '2026/01/15',
    reviewedCount: 52,
    decisionsCount: 41,
    lastActive: 'اليوم 01:40 م',
    recentActions: [
      'إجراء معاينة ميدانية لملعب مركز شباب منوف',
      'تحديث حالة الشكوى رقم WY-2026-904 إلى "قيد التنفيذ"',
      'رفع مذكرة المعاينة الهندسية إلى أمانة المحافظة',
    ],
  },
  {
    id: 'u-exec-2',
    name: 'أ. محمد هلال',
    email: 'mohamed.helal@mostaqbal-watan.org',
    phone: '01099887766',
    role: 'executive_member',
    committeeId: 'youth',
    committeeName: 'لجنة رعاية الشباب',
    roleTitle: 'قيادي ومسؤول تنفيذي ميداني',
    joinedAt: '2026/01/20',
    reviewedCount: 31,
    decisionsCount: 19,
    lastActive: 'اليوم 11:20 ص',
    recentActions: [
      'التنسيق مع ملتقى توظيف شباب مركز الباجور',
      'التواصل مع المواطن مقدم الطلب رقم WY-2026-773 عبر واتساب',
      'متابعة استكمال المستندات لشكوى نادي سرس الليان',
    ],
  },
  {
    id: 'u-mem-1',
    name: 'أ. محمد العزب',
    email: 'mohamed.azab@mostaqbal-watan.org',
    phone: '01234567890',
    role: 'member',
    committeeId: 'youth',
    committeeName: 'لجنة رعاية الشباب',
    roleTitle: 'عضو لجنة الشباب ومسؤول المتابعة',
    joinedAt: '2026/02/01',
    reviewedCount: 27,
    decisionsCount: 14,
    lastActive: 'أمس 06:10 م',
    recentActions: [
      'استلام طلبات مركز شباب أشمون وتفريغها بالنظام',
      'تسجيل إفادة المواطنين حول احتياجات مراكز الشباب',
      'إرفاق صور المعاينة لملف الشكوى رقم WY-2026-618',
    ],
  },
  {
    id: 'u-cit-1',
    name: 'أحمد محمود إبراهيم',
    email: 'ahmed.citizen@example.com',
    phone: '01012345678',
    role: 'citizen',
    committeeId: 'youth',
    committeeName: 'لجنة رعاية الشباب',
    roleTitle: 'مواطن مسجل بالمنظومة',
    joinedAt: '2026/02/10',
    reviewedCount: 1,
    decisionsCount: 0,
    lastActive: 'اليوم 09:00 ص',
    recentActions: [
      'تسجيل طلب صيانة ملعب مركز شباب قويسنا برقم WY-2026-912',
    ],
  },
];

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [committees, setCommittees] = useState<CommitteeDef[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [committeeFilter, setCommitteeFilter] = useState<string>('all');

  // مودال إضافة مستخدم / عضو جديد
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [newCommitteeId, setNewCommitteeId] = useState('youth');
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // مودال تعديل الدور والترقية
  const [editingUser, setEditingUser] = useState<AppUserRecord | null>(null);

  // مودال سجل نشاط وقرارات العضو عند الضغط على الصف
  const [selectedUserDetail, setSelectedUserDetail] = useState<AppUserRecord | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = () => {
    setCurrentUser(authService.getCurrentUser());
    setCommittees(committeesService.getAll());

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        try {
          setUsers(JSON.parse(stored));
        } catch {
          setUsers(INITIAL_USERS);
        }
      } else {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
        setUsers(INITIAL_USERS);
      }
    }
  };

  const saveUsers = (updated: AppUserRecord[]) => {
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
    }
  };

  useEffect(() => {
    loadData();

    const unsubComm = committeesService.subscribe(() => {
      setCommittees(committeesService.getAll());
    });
    const unsubAuth = authService.subscribe(() => {
      setCurrentUser(authService.getCurrentUser());
    });

    return () => {
      unsubComm();
      unsubAuth();
    };
  }, []);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  // تصفية المستخدمين
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (committeeFilter !== 'all' && u.committeeId !== committeeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.roleTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, roleFilter, committeeFilter, searchQuery]);

  // إحصائيات الأدوار
  const roleStats = useMemo(() => {
    return {
      admin: users.filter(u => u.role === 'admin' || (u.role as string) === 'super_admin').length,
      head: users.filter(u => u.role === 'committee_head').length,
      exec: users.filter(u => u.role === 'executive_member').length,
      member: users.filter(u => u.role === 'member').length,
      citizen: users.filter(u => u.role === 'citizen').length,
    };
  }, [users]);

  // إضافة عضو جديد
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newName.trim()) {
      setAddError('يرجى كتابة الاسم بالكامل.');
      return;
    }

    const targetComm = committees.find(c => c.id === newCommitteeId) || committees[0];

    const newUser: AppUserRecord = {
      id: `u-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim() || `${Date.now()}@mostaqbal-watan.org`,
      phone: newPhone.trim() || '01000000000',
      role: newRole,
      committeeId: newRole === 'admin' ? 'all' : targetComm.id,
      committeeName: newRole === 'admin' ? 'كافة لجان حزب مستقبل وطن' : targetComm.name,
      roleTitle: newRoleTitle.trim() || (ROLES_META[newRole]?.label || 'عضو معتمد'),
      joinedAt: new Date().toLocaleDateString('ar-EG'),
    };

    const updated = [newUser, ...users];
    saveUsers(updated);
    showToast(`تمت إضافة ${newUser.name} بدور (${ROLES_META[newRole]?.label}) بنجاح`);
    setShowAddModal(false);

    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewRoleTitle('');
  };

  // تعديل الدور وترقية العضو
  const handleSaveRoleChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const targetComm = committees.find(c => c.id === editingUser.committeeId) || committees[0];

    const updated = users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...editingUser,
          committeeName: editingUser.role === 'admin' ? 'كافة لجان حزب مستقبل وطن' : targetComm.name,
        };
      }
      return u;
    });

    saveUsers(updated);
    showToast(`تم تحديث دور وصلاحيات "${editingUser.name}" بنجاح`);
    setEditingUser(null);
  };

  // حذف عضو
  const handleDeleteUser = (user: AppUserRecord) => {
    if (!isAdmin) {
      alert('حذف الأعضاء مقتصر على المشرف العام.');
      return;
    }

    if (user.id === 'u-admin-1') {
      alert('لا يمكن حذف حساب المشرف العام الأساسي.');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف حساب "${user.name}"؟`)) return;

    const updated = users.filter(u => u.id !== user.id);
    saveUsers(updated);
    showToast(`تم حذف حساب ${user.name}`);
  };

  return (
    <div className="space-y-6">
      {/* إشعار الـ Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#133063] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-[#00a3e0] transition-all">
          <Check className="w-4 h-4 text-[#00a3e0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* رأس الصفحة مع شرح الأدوار والتسلسل الهرمي */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#133063] to-[#00a3e0]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#133063] border border-blue-200 text-[11px] font-extrabold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#00a3e0]" />
                إدارة المستخدمين والأدوار الحزبية
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#133063]">
              توزيع الأدوار والصلاحيات
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              إدارة الهيكل الإداري: المشرف العام (الأدمن) بالأعلى، يليه رؤساء اللجان النوعية، ثم الأعضاء التنفيذيون والميدانيون، وأعضاء اللجان، والمواطنون المسجلون.
            </p>
          </div>

          {/* زر إضافة مستخدم أو عضو */}
          <button
            type="button"
            onClick={() => {
              setAddError(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-[#133063]/25 active:scale-95 transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4 text-[#00a3e0]" />
            <span>تسجيل عضو / قيادي جديد</span>
          </button>
        </div>

        {/* كروت بطاقات الأدوار الخمسة */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200">
            <span className="text-[10px] font-bold text-slate-500 block">👑 المشرف العام</span>
            <span className="text-lg font-black text-[#133063] mt-0.5 block">{roleStats.admin} حساب</span>
          </div>

          <div className="p-3 rounded-2xl bg-cyan-50/80 border border-cyan-200">
            <span className="text-[10px] font-bold text-[#00a3e0] block">⚡ رؤساء اللجان</span>
            <span className="text-lg font-black text-[#00a3e0] mt-0.5 block">{roleStats.head} رؤساء</span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200">
            <span className="text-[10px] font-bold text-indigo-700 block">🛠️ أعضاء تنفيذيون</span>
            <span className="text-lg font-black text-indigo-800 mt-0.5 block">{roleStats.exec} أعضاء</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-600 block">📋 أعضاء اللجان</span>
            <span className="text-lg font-black text-slate-800 mt-0.5 block">{roleStats.member} أعضاء</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-emerald-700 block">👤 مواطنون مسجلون</span>
            <span className="text-lg font-black text-emerald-800 mt-0.5 block">{roleStats.citizen} مواطن</span>
          </div>
        </div>
      </div>

      {/* شريط البحث وفلاتر الأدوار واللجان */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، البريد، الهاتف، أو المسمى..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* فلتر الدور */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
          >
            <option value="all">كافة الأدوار والصلاحيات</option>
            <option value="admin">👑 المشرف العام (Admin)</option>
            <option value="committee_head">⚡ رؤساء اللجان (Head)</option>
            <option value="executive_member">🛠️ أعضاء تنفيذيون (Executive)</option>
            <option value="member">📋 أعضاء اللجان (Member)</option>
            <option value="citizen">👤 مواطنون (Citizen)</option>
          </select>

          {/* فلتر اللجنة */}
          <select
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
          >
            <option value="all">كافة اللجان</option>
            {committees.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* جدول المستخدمين والأدوار */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold">
              <tr>
                <th className="py-3.5 px-4">الاسم والبيانات</th>
                <th className="py-3.5 px-4">الدور والصلاحية</th>
                <th className="py-3.5 px-4">اللجنة التابع لها</th>
                <th className="py-3.5 px-4">المسمى التنظيمي</th>
                <th className="py-3.5 px-4">تاريخ الانضمام</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    لا يوجد أعضاء مطابقين للبحث المختار.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const meta = ROLES_META[user.role] || ROLES_META.member;
                  return (
                    <tr 
                      key={user.id} 
                      onClick={() => setSelectedUserDetail(user)}
                      className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                      title="اضغط لعرض سجل نشاط وإنجازات العضو أو ترقيته"
                    >
                      {/* الاسم وبيانات الاتصال */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 ${meta.badgeBg}`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-[#133063] block text-xs sm:text-sm group-hover:text-[#00a3e0] transition">
                              {user.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono" dir="ltr">{user.phone}</span>
                              <span>•</span>
                              <span className="font-mono truncate max-w-[150px]">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* الدور والصلاحيات */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${meta.badgeBg} ${meta.badgeText} shadow-2xs`}>
                          {user.role === 'admin' ? '👑 المشرف العام' :
                           user.role === 'committee_head' ? '⚡ رئيس لجنة' :
                           user.role === 'executive_member' ? '🛠️ عضو تنفيذي' :
                           user.role === 'citizen' ? '👤 مواطن' : '📋 عضو لجنة'}
                        </span>
                      </td>

                      {/* اللجنة التابع لها */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700 block">
                          {user.committeeName}
                        </span>
                      </td>

                      {/* المسمى الوظيفي */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {user.roleTitle}
                      </td>

                      {/* تاريخ الانضمام */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {user.joinedAt}
                      </td>

                      {/* الإجراءات: ترقية، تعديل، حذف */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingUser(user);
                            }}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                            title="تعديل الدور وترقية العضو"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#00a3e0]" />
                          </button>

                          {isAdmin && user.id !== 'u-admin-1' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user);
                              }}
                              className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white transition"
                              title="حذف الحساب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال إضافة عضو / قيادي جديد */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#133063] flex items-center justify-center border border-blue-200">
                  <UserPlus className="w-5 h-5 text-[#00a3e0]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#133063]">تسجيل عضو / قيادي جديد</h3>
                  <span className="text-[11px] text-slate-400">إضافة عضو جديد للهيكل التنظيمي</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: م. أحمد السعيد"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ahmed@mostaqbal-watan.org"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف المحمول</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الدور والصلاحية *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] bg-white"
                  >
                    <option value="admin">👑 المشرف العام (أمانة اللجان)</option>
                    <option value="committee_head">⚡ رئيس لجنة نوعية</option>
                    <option value="executive_member">🛠️ عضو تنفيذي معتمد</option>
                    <option value="member">📋 عضو لجنة (متابعة)</option>
                    <option value="citizen">👤 مواطن</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اللجنة التابع لها</label>
                  <select
                    disabled={newRole === 'admin'}
                    value={newCommitteeId}
                    onChange={(e) => setNewCommitteeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] bg-white disabled:bg-slate-100"
                  >
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المسمى التنظيمي للبطاقة</label>
                <input
                  type="text"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  placeholder="مثال: مسؤول قطاع الشباب والرياضة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold shadow-md shadow-[#133063]/20 active:scale-95 transition"
                >
                  حفظ العضو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تعديل الدور والترقية */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-[#133063]">
                  ترقية وتعديل دور: {editingUser.name}
                </h3>
                <span className="text-[11px] text-slate-400">تغيير الصلاحيات واللجنة المكلفة</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoleChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الدور والصلاحية الجديد</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] bg-white"
                  >
                    <option value="admin">👑 المشرف العام (أمانة اللجان)</option>
                    <option value="committee_head">⚡ رئيس لجنة نوعية</option>
                    <option value="executive_member">🛠️ عضو تنفيذي معتمد</option>
                    <option value="member">📋 عضو لجنة (متابعة)</option>
                    <option value="citizen">👤 مواطن</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اللجنة المكلف بها</label>
                  <select
                    disabled={editingUser.role === 'admin'}
                    value={editingUser.committeeId}
                    onChange={(e) => setEditingUser({ ...editingUser, committeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] bg-white disabled:bg-slate-100"
                  >
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المسمى التنظيمي الرسمي</label>
                <input
                  type="text"
                  value={editingUser.roleTitle}
                  onChange={(e) => setEditingUser({ ...editingUser, roleTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold shadow-md shadow-[#133063]/20 active:scale-95 transition"
                >
                  اعتماد الترقية والتعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تفاصيل وسجل نشاط العضو عند الضغط على الصف */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* الترويسة مع زر الإغلاق */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base text-white shadow-md ${
                  (ROLES_META[selectedUserDetail.role] || ROLES_META.member).badgeBg
                }`}>
                  {selectedUserDetail.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#133063]">{selectedUserDetail.name}</h3>
                  <span className="text-xs text-slate-500 font-semibold">{selectedUserDetail.roleTitle}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {/* بطاقة البيانات الأساسية */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 mb-6 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">الدور الحالي:</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                  (ROLES_META[selectedUserDetail.role] || ROLES_META.member).badgeBg
                } ${(ROLES_META[selectedUserDetail.role] || ROLES_META.member).badgeText}`}>
                  {(ROLES_META[selectedUserDetail.role] || ROLES_META.member).label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">اللجنة التابع لها:</span>
                <span className="font-extrabold text-slate-800">{selectedUserDetail.committeeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">الهاتف:</span>
                <span className="font-mono text-slate-700 font-bold" dir="ltr">{selectedUserDetail.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">البريد:</span>
                <span className="font-mono text-slate-700 truncate max-w-[200px]">{selectedUserDetail.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">تاريخ الانضمام:</span>
                <span className="font-mono text-slate-600">{selectedUserDetail.joinedAt}</span>
              </div>
            </div>

            {/* إحصائيات النشاط والإنجازات */}
            <div className="mb-6">
              <h4 className="text-xs font-extrabold text-[#133063] mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#00a3e0]" />
                مؤشرات الإنجاز والنشاط الميداني
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block">طلبات مفحوصة</span>
                  <span className="text-lg font-black text-[#133063] mt-0.5 block">
                    {selectedUserDetail.reviewedCount ?? 12}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 block">قرارات معتمدة</span>
                  <span className="text-lg font-black text-emerald-800 mt-0.5 block">
                    {selectedUserDetail.decisionsCount ?? 8}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-700 block">آخر ظهور</span>
                  <span className="text-xs font-black text-amber-900 mt-1 block truncate">
                    {selectedUserDetail.lastActive ?? 'اليوم'}
                  </span>
                </div>
              </div>
            </div>

            {/* سجل العمليات والقرارات الأخيرة (Audit Trail) */}
            <div className="mb-6">
              <h4 className="text-xs font-extrabold text-[#133063] mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                سجل العمليات والقرارات الأخيرة
              </h4>
              <div className="space-y-2">
                {(selectedUserDetail.recentActions && selectedUserDetail.recentActions.length > 0) ? (
                  selectedUserDetail.recentActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 leading-relaxed">{action}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                    لا توجد عمليات مسجلة حديثاً لهذا الحساب.
                  </div>
                )}
              </div>
            </div>

            {/* الأزرار السريعة */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const u = selectedUserDetail;
                  setSelectedUserDetail(null);
                  setEditingUser(u);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00a3e0] hover:bg-[#0284c7] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل الصلاحيات والترقية</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
