'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Users,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { authService, UserRole, ROLES_META } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('citizen');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(true); // افتراضياً وضع الدخول المباشر للأدوار لسهولة التجربة

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. تسجيل الدخول بـ Google
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isSupabaseConfigured && supabase) {
        const targetRedirect = redirectParam || '/admin';
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetRedirect)}`,
          },
        });
        if (error) throw error;
      } else {
        // نمط المحاكاة الفوري
        authService.setSession({
          email: 'citizen@mostaqbal-watan.org',
          name: 'مواطن مسجل (Google)',
          role: 'citizen',
          committeeId: 'youth',
          committeeName: 'لجنة رعاية الشباب',
          loggedInAt: new Date().toISOString(),
        });
        router.push(redirectParam || '/track');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول عبر Google');
      setIsLoading(false);
    }
  };

  // 2. تسجيل الدخول بالرمز السريع للأدوار أو البريد الإلكتروني
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // التحقق من كود المشرف / الدور السريع
    if (isAdminMode) {
      const verified = authService.verifyPasscode(adminPasscode);
      if (verified.valid && verified.user) {
        authService.setSession(verified.user);
        const destination = redirectParam 
          ? redirectParam 
          : verified.user.role === 'citizen' ? '/track' : '/admin';
        router.push(destination);
        return;
      } else {
        setErrorMsg('رمز المرور غير صحيح. يمكنك الضغط على أحد الأدوار السريعة بالأسفل للاختبار.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const lower = email.toLowerCase();
      let determinedRole: UserRole = 'citizen';
      let compName = 'لجنة رعاية الشباب';
      let compId = 'youth';

      if (lower.includes('admin') || lower.includes('super')) {
        determinedRole = 'admin';
        compName = 'كافة لجان حزب مستقبل وطن';
        compId = 'all';
      } else if (lower.includes('talawe') || lower.includes('shabab') || lower.includes('head')) {
        determinedRole = 'committee_head';
      } else if (lower.includes('gazzar') || lower.includes('exec')) {
        determinedRole = 'executive_member';
      } else if (lower.includes('azab') || lower.includes('member')) {
        determinedRole = 'member';
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        authService.setSession({
          email: data.user?.email || email,
          name: data.user?.user_metadata?.full_name || (determinedRole === 'admin' ? 'الأدمن العام' : 'مسؤول المنظومة'),
          role: determinedRole,
          committeeId: compId,
          committeeName: compName,
          loggedInAt: new Date().toISOString(),
        });
      } else {
        // فحص محلي
        authService.setSession({
          email,
          name: determinedRole === 'admin' ? 'الأدمن العام' : fullName || 'مستخدم معتمد',
          role: determinedRole,
          committeeId: compId,
          committeeName: compName,
          loggedInAt: new Date().toISOString(),
        });
      }

      const destination = redirectParam 
        ? redirectParam 
        : determinedRole === 'citizen' ? '/track' : '/admin';
      router.push(destination);
    } catch (err: any) {
      setErrorMsg(err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      setIsLoading(false);
    }
  };

  // 3. إنشاء حساب جديد بالبريد الإلكتروني مع اختيار نوع الحساب
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('يرجى إدخال الاسم بالكامل.');
      setIsLoading(false);
      return;
    }

    try {
      const compName = signupRole === 'admin' ? 'كافة لجان حزب مستقبل وطن' : 'لجنة رعاية الشباب';
      const compId = signupRole === 'admin' ? 'all' : 'youth';

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: signupRole,
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          authService.setSession({
            email,
            name: fullName.trim(),
            role: signupRole,
            committeeId: compId,
            committeeName: compName,
            loggedInAt: new Date().toISOString(),
          });
          router.push(signupRole === 'citizen' ? '/track' : '/admin');
          return;
        }

        setSuccessMsg('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول مباشرة.');
        setActiveTab('signin');
      } else {
        authService.setSession({
          email,
          name: fullName.trim(),
          role: signupRole,
          committeeId: compId,
          committeeName: compName,
          loggedInAt: new Date().toISOString(),
        });
        router.push(signupRole === 'citizen' ? '/track' : '/admin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* شريط زينة علوي بهوية مستقبل وطن والعلم المصري */}
        <div className="absolute top-0 right-0 left-0 h-2.5 bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#ce1126]" />

        {/* رأس الصفحة مع الشعار الرسمي */}
        <div className="text-center mb-6 pt-2">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <Image
              src="/logo.png"
              alt="شعار حزب مستقبل وطن"
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
              unoptimized
            />
          </div>
          <span className="text-xs font-bold text-[#00a3e0] tracking-wider block">
            حزب مستقبل وطن
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#133063] mt-0.5">
            بوابة تسجيل الدخول والأدوار
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            صلاحيات المشرفين، رؤساء اللجان، الأعضاء التنفيذيين، والمواطنين
          </p>
        </div>

        {/* تبويبات التبديل بين تسجيل الدخول وإنشاء حساب */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'signin'
                ? 'bg-white text-[#133063] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تسجيل الدخول المباشر
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'signup'
                ? 'bg-white text-[#133063] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {/* التنبيهات والرسائل */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#133063] text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00a3e0] shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* زر الدخول السريع عبر Google بضغطة زر */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            دخول فوري بحساب Google
          </button>
        </div>

        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400">
            أو اختيار الدور برمز الدخول السريع
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* نموذج تسجيل الدخول */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            {isAdminMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#133063] mb-1.5">
                    اكتب رمز المرور أو اضغط على الدور المطلوب بالأسفل:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="اكتب رمز المرور (admin, shabab, tanfeez, member, citizen)..."
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] text-center font-mono tracking-wider"
                      dir="ltr"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

                {/* أزرار سريعة للأدوار الخمسة مع بيان الصلاحيات */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] space-y-2">
                  <div className="font-extrabold text-[#133063] flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#00a3e0]" />
                    <span>الأدوار المعتمدة (اضغط للاختيار السريع):</span>
                  </div>

                  {/* 1. الأدمن العام */}
                  <div 
                    onClick={() => setAdminPasscode('admin')}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-blue-100/60 cursor-pointer transition border border-transparent hover:border-blue-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#133063] text-white flex items-center justify-center text-[10px] font-bold">👑</span>
                      <div>
                        <b className="text-[#133063] block">الأدمن العام (أمانة اللجان)</b>
                        <span className="text-[10px] text-slate-500">صلاحيات كاملة + إضافة لجان جديدة</span>
                      </div>
                    </div>
                    <code className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-[#133063]">
                      admin
                    </code>
                  </div>

                  {/* 2. رئيس اللجنة */}
                  <div 
                    onClick={() => setAdminPasscode('shabab')}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-cyan-100/60 cursor-pointer transition border border-transparent hover:border-cyan-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#00a3e0] text-white flex items-center justify-center text-[10px] font-bold">⚡</span>
                      <div>
                        <b className="text-[#00a3e0] block">رئيس اللجنة (أ. سامر التلاوي)</b>
                        <span className="text-[10px] text-slate-500">اعتماد نهائي وتأشيرات اللجنة</span>
                      </div>
                    </div>
                    <code className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-[#00a3e0]">
                      shabab
                    </code>
                  </div>

                  {/* 3. عضو تنفيذي */}
                  <div 
                    onClick={() => setAdminPasscode('tanfeez')}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-indigo-100/60 cursor-pointer transition border border-transparent hover:border-indigo-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">🛠️</span>
                      <div>
                        <b className="text-indigo-800 block">عضو تنفيذي (م. محمود الجزار)</b>
                        <span className="text-[10px] text-slate-500">متابعة ميدانية وإضافة ملاحظات</span>
                      </div>
                    </div>
                    <code className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-indigo-700">
                      tanfeez
                    </code>
                  </div>

                  {/* 4. عضو عادي */}
                  <div 
                    onClick={() => setAdminPasscode('member')}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-200/60 cursor-pointer transition border border-transparent hover:border-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">📋</span>
                      <div>
                        <b className="text-slate-800 block">عضو عادي (أ. محمد العزب)</b>
                        <span className="text-[10px] text-slate-500">متابعة وعرض طلبات لجنته</span>
                      </div>
                    </div>
                    <code className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-700">
                      member
                    </code>
                  </div>

                  {/* 5. مواطن */}
                  <div 
                    onClick={() => setAdminPasscode('citizen')}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-emerald-100/60 cursor-pointer transition border border-transparent hover:border-emerald-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">👤</span>
                      <div>
                        <b className="text-emerald-800 block">مواطن (أحمد محمود)</b>
                        <span className="text-[10px] text-slate-500">تقديم ومتابعة طلباته الخاصة بخصوصية</span>
                      </div>
                    </div>
                    <code className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-emerald-700">
                      citizen
                    </code>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@mostaqbal-watan.org"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                      dir="ltr"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                      dir="ltr"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white font-bold text-xs shadow-md transition active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#00a3e0]" />
              )}
              {isAdminMode ? 'دخول بالدور المحدد' : 'دخول المنظومة'}
            </button>

            {/* زر التبديل لنمط المشرف السريع */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsAdminMode(!isAdminMode)}
                className="text-[11px] font-bold text-[#00a3e0] hover:underline"
              >
                {isAdminMode ? 'أو الدخول بالبريد الإلكتروني التقليدي' : 'العودة للدخول السريع برمز الدور'}
              </button>
            </div>
          </form>
        )}

        {/* نموذج إنشاء حساب جديد */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الاسم بالكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله السعدني"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نوع الحساب المطلوب
              </label>
              <select
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value as UserRole)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] bg-white"
              >
                <option value="citizen">👤 حساب مواطن (لتقديم ومتابعة الشكاوى)</option>
                <option value="member">📋 عضو لجنة رعاية الشباب (متابعة ميدانية)</option>
                <option value="executive_member">🛠️ عضو تنفيذي معتمد</option>
                <option value="committee_head">⚡ رئيس لجنة نوعية</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white font-bold text-xs shadow-md transition active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#00a3e0]" />
              )}
              إنشاء الحساب ودخول المنظومة
            </button>
          </form>
        )}

        {/* العودة لوضع الزائر */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#133063] transition"
          >
            لست مسؤولاً؟ قدّم طلبك مباشرة كزائر بدون حساب
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">جاري تحميل صفحة الدخول...</div>}>
      <LoginContent />
    </Suspense>
  );
}
