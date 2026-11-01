import React, { Suspense } from 'react';
import AdminLayoutClient from './AdminLayoutClient';
import { requireUser } from '@/lib/supabase/server';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#133063] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-600">جاري التحقق من الصلاحيات...</span>
          </div>
        </div>
      }
    >
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  // حارس على الخادم: لا يمكن الوصول للوحة بمجرد التلاعب بحالة المتصفح.
  const user = await requireUser('/admin');
  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
