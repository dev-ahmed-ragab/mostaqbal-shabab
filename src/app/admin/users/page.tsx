'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ArrowLeft,
  FileText,
  BarChart3,
  CheckCircle2,
  Lock,
  Building2,
  AlertTriangle,
} from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. ترويسة الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
              قرار تنظيمي
            </span>
            <span className="text-xs font-bold text-slate-400">• أمانة مركز بركة السبع</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#133063] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00a3e0]" />
            إدارة المستخدمين والمشرفين
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة حسابات فرق العمل والمشرفين الميدانيين وصلاحيات فحص الطلبات.
          </p>
        </div>

        <Link
          href="/admin/complaints"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold transition shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <FileText className="w-4 h-4 text-[#00a3e0]" />
          <span>متابعة الشكاوى</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. بطاقة إشعار التأجيل الرسمي */}
      <div className="bg-amber-50/70 border-2 border-amber-200/90 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
        
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-200/80 text-amber-900">
                إشعار إداري عاجل
              </span>
              <span className="text-xs font-extrabold text-amber-900">
                تم تأجيل وإيقاف إدارة المستخدمين وتعدد المشرفين مؤقتاً
              </span>
            </div>

            <p className="text-xs sm:text-sm text-amber-950/90 font-medium leading-relaxed">
              بناءً على التوجيهات التنظيمية الخاصة بمرحلة التشغيل والعرض الميداني لمنظومة حزب مستقبل وطن بمركز بركة السبع، 
              <strong> تم تأجيل ميزة إضافة حسابات مشرفين فرعيين أو حذفها مؤقتاً</strong>.
            </p>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-200 text-xs text-amber-900 space-y-1.5 font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>المنظومة تعمل حالياً بكامل طاقتها بنظام الدخول المركزي الموحد.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>يتم تسجيل الدخول مباشرة بكلمة المرور الإدارية المعتمدة لعرض كافة الوظائف.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. بطاقة بيانات المشرف الإداري الموحد المعتمد */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#133063] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#00a3e0]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#133063]">الحساب الإداري المعتمد الوحيد</h2>
              <p className="text-[11px] text-slate-400">الحساب المخصص لإدارة المنظومة ومتابعة الطلبات الميدانية</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            نشط ومفعل
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">المشرف المعتمد</span>
            <strong className="text-sm font-black text-[#133063] block">الأستاذ / محمد هلال</strong>
            <span className="text-xs text-slate-600 font-bold mt-0.5 block">أمين مركز بركة السبع - حزب مستقبل وطن</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">مستوى الصلاحية</span>
            <strong className="text-sm font-black text-emerald-700 block">مشرف عام مركزي (سوبر أدمن)</strong>
            <span className="text-xs text-slate-600 font-bold mt-0.5 block">صلاحية شاملة لكافة الأقسام والشكاوى والطباعة</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">النطاق الجغرافي للمتابعة</span>
            <strong className="text-sm font-black text-[#133063] block">مدينة بركة السبع وقراها</strong>
            <span className="text-xs text-slate-600 font-bold mt-0.5 block">طوخ طنبشا، هورين، شنتنا الحجر، الشهيد فكري، ميت فارس، كفر هلال وغيرها</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">حالة تسجيل الدخول</span>
            <strong className="text-sm font-black text-[#133063] block">دخول موحد مباشر</strong>
            <span className="text-xs text-slate-600 font-bold mt-0.5 block">عبر كلمة المرور المعتمدة دون الحاجة لبريد إلكتروني</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>سيتم فتح نافذة إدارة وتعيين المشرفين في الإصدار التشغيلي القادم.</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              <BarChart3 className="w-4 h-4 text-[#00a3e0]" />
              <span>لوحة الإحصائيات</span>
            </Link>

            <Link
              href="/admin/complaints"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold transition shadow-2xs"
            >
              <FileText className="w-4 h-4 text-[#00a3e0]" />
              <span>جدول الشكاوى</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
