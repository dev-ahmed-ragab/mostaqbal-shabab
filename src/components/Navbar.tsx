'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  FilePlus,
  Search,
  Menu,
  X,
  Download,
  Home,
  Users,
  LogIn,
  UserCircle,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { authService, type AdminUser } from '@/lib/auth';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function NavbarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    // جلب حالة تسجيل الدخول الحالية فور تحميل الصفحة
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (active) setCurrentUser(user);
      } catch {
        if (active) setCurrentUser(null);
      }
    };
    checkAuth();

    // الاشتراك في تغييرات حالة المصادقة
    const unsubscribe = authService.subscribe(() => {
      if (active) {
        checkAuth();
      }
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // إغلاق قائمة المستخدم تلقائياً عند التمرير
  useEffect(() => {
    const handleScroll = () => {
      if (userMenuOpen) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [userMenuOpen]);

  // إغلاق القوائم عند التنقل بين المسارات
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleLogout = async () => {
    await authService.logout();
    setMobileMenuOpen(false);
    router.replace('/');
    router.refresh();
  };

  // قائمة الروابط في النافبار (تم إزالة الـ QR بناءً على طلب المستخدم)
  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/submit', label: 'تقديم طلب جديد', icon: FilePlus },
    { href: '/track', label: 'متابعة الطلبات', icon: Search },
    { href: '/committee', label: 'قيادات وأعضاء الأمانة', icon: Users },
  ];

  const isStaff = !!currentUser;
  const accountHref = currentUser ? '/admin' : '/login';
  const accountLabel = !currentUser ? 'تسجيل الدخول' : isStaff ? 'لوحة المشرفين' : 'حسابي';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* الشعار والهوية - متجاوب بدقة حتى للشاشات الصغيرة جداً أقل من 300px */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink min-w-0">
            <div className="relative w-9 h-11 sm:w-13 sm:h-16 shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="شعار حزب مستقبل وطن"
                width={56}
                height={68}
                className="w-full h-full object-contain"
                priority
                unoptimized
              />
            </div>
            <div className="border-r border-slate-200 pr-2 sm:pr-3 min-w-0">
              <span className="hidden min-[360px]:block text-[10px] sm:text-xs font-bold text-[#00a3e0] tracking-wide truncate">
                حزب مستقبل وطن • بركة السبع
              </span>
              <span className="block text-xs sm:text-base font-black text-[#133063] group-hover:text-[#00a3e0] transition leading-tight truncate">
                أمانة الشباب
              </span>
              <span className="hidden sm:block text-[10px] sm:text-[11px] font-bold text-slate-500 leading-tight mt-0.5 truncate">
                أمـين الشباب: م. محمد العزب
              </span>
            </div>
          </Link>

          {/* روابط الديسكتوب فقط */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                    isActive
                      ? 'bg-blue-50 text-[#133063] border border-blue-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-[#133063] hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00a3e0]' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* الإجراءات على اليسار */}
          <div className="flex items-center gap-2 shrink-0">
            {/* زر التثبيت في الديسكتوب فقط */}
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                تثبيت التطبيق
              </button>
            )}

            {/* حالة المستخدم المسجل (قائمة المشرف) */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl border-2 border-[#133063]/20 hover:border-[#00a3e0] bg-white transition-all flex items-center justify-center p-0.5 cursor-pointer shadow-2xs group"
                  aria-expanded={userMenuOpen}
                  title={`${currentUser.name} (لوحة التحكم)`}
                >
                  {currentUser.avatar_url || currentUser.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatar_url || currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full rounded-[14px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[14px] bg-[#133063] group-hover:bg-[#00a3e0] text-white flex items-center justify-center font-extrabold text-xs sm:text-sm transition-colors shadow-inner">
                      {currentUser.name ? currentUser.name.trim().charAt(0) : 'م'}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setUserMenuOpen(false)} 
                    />
                    <div className="absolute left-0 mt-2.5 w-60 rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-2 z-40 text-right animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1.5 bg-slate-50/80 rounded-2xl">
                        <p className="text-xs font-black text-[#133063] truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">{currentUser.email}</p>
                        <span className="inline-block mt-1 text-[9.5px] font-extrabold text-[#00a3e0] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          مشرف أمانة الشباب
                        </span>
                      </div>

                      <div className="space-y-0.5 text-xs font-bold text-slate-700">
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#00a3e0]" />
                          <span>لوحة الإحصائيات</span>
                        </Link>

                        <Link
                          href="/admin/complaints"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                        >
                          <FileText className="w-4 h-4 text-[#00a3e0]" />
                          <span>إدارة الشكاوى</span>
                        </Link>

                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                        >
                          <UserCircle className="w-4 h-4 text-[#00a3e0]" />
                          <span>إعدادات الحساب</span>
                        </Link>
                      </div>

                      <div className="pt-1 mt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition text-xs font-bold cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>تسجيل الخروج</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* زر تسجيل الدخول يظهر فقط في الشاشات العريضة (Desktop / Tablet) ولا يزاحم الموبايل */
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition active:scale-95"
              >
                <LogIn className="w-4 h-4 text-[#00a3e0] shrink-0" />
                <span>تسجيل الدخول</span>
              </Link>
            )}

            {/* زر القائمة للشاشات المتوسطة والصغيرة */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* القائمة المنسدلة للشاشات الصغيرة والموبايل */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                  isActive
                    ? 'bg-blue-50 text-[#133063]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#00a3e0]' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}

          {/* قسم الأزرار المخصصة للموبايل (تسجيل الدخول والتثبيت مدمجين هنا) */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold"
              >
                <Download className="w-4 h-4 text-amber-700" />
                تثبيت المنصة كتطبيق على الهاتف
              </button>
            )}

            {/* زر تسجيل الدخول المباشر داخل القائمة للموبايل */}
            <Link
              href={accountHref}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs sm:text-sm font-bold shadow-md transition"
            >
              {!currentUser ? (
                <>
                  <LogIn className="w-4 h-4 text-sky-300" />
                  <span>تسجيل الدخول</span>
                </>
              ) : isStaff ? (
                <>
                  <LayoutDashboard className="w-4 h-4 text-sky-300" />
                  <span>لوحة المشرفين</span>
                </>
              ) : (
                <>
                  <UserCircle className="w-4 h-4 text-sky-300" />
                  <span>حسابي</span>
                </>
              )}
            </Link>

            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export const Navbar: React.FC = () => {
  return (
    <Suspense fallback={<header className="h-16 sm:h-20 bg-white border-b border-slate-200/80" />}>
      <NavbarInner />
    </Suspense>
  );
};
