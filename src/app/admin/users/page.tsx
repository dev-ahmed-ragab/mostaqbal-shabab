'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  User,
  Shield,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { authService } from '@/lib/auth';

interface AdminRow {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  // البحث والتصفية
  const [searchQuery, setSearchQuery] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();
  const isSuper = !!currentUser?.isSuperAdmin;

  const fetchUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, username, avatar_url, is_super_admin, created_at')
      .order('created_at', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setUsers((data || []) as AdminRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      await fetchUsers();
    })();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!supabase) return;
    if (!email.trim() || password.length < 8 || !fullName.trim()) {
      setError('يرجى إدخال الاسم والبريد وكلمة مرور (≥8 أحرف).');
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.rpc('create_admin_user', {
        p_email: email.trim(),
        p_password: password,
        p_full_name: fullName.trim(),
        p_username: username.trim() || null,
      });
      if (error) throw error;
      setSuccess(`تم إنشاء حساب المشرف ${fullName.trim()} (${email.trim()}) بنجاح.`);
      setEmail('');
      setPassword('');
      setFullName('');
      setUsername('');
      await fetchUsers();
    } catch (err) {
      const m = err instanceof Error ? err.message : 'تعذر إنشاء الحساب.';
      setError(m);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!supabase) return;
    if (!confirm(`حذف حساب ${email}؟`)) return;
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase.rpc('delete_admin_user', { p_user_id: id });
      if (error) throw error;
      setSuccess(`تم حذف ${email}.`);
      await fetchUsers();
    } catch (err) {
      const m = err instanceof Error ? err.message : 'تعذر الحذف.';
      setError(m);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = (u: AdminRow) => {
    const text = `بيانات دخول المشرف:\nالاسم: ${u.full_name || ''}\nالبريد: ${u.email}\nرابط الدخول: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  if (!isSuper) {
    return (
      <div className="p-6 text-sm font-bold text-rose-700 bg-rose-50 rounded-2xl border border-rose-200">
        هذه الصفحة مخصصة للمشرف العام (سوبر أدمن) فقط لإدارة حسابات الأمانة.
      </div>
    );
  }

  const superAdminsCount = users.filter(u => u.is_super_admin).length;
  const regularAdminsCount = users.filter(u => !u.is_super_admin).length;

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div>
        <h2 className="text-xl font-extrabold text-[#133063] flex items-center gap-2">
          <Users className="w-6 h-6 text-[#00a3e0]" />
          إدارة مستخدمي ومشرفي الأمانة
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          إضافة وتعيين أعضاء فريق العمل والمشرفين الميدانيين. يتم تزويد العضو ببيانات الدخول مباشرة دون انتظار بريد إلكتروني.
        </p>
      </div>

      {/* شريط الإحصائيات السريع للمستخدمين */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">إجمالي المشرفين</span>
            <strong className="text-xl font-black text-[#133063]">{users.length}</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00a3e0] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">مشرفو الإدارة العامة</span>
            <strong className="text-xl font-black text-emerald-700">{superAdminsCount}</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">مشرفو المتابعة الميدانية</span>
            <strong className="text-xl font-black text-indigo-700">{regularAdminsCount}</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 font-bold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* نموذج إضافة مستخدم جديد */}
      <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-[#133063] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#00a3e0]" />
            إضافة حساب مشرف جديد
          </h3>
          <span className="text-[11px] text-slate-400 font-bold">صلاحيات فحص الشكاوى واعتماد التأشيرات</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم بالكامل *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أحمد محمود إبراهيم"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستخدم (اختياري للتعريف)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ahmed_youth"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني المهني *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="supervisor@mostaqbal-watan.org"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
                dir="ltr"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الابتدائية (≥ 8 أحرف) *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                title={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={creating}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 text-[#00a3e0]" />}
            إنشاء حساب المشرف
          </button>
        </div>
      </form>

      {/* قائمة المستخدمين مع محرك بحث وتصفية */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-[#133063] flex items-center gap-2">
            قائمة المشرفين المسجلين ({filteredUsers.length})
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو البريد..."
              className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#00a3e0]" />
            جاري تحميل قائمة المشرفين...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold">
            لا يوجد مشرفون مطابقون للبحث.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between p-4 sm:px-6 gap-3 hover:bg-slate-50/60 transition">
                <div className="flex items-center gap-3.5 min-w-0">
                  {u.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-2xs" />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-[#133063] text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      {u.full_name ? u.full_name.trim().charAt(0) : 'م'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-extrabold text-[#133063] truncate">
                        {u.full_name || u.email}
                      </p>
                      {u.is_super_admin ? (
                        <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold">
                          مشرف عام
                        </span>
                      ) : (
                        <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-blue-50 text-[#133063] border border-blue-200 font-bold">
                          مشرف متابعة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono" dir="ltr">
                        {u.username ? `@${u.username} · ` : ''}{u.email}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400 text-[10px]">
                        انضم {new Date(u.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(u)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 transition shadow-2xs"
                    title="نسخ بيانات الدخول"
                  >
                    {copiedId === u.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {!u.is_super_admin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(u.id, u.email)}
                      disabled={deletingId === u.id}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                      title="حذف الحساب"
                    >
                      {deletingId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        💡 <b>ملاحظة إدارية:</b> حساب المشرف العام محمي ولا يمكن حذفه. يمكن للمشرفين بعد تسجيل الدخول تحديث كلمة المرور وصورتهم الشخصية من تبويب &quot;إعدادات الحساب&quot;.
      </div>
    </div>
  );
}
