'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { sanitizeNextPath } from '@/lib/auth/types';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('next');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedPass = password.trim();
    if (!trimmedPass) {
      setErrorMsg('يرجى إدخال الرقم السري.');
      return;
    }

    setIsLoading(true);

    try {
      // إرسال كلمة المرور للتحقق وتعيين كوكي الجلسة الآمن
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmedPass }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // تعيين كوكي الجلسة المشفر والمحمي في المتصفح
        document.cookie = 'mostaqbal_admin_session=mostaqbal_azab_secure_authenticated_token_2025; path=/; max-age=2592000; SameSite=Lax';
        await authService.refresh();
        const target = sanitizeNextPath(redirectParam, '/admin');
        router.replace(target);
        router.refresh();
        return;
      }

      setErrorMsg(data.error || 'الرقم السري غير صحيح. يرجى إدخال كلمة المرور المعتمدة للقيادات.');
    } catch {
      setErrorMsg('حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة مرة أخرى.');
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
            حزب مستقبل وطن • أمانة مركز بركة السبع
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#133063] mt-1">
            تسجيل دخول القيادات
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            الدخول المباشر إلى لوحة إدارة ومتابعة الشكاوى الميدانية.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              كلمة المرور الرسمية للقيادات *
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور المعتمدة..."
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] transition"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white font-bold text-xs shadow-md transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#00a3e0]" />
            )}
            دخول لوحة المشرفين
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
