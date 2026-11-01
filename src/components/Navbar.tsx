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
    authService.refresh().then((user) => {
      if (active) setCurrentUser(user);
    });

    const unsubscribe = authService.subscribe(() => {
      setCurrentUser(authService.getCurrentUser());
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

  // إغلاق قائمة المستخدم تلقائياً عند التمرير (التحرك) لتفادي تغطية المحتوى
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-11 h-13 sm:w-13 sm:h-16 shrink-0 transition-transform group-hover:scale-105">
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
            <div className="border-r border-slate-200 pr-3">
              <span className="block text-[11px] sm:text-xs font-bold text-[#00a3e0] tracking-wide">
                حزب مستقبل وطن • بركة السبع
              </span>
              <span className="block text-sm sm:text-base font-black text-[#133063] group-hover:text-[#00a3e0] transition leading-tight">
                أمانة الشباب
              </span>
            </div>
          </Link>

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

          <div className="flex items-center gap-2.5">
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

            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border-2 border-[#133063]/20 hover:border-[#00a3e0] bg-white transition-all flex items-center justify-center p-0.5 cursor-pointer shadow-2xs group"
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
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition active:scale-95"
              >
                <LogIn className="w-4 h-4 text-[#00a3e0] shrink-0" />
                <span>تسجيل الدخول</span>
              </Link>
            )}

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

            <Link
              href={accountHref}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#133063] text-white text-xs font-bold shadow-md"
            >
              {!currentUser ? (
                <LogIn className="w-4 h-4 text-[#00a3e0]" />
              ) : isStaff ? (
                <LayoutDashboard className="w-4 h-4 text-[#00a3e0]" />
              ) : (
                <UserCircle className="w-4 h-4 text-[#00a3e0]" />
              )}
              {accountLabel}
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
    <Suspense fallback={<header className="h-20 bg-white border-b border-slate-200/80" />}>
      <NavbarInner />
    </Suspense>
  );
};
