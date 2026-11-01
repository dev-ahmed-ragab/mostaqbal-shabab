import React, { Suspense } from 'react';
import { requireAdmin } from '@/lib/supabase/server';

export default function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-6 text-xs font-bold text-slate-500">جاري التحميل...</div>}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin('/admin/users');
  return <>{children}</>;
}
