'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  FilePlus, 
  Search, 
  Menu, 
  X, 
  Download, 
  Home,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { authService, AdminUser } from '@/lib/auth';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function NavbarInner() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
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
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/submit', label: 'تقديم طلب جديد', icon: FilePlus },
    { href: '/track', label: 'متابعة الطلبات', icon: Search },
    { href: '/committee', label: 'قيادات وأعضاء اللجنة', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs no-print">
      {/* شريط زينة علوي بهوية ألوان مستقبل وطن */}
      <div className="h-1 w-full bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#ce1126]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* الشعار واسم الحزب واللجنة بحجم نظيف ومرتب بدون أي شعارات زائدة */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-12 h-14 sm:w-14 sm:h-16 shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="شعار حزب مستقبل وطن"
                width={65}
                height={75}
                className="w-full h-full object-contain"
                priority
                unoptimized
              />
            </div>
            <div className="border-r border-slate-200 pr-3">
              <span className="block text-xs sm:text-sm font-bold text-[#00a3e0] tracking-wide">
                حزب مستقبل وطن
              </span>
              <span className="block text-base sm:text-lg font-black text-[#133063] group-hover:text-[#00a3e0] transition leading-tight">
                لجنة رعاية الشباب
              </span>
            </div>
          </Link>

          {/* روابط سطح المكتب */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
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

          {/* الجزء الأيسر: زر واحد كبير وأنيق يوجه مباشرة للوحة الأدمن */}
          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="hidden md:inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                تثبيت التطبيق
              </button>
            )}

            {/* الأيقونة والزر الموحد للذهاب إلى لوحة الأدمن */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs sm:text-sm font-black shadow-md shadow-[#133063]/25 active:scale-95 transition"
              title="اتجه إلى لوحة الأدمن"
            >
              <LayoutDashboard className="w-4 h-4 text-[#00a3e0] shrink-0" />
              <span>اتجه إلى لوحة الأدمن</span>
            </Link>

            {/* زر قائمة الموبايل للشاشات الصغيرة */}
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

      {/* قائمة الموبايل المنسدلة النظيفة */}
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
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#133063] text-white text-xs font-black shadow-md"
            >
              <LayoutDashboard className="w-4 h-4 text-[#00a3e0]" />
              اتجه إلى لوحة الأدمن
            </Link>
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
