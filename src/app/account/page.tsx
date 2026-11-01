import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Building2,
  FileText,
  BarChart3,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
} from 'lucide-react';
import { requireUser } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/LogoutButton';

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs font-bold text-slate-500">
          جاري تحميل بيانات الحساب...
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const user = await requireUser('/account');

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full flex-1 space-y-6">
      {/* 1. الترويسة الرئيسية */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#ce1126]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                الحساب الإداري الموحد
              </span>
              <span className="text-xs font-bold text-slate-400">• أمانة مركز بركة السبع</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#133063]">
              الملف الشخصي للحساب الموحد
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              بيانات الدخول والصلاحيات الرسمية لإدارة منظومة حزب مستقبل وطن.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold transition shadow-2xs self-start sm:self-auto"
          >
            <BarChart3 className="w-4 h-4 text-[#00a3e0]" />
            <span>لوحة المشرفين</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. بطاقة إشعار إيقاف تعديل الحساب */}
      <div className="bg-amber-50/80 border-2 border-amber-200 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-2.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-200 text-amber-900">
                تنبيه أمان وتنظيم
              </span>
              <strong className="text-xs sm:text-sm font-black text-amber-950">
                تم إيقاف تعديل الحساب مؤقتاً
              </strong>
            </div>

            <p className="text-xs text-amber-950/90 font-medium leading-relaxed">
              نظراً لاعتماد المنظومة على الدخول الإداري المركزي الموحد باسم <strong>الأستاذ / محمد هلال (أمين مركز بركة السبع)</strong>،
              فقد تم إيقاف تعديل الاسم وكلمة المرور والبيانات الشخصية مؤقتاً لضمان استقرار جلسة العمل خلال مرحلة العرض والتشغيل الميداني.
            </p>

            <div className="text-[11px] text-amber-900 font-bold bg-white/70 p-3 rounded-xl border border-amber-200/80">
              💡 للدخول إلى المنظومة في أي وقت، يتم استخدام كلمة المرور المعتمدة فقط دون الحاجة لتعديل بيانات الحساب.
            </div>
          </div>
        </div>
      </div>

      {/* 3. بطاقة بيانات المشرف المعتمد الحالية */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#133063] text-white flex items-center justify-center font-black text-base shadow-xs">
              م
            </div>
            <div>
              <h2 className="text-base font-black text-[#133063]">
                الأستاذ / محمد هلال
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                أمين مركز بركة السبع - المشرف العام المعتمد
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            سوبر أدمن (مفعل)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">الجهة التنظيمية</span>
            <strong className="text-slate-800 font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#00a3e0]" />
              حزب مستقبل وطن - أمانة مركز بركة السبع
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">المقر الميداني</span>
            <strong className="text-slate-800 font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              بجوار كافيه كارليتوس - بركة السبع
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">أرقام التواصل والتنسيق</span>
            <strong className="text-slate-800 font-mono text-[11px]" dir="ltr">
              01012920967 - 01004744265
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">حالة الأمان والحماية</span>
            <strong className="text-emerald-700 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              حساب موحد محمي مركزياً ضد التعديل
            </strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <Link
            href="/admin/complaints"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <FileText className="w-4 h-4 text-[#00a3e0]" />
            <span>الانتقال لجدول الشكاوى</span>
          </Link>

          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
