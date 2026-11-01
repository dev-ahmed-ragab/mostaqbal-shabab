'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ArrowLeft, 
  TrendingUp,
  Inbox,
  Sparkles,
  MapPin,
  Eye,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';
import { Complaint } from '@/types/database';
import { complaintsService } from '@/lib/complaintsService';
import { StatusBadge } from '@/components/StatusBadge';
import { authService, AdminUser } from '@/lib/auth';
import { DashboardAnalyticsCharts } from '@/components/DashboardAnalyticsCharts';

function AdminDashboardContent() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayStr, setTodayStr] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const u = authService.getCurrentUser();
      setCurrentUser(u);

      const all = await complaintsService.getAll();
      setComplaints(all);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
    loadData();

    const unsubAuth = authService.subscribe(() => {
      setCurrentUser(authService.getCurrentUser());
    });

    return () => {
      unsubAuth();
    };
  }, []);

  // حساب مؤشرات الأداء الحية
  const stats = useMemo(() => {
    const list = complaints;
    const total = list.length;
    const today = todayStr ? list.filter((c) => c.created_at && c.created_at.startsWith(todayStr)).length : 0;
    const newCount = list.filter((c) => c.status === 'new').length;
    const underReview = list.filter((c) => c.status === 'under_review').length;
    const inProgress = list.filter((c) => c.status === 'in_progress').length;
    const resolved = list.filter((c) => c.status === 'resolved').length;
    const urgentCount = list.filter((c) => c.priority === 'urgent' || c.priority === 'emergency').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { 
      total, 
      today, 
      newCount, 
      underReview, 
      inProgress, 
      resolved, 
      urgentCount,
      rate
    };
  }, [complaints, todayStr]);

  // أحدث 5 شكاوى مسجلة
  const recentComplaints = useMemo(() => {
    return [...complaints]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [complaints]);

  return (
    <div className="space-y-8">
      {/* 1. الترويسة الرئيسية والترحيب */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#133063] bg-blue-50 px-3 py-0.5 rounded-full border border-blue-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#00a3e0] animate-pulse" />
              حزب مستقبل وطن
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              أمانة مركز بركة السبع
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-bold text-slate-500">أمانة رعاية الشباب</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#133063] tracking-tight">
            لوحة الإحصائيات والمؤشرات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            متابعة دقيقة للأرقام ومسار حل شكاوى المواطنين والرسوم البيانية الانسيابية لقطاع الشباب بمركز بركة السبع.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer shadow-xs"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>

          <Link
            href="/admin/complaints"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-[#133063]/20 transition active:scale-95"
          >
            <FileText className="w-4 h-4 text-[#00a3e0]" />
            <span>إدارة الشكاوى والطلبات</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. بطاقات الإحصائيات والأرقام الأساسية (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* إجمالي الشكاوى */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:border-[#00a3e0] transition duration-200">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold">إجمالي الشكاوى الواردة</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#133063] flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4 text-[#00a3e0]" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-[#133063]">{stats.total}</span>
          <div className="mt-2 text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <span className="text-[#00a3e0] font-bold">+{stats.today} اليوم</span>
            <span>•</span>
            <span>{stats.newCount} بانتظار الفحص الأول</span>
          </div>
        </div>

        {/* تم الحل والإنجاز */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs relative overflow-hidden group hover:border-emerald-500 transition duration-200">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold">تم حلها وإنجازها بنجاح</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-700">{stats.resolved}</span>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              {stats.rate}% نسبة الحل
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-800/80 font-semibold">
            تم التنفيذ بالتنسيق الميداني والأجهزة التنفيذية
          </div>
        </div>

        {/* قيد المراجعة والمتابعة */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs relative overflow-hidden group hover:border-amber-500 transition duration-200">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold">قيد المتابعة والتنفيذ</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-amber-700">
            {stats.underReview + stats.inProgress}
          </span>
          <div className="mt-2 text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
            <span>{stats.underReview} دراسة</span>
            <span>•</span>
            <span>{stats.inProgress} معاينة ميدانية</span>
          </div>
        </div>

        {/* حالات عاجلة وطارئة */}
        <div className="bg-white rounded-3xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs relative overflow-hidden group hover:border-rose-500 transition duration-200">
          <div className="flex items-center justify-between text-rose-800 mb-2">
            <span className="text-xs font-bold">حالات عاجلة وتدخل سريع</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-rose-700">{stats.urgentCount}</span>
          <div className="mt-2 text-[11px] text-rose-800 font-semibold">
            تتطلب أولوية قصوى وتنسيق فوري
          </div>
        </div>
      </div>

      {/* 3. الرسوم البيانية الانسيابية (Shadcn Area & Donut Charts) */}
      <DashboardAnalyticsCharts complaints={complaints} />

      {/* 4. بطاقة انتقال مباشر لصفحة الشكاوى */}
      <div className="bg-gradient-to-r from-[#133063] via-[#102a54] to-[#133063] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#00a3e0] border border-white/15">
            <FileText className="w-3.5 h-3.5" />
            جدول المتابعة الميدانية
          </span>
          <h3 className="text-xl sm:text-2xl font-black">
            إدارة كافة الشكاوى والطلبات والتأشيرات الرسمية
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            الانتقال لجدول الشكاوى الكامل للبحث والفلترة، فحص المواقع على الخريطة، إصدار القرارات، ومراسلة المواطنين.
          </p>
        </div>

        <Link
          href="/admin/complaints"
          className="shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#00a3e0] hover:bg-[#0284c7] text-white text-xs sm:text-sm font-extrabold shadow-md transition active:scale-95"
        >
          <span>الانتقال لصفحة الشكاوى ({stats.total} طلب)</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">جاري تحميل لوحة الإحصائيات...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
