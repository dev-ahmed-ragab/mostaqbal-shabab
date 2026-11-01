import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  ShieldCheck,
  ArrowLeft,
  Camera,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { createClient, requireUser } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/LogoutButton';
import ProfileEditor from './ProfileEditor';

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs font-bold text-slate-500">
          جاري تحميل حسابك...
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const user = await requireUser('/account');
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, username, avatar_url, is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full flex-1">
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#ce1126]" />

        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-[#00a3e0] block mb-1">
              حسابي الشخصي
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#133063]">
              {profile?.full_name || user.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1" dir="ltr">{user.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-blue-50 text-[#133063] border border-blue-200 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {user.isSuperAdmin ? 'سوبر أدمن' : 'أدمن'}
            </span>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold transition"
          >
            لوحة المشرفين
            <ArrowLeft className="w-4 h-4 text-[#00a3e0]" />
          </Link>
        </div>

        <ProfileEditor
          userId={user.id}
          initialName={profile?.full_name || user.name}
          initialUsername={profile?.username || ''}
          initialAvatar={profile?.avatar_url || user.avatar || ''}
        />
      </div>

      <div className="flex justify-end">
        <LogoutButton />
      </div>
    </div>
  );
}
