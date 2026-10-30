import React, { Suspense } from 'react';
import AdminLayoutClient from './AdminLayoutClient';

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
            <span className="text-sm font-semibold text-slate-600">جاري تحميل لوحة المشرفين...</span>
          </div>
        </div>
      }
    >
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Suspense>
  );
}
