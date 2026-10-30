'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FileText, 
  Building2, 
  Users, 
  BarChart3, 
  LogOut, 
  ShieldCheck, 
  KeyRound, 
  Menu, 
  X, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  ShieldAlert, 
  ArrowRightLeft,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { authService, AdminUser, ROLES_META } from '@/lib/auth';
import { committeesService } from '@/lib/committeesService';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // فحص المصادقة والجلسة
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // شاشات وقفل
  const [quickPin, setQuickPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // عدد اللجان النشطة للبادج
  const [committeesCount, setCommitteesCount] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const checkAuth = async () => {
    setIsAuthChecking(true);
    try {
      const authed = await authService.isAuthenticated();
      const user = authService.getCurrentUser();
      
      if (user && user.role === 'citizen') {
        setIsAuthenticated(false);
        setCurrentUser(user);
      } else if (authed && user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsAuthChecking(false);
    }
  };

  useEffect(() => {
    checkAuth();
    setCommitteesCount(committeesService.getAll().length);

    const unsubAuth = authService.subscribe(() => {
      checkAuth();
    });

    const unsubComm = committeesService.subscribe(() => {
      setCommitteesCount(committeesService.getAll().length);
    });

    return () => {
      unsubAuth();
      unsubComm();
    };
  }, []);

  // فك القفل بالرمز السريع
  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const result = authService.verifyPasscode(quickPin);
    if (result.valid && result.user) {
      if (result.user.role === 'citizen') {
        setPinError('حساب المواطن مخصص لتقديم ومتابعة الشكاوى فقط.');
        return;
      }
      authService.setSession(result.user);
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      showToast(`مرحباً بك: ${result.user.name}`);
    } else {
      setPinError('رمز المرور غير صحيح. جرب "admin" أو "shabab".');
    }
  };

  // تبديل الدور السريع للاختبار والمعاينة
  const handleSwitchRole = (passcode: string) => {
    const verified = authService.verifyPasscode(passcode);
    if (verified.valid && verified.user) {
      authService.setSession(verified.user);
      setCurrentUser(verified.user);
      setRoleSwitcherOpen(false);
      showToast(`تم التبديل إلى: ${verified.user.name}`);
      if (verified.user.role === 'citizen') {
        router.push('/track');
      }
    }
  };

  // تسجيل الخروج
  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('تم تسجيل الخروج وقفل اللوحة بنجاح');
    router.push('/');
  };

  // 1. حالة التحميل
  if (isAuthChecking) {
    return (
      <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00a3e0] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-[#133063]">جاري التحقق من أمان وصلاحيات الجلسة...</span>
        </div>
      </div>
    );
  }

  // 2. إذا كان المستخدم مواطناً يحاول فتح صفحة المشرف
  if (currentUser && currentUser.role === 'citizen') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#133063]">منطقة مخصصة للمشرفين واللجان</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            أهلاً بك يا <b>{currentUser.name}</b>. بصفتك مسجلاً كـ <b>مواطن</b>، هذه اللوحة مخصصة للجان. يمكنك متابعة طلباتك الخاصة بكل خصوصية.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/track"
              className="w-full py-3 rounded-xl bg-[#133063] text-white text-xs font-extrabold shadow-md hover:bg-[#0d234a] transition"
            >
              الانتقال إلى صفحة متابعة طلباتي
            </Link>
            <button
              type="button"
              onClick={() => handleSwitchRole('admin')}
              className="text-xs font-bold text-[#00a3e0] hover:underline"
            >
              (تجربة المنظومة كأدمن عام)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. إذا لم يكن مسجل الدخول: شاشة القفل والأمان
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden border border-slate-200">
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#ce1126]" />

          <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 text-[#133063] rounded-2xl flex items-center justify-center border border-blue-200">
            <ShieldAlert className="w-8 h-8 text-[#00a3e0]" />
          </div>

          <h2 className="text-xl font-extrabold text-[#133063]">بوابة المشرفين المركزية</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            منطقة مخصصة للمشرفين ورؤساء اللجان وهيئات المتابعة
          </p>

          <form onSubmit={handleUnlockWithPin} className="space-y-4 mb-6">
            <div className="relative">
              <input
                type="password"
                required
                value={quickPin}
                onChange={(e) => setQuickPin(e.target.value)}
                placeholder="اكتب رمز المشرف (admin أو shabab)..."
                className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] text-center tracking-widest"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
            </div>

            {pinError && (
              <p className="text-rose-600 text-xs font-bold leading-relaxed">{pinError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
            >
              فك القفل ودخول لوحة المشرفين
            </button>
          </form>

          {/* أزرار سريعة للاختبار */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-right text-[11px] space-y-2 mb-4">
            <span className="font-extrabold text-slate-700 block">رموز الدخول السريعة:</span>
            
            <div 
              onClick={() => setQuickPin('admin')}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-blue-100/50 cursor-pointer"
            >
              <span className="text-slate-700 font-bold">👑 الأدمن العام (أمانة اللجان):</span>
              <code className="font-mono font-bold text-[#133063] bg-white px-2 py-0.5 rounded border border-slate-200">admin</code>
            </div>

            <div 
              onClick={() => setQuickPin('shabab')}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-cyan-100/50 cursor-pointer"
            >
              <span className="text-slate-700 font-bold">⚡ رئيس لجنة الشباب (أ. سامر التلاوي):</span>
              <code className="font-mono font-bold text-[#00a3e0] bg-white px-2 py-0.5 rounded border border-slate-200">shabab</code>
            </div>

            <div 
              onClick={() => setQuickPin('tanfeez')}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-indigo-100/50 cursor-pointer"
            >
              <span className="text-slate-700 font-bold">🛠️ عضو تنفيذي (م. محمود الجزار):</span>
              <code className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">tanfeez</code>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/"
              className="text-[11px] font-bold text-slate-400 hover:text-[#133063] pt-1"
            >
              العودة للصفحة الرئيسية للمواطنين
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. هيكل لوحة المشرفين المفتوحة والمصادق عليها
  const roleMeta = currentUser?.role ? ROLES_META[currentUser.role] : ROLES_META.admin;

  const adminNavItems = [
    {
      href: '/admin',
      label: 'إدارة الشكاوى والطلبات',
      icon: FileText,
      badge: null,
    },
    {
      href: '/admin/committees',
      label: 'إدارة اللجان المركزية',
      icon: Building2,
      badge: `${committeesCount} لجان`,
    },
    {
      href: '/admin/users',
      label: 'إدارة الأعضاء والأدوار',
      icon: Users,
      badge: 'الأدوار',
    },
    {
      href: '/admin/reports',
      label: 'المؤشرات والرسوم البيانية',
      icon: BarChart3,
      badge: 'KPIs',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-5">
        {/* هوية اللوحة وزر إغلاق الموبايل */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative w-10 h-12 shrink-0">
              <Image
                src="/logo.png"
                alt="شعار حزب مستقبل وطن"
                width={40}
                height={50}
                className="w-full h-full object-contain"
                priority
                unoptimized
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#00a3e0] block">حزب مستقبل وطن</span>
              <h2 className="text-sm font-extrabold text-[#133063] leading-tight">بوابة المشرفين المركزية</h2>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* كارت المشرف الحالي والدور */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500">الحساب النشط:</span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${roleMeta.badgeBg} ${roleMeta.badgeText} shadow-2xs`}>
              {roleMeta.label.split(' ')[0]}
            </span>
          </div>
          <p className="font-extrabold text-[#133063] truncate">
            {currentUser?.name}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {currentUser?.committeeName}
          </p>
        </div>

        {/* روابط الصفحات المسارية الأربعة */}
        <nav className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 px-2 block mb-2 uppercase tracking-wider">
            أقسام الإدارة
          </span>

          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition group ${
                  isActive
                    ? 'bg-[#133063] text-white shadow-md shadow-[#133063]/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition ${
                    isActive ? 'text-[#00a3e0]' : 'text-slate-400 group-hover:text-[#133063]'
                  }`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* الجزء السفلي من الشريط: زر الخروج والروابط */}
      <div className="pt-4 border-t border-slate-200 space-y-2">
        <Link
          href="/"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#133063] hover:bg-slate-100 transition"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-[#00a3e0]" />
            معاينة موقع المواطنين
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج من اللوحة</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-slate-100/70 flex flex-col lg:flex-row min-h-0 relative">
      {/* إشعار الـ Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#133063] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-[#00a3e0] transition-all">
          <Check className="w-4 h-4 text-[#00a3e0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* الـ Sidebar الديسكتوب: مثبت جانبي لا يتداخل أو يبرز فوق الناف بار إطلاقاً */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-l border-slate-200 p-5 flex-col justify-between shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto z-20 no-print">
        {sidebarContent}
      </aside>

      {/* ستارة الموبايل المعتمة عند فتح القائمة */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden"
        />
      )}

      {/* درج الموبايل المنزلق للسايد بار */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {sidebarContent}
      </div>

      {/* المحتوى الرئيسي للوحة مع شريط علوي نظيف ومضبوط لمختلف مقاسات الشاشات */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200"
              aria-label="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* زر العودة الذكي */}
            <button
              type="button"
              onClick={() => {
                if (pathname === '/admin') {
                  router.push('/');
                } else {
                  router.push('/admin');
                }
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="العودة"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">العودة</span>
            </button>

            <div className="truncate">
              <span className="text-[10px] font-bold text-slate-400 block leading-tight">بوابة المشرفين</span>
              <h1 className="text-xs sm:text-sm font-extrabold text-[#133063] truncate">
                {pathname === '/admin/committees'
                  ? '🏛️ إدارة اللجان المركزية'
                  : pathname === '/admin/users'
                  ? '👥 إدارة الأعضاء والأدوار'
                  : pathname === '/admin/reports'
                  ? '📊 المؤشرات والرسوم البيانية'
                  : '📋 إدارة ومراجعة الشكاوى'}
              </h1>
            </div>
          </div>

          {/* تبديل الدور السريع للاختبار وحالة الجلسة */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                title="تبديل الدور للتجربة والمعاينة"
              >
                <span className="text-[10px] text-slate-400 hidden sm:inline">الدور:</span>
                <span className="text-[#133063] text-xs font-extrabold">{roleMeta.label.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 mb-1">
                    تبديل الدور للتجربة والاختبار:
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('admin')}
                    className="w-full text-right p-2 rounded-xl hover:bg-blue-50 text-[#133063] font-bold flex items-center justify-between"
                  >
                    <span>👑 المشرف العام (Admin)</span>
                    {currentUser?.role === 'admin' && <Check className="w-3.5 h-3.5 text-[#00a3e0]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('shabab')}
                    className="w-full text-right p-2 rounded-xl hover:bg-cyan-50 text-[#00a3e0] font-bold flex items-center justify-between"
                  >
                    <span>⚡ رئيس لجنة الشباب</span>
                    {currentUser?.role === 'committee_head' && <Check className="w-3.5 h-3.5 text-[#00a3e0]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('tanfeez')}
                    className="w-full text-right p-2 rounded-xl hover:bg-indigo-50 text-indigo-700 font-bold flex items-center justify-between"
                  >
                    <span>🛠️ عضو تنفيذي معتمد</span>
                    {currentUser?.role === 'executive_member' && <Check className="w-3.5 h-3.5 text-[#00a3e0]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('member')}
                    className="w-full text-right p-2 rounded-xl hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-between"
                  >
                    <span>📋 عضو لجنة عادي</span>
                    {currentUser?.role === 'member' && <Check className="w-3.5 h-3.5 text-[#00a3e0]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('citizen')}
                    className="w-full text-right p-2 rounded-xl hover:bg-emerald-50 text-emerald-700 font-bold flex items-center justify-between"
                  >
                    <span>👤 مواطن مسجل</span>
                    {currentUser?.role === 'citizen' && <Check className="w-3.5 h-3.5 text-[#00a3e0]" />}
                  </button>
                </div>
              )}
            </div>

            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              جلسة آمنة
            </span>
          </div>
        </header>

        {/* جسم الصفحة الرئيسي المجهز لمنع أي شطحات أو خروج عن حدود الشاشة في الموبايل */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
