'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  UserCircle,
} from 'lucide-react';
import {
  authService,
  type AdminUser,
} from '@/lib/auth';

export default function AdminLayoutClient({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // نملأ ذاكرة العرض المؤقتة بالمستخدم الذي تم التحقق منه على الخادم.
  authService.prime(user);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // إذا كنا في صفحة طباعة مستند الشكوى، يتم عرض الصفحة مباشرة بملء الشاشة بدون السايد بار لتسهيل المعاينة والطباعة
  if (pathname?.startsWith('/admin/print')) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/login');
    router.refresh();
  };

  const isSuperAdmin = !!user.isSuperAdmin;

  const adminNavItems = [
    {
      href: '/admin',
      label: 'لوحة الإحصائيات',
      icon: LayoutDashboard,
      badge: null,
      adminOnly: false,
    },
    {
      href: '/admin/complaints',
      label: 'إدارة الشكاوى والطلبات',
      icon: FileText,
      badge: null,
      adminOnly: false,
    },
    {
      href: '/admin/users',
      label: 'إدارة المستخدمين',
      icon: Users,
      badge: null,
      adminOnly: true,
    },
    {
      href: '/account',
      label: 'إعدادات الحساب',
      icon: UserCircle,
      badge: null,
      adminOnly: false,
    },
  ].filter((item) => !item.adminOnly || isSuperAdmin);

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-5">
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
              <h2 className="text-sm font-extrabold text-[#133063] leading-tight">بوابة المشرفين</h2>
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

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="w-9 h-9 rounded-xl bg-[#133063] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {user.name ? user.name.slice(0, 1) : 'م'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-[#133063] truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate" dir="ltr">{user.email}</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 px-2 block mb-2 uppercase tracking-wider">
            أقسام الإدارة
          </span>

          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
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
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-[#00a3e0]' : 'text-slate-400 group-hover:text-[#133063]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

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
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-98"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-slate-100/70 flex flex-col lg:flex-row min-h-0 relative">
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-l border-slate-200 p-5 flex-col justify-between shrink-0 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto z-20 no-print">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden"
        />
      )}

      <div
        className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl p-5 flex flex-col justify-between transform transition-all duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0 opacity-100 visible' : 'translate-x-full opacity-0 invisible pointer-events-none'}
      `}
      >
        {sidebarContent}
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* شريط ملاحة مخصص للهواتف المحمولة فقط لفتح القائمة الجانبية */}
        <div className="lg:hidden h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 no-print">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs font-bold"
            aria-label="فتح القائمة"
          >
            <Menu className="w-4 h-4 text-[#00a3e0]" />
            <span>قائمة لوحة المشرفين</span>
          </button>

          <span className="text-xs font-black text-[#133063]">أمانة مركز بركة السبع</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
