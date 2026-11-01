'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  homePathForRole,
  sanitizeNextPath,
  type UserRole,
} from '@/lib/auth/types';

function destinationFor(_role: UserRole, rawNext: string | null): string {
  const home = '/admin';
  const safe = sanitizeNextPath(rawNext, home);
  return safe;
}

async function readRole(_userId: string): Promise<UserRole> {
  return 'admin';
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('next');
  const callbackError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    switch (callbackError) {
      case 'auth_failed':
        return 'تعذّر تأكيد رابط الدخول. يرجى تسجيل الدخول بالبريد وكلمة المرور.';
      case 'missing_code':
        return 'رابط الدخول غير مكتمل. يرجى إعادة المحاولة.';
      case 'not_configured':
        return 'خدمة الدخول غير مهيأة على الخادم. يرجى التواصل مع مسؤول المنظومة.';
      default:
        return null;
    }
  });

  const ensureConfigured = () => {
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('خدمة الدخول غير مهيأة حالياً. يرجى التواصل مع مسؤول المنظومة.');
      setIsLoading(false);
      return false;
    }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!ensureConfigured() || !supabase) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.user) {
        throw new Error('invalid');
      }
      router.replace(destinationFor('admin', redirectParam));
      router.refresh();
    } catch {
      setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب غير مفعّل.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-2.5 bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#ce1126]" />

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
            تسجيل دخول الإدارة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            دخول فريق العمل إلى لوحة المشرفين.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

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
            دخول المنظومة
          </button>
        </form>

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
