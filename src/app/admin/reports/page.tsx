'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Users, 
  Layers,
  Sparkles,
  TrendingUp,
  FileText,
  PieChart,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Flame,
  Check
} from 'lucide-react';
import { complaintsService } from '@/lib/complaintsService';
import { committeesService } from '@/lib/committeesService';
import { authService, AdminUser, CommitteeDef } from '@/lib/auth';
import { Complaint, STATUS_META } from '@/types/database';
import { exportComplaintsToExcel } from '@/lib/exportExcel';
import { generateBulkComplaintsPdf } from '@/lib/generateBulkPdf';

export default function AdminReportsPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [committees, setCommittees] = useState<CommitteeDef[]>([]);
  const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
    setCommittees(committeesService.getAll());
    complaintsService.getAll().then(setComplaints).catch(() => {});
  }, []);

  const filteredComplaints = useMemo(() => {
    if (selectedCommittee === 'all') return complaints;
    return complaints.filter(c => (c.committee_id || 'youth') === selectedCommittee);
  }, [complaints, selectedCommittee]);

  // إحصائيات عامة
  const stats = useMemo(() => {
    const total = filteredComplaints.length;
    const resolved = filteredComplaints.filter(c => c.status === 'resolved').length;
    const inProgress = filteredComplaints.filter(c => c.status === 'in_progress').length;
    const underReview = filteredComplaints.filter(c => c.status === 'under_review').length;
    const needsInfo = filteredComplaints.filter(c => c.status === 'needs_info').length;
    const newCount = filteredComplaints.filter(c => c.status === 'new').length;
    const rejected = filteredComplaints.filter(c => c.status === 'rejected').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const normalPriority = filteredComplaints.filter(c => !c.priority || c.priority === 'normal').length;
    const urgentPriority = filteredComplaints.filter(c => c.priority === 'urgent').length;
    const emergencyPriority = filteredComplaints.filter(c => c.priority === 'emergency').length;

    return { 
      total, 
      resolved, 
      inProgress, 
      underReview, 
      needsInfo, 
      newCount, 
      rejected, 
      rate,
      normalPriority,
      urgentPriority,
      emergencyPriority
    };
  }, [filteredComplaints]);

  // إحصائيات توزيع المشاكل على كافة اللجان (للرسم البياني المقارن)
  const committeeComparison = useMemo(() => {
    const totalAll = complaints.length;
    return committees.map(comm => {
      const count = complaints.filter(c => (c.committee_id || 'youth') === comm.id).length;
      const pct = totalAll > 0 ? Math.round((count / totalAll) * 100) : 0;
      const resolvedCount = complaints.filter(c => (c.committee_id || 'youth') === comm.id && c.status === 'resolved').length;
      const commRate = count > 0 ? Math.round((resolvedCount / count) * 100) : 0;
      return {
        ...comm,
        count,
        pct,
        resolvedCount,
        commRate,
      };
    }).sort((a, b) => b.count - a.count);
  }, [complaints, committees]);

  // تصدير إكسيل
  const handleExcelExport = () => {
    exportComplaintsToExcel(filteredComplaints, `كشف_إحصائي_${selectedCommittee}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // تصدير PDF رسمي
  const handlePdfExport = async () => {
    setIsExportingPdf(true);
    try {
      const commName = selectedCommittee === 'all' 
        ? 'كافة اللجان النوعية والمركزية' 
        : committees.find(c => c.id === selectedCommittee)?.name || 'لجنة رعاية الشباب';
      
      await generateBulkComplaintsPdf(filteredComplaints, {
        committeeName: commName,
        printedBy: currentUser?.name || 'أمانة التنظيم واللجان',
      });
    } catch (err) {
      console.error(err);
      alert('فشل إنشاء ملف الـ PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* الترويسة الرئيسية مع الفلتر وأزرار التصدير */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#133063] to-[#00a3e0]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#133063] border border-blue-200 text-[11px] font-extrabold flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#00a3e0]" />
                لوحة المؤشرات والرسوم البيانية (Executive KPIs)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#133063]">
              المؤشرات البيانية وتحليلات شكاوى المواطنين
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              رسوم بيانية تفاعلية حية ترصد حجم الشكاوى، ومعدل إنجاز اللجان، وتوزيع المشاكل الجماهيرية حسب الأولويات واللجان النوعية.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExcelExport}
              disabled={filteredComplaints.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePdfExport}
              disabled={filteredComplaints.length === 0 || isExportingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold transition shadow-md shadow-[#133063]/20 disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-[#00a3e0]" />
              <span>{isExportingPdf ? 'جاري التوليد...' : 'كشف PDF رسمي'}</span>
            </button>
          </div>
        </div>

        {/* تصفية سريعة باللجنة لتحديث الرسوم البيانية لحظياً */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-[#00a3e0]" />
            <span>عرض التحليلات حسب اللجنة:</span>
          </div>
          <select
            value={selectedCommittee}
            onChange={(e) => setSelectedCommittee(e.target.value)}
            className="w-full sm:w-80 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 cursor-pointer shadow-2xs"
          >
            <option value="all">كافة لجان حزب مستقبل وطن (تحليل مجمع)</option>
            {committees.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* صف كروت الـ KPIs الكبرى مع مؤشر الإنجاز */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* كارت إجمالي المشاكل */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">إجمالي الشكاوى</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#133063] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4 text-[#00a3e0]" />
            </div>
          </div>
          <span className="text-3xl font-black text-[#133063]">{stats.total}</span>
          <div className="mt-2 text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <span className="text-blue-600 font-bold">{stats.newCount} طلب جديد</span>
            <span>بانتظار المراجعة</span>
          </div>
        </div>

        {/* كارت نسبة الإنجاز والحل */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold">نسبة الحل والإنجاز</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <span className="text-3xl font-black text-emerald-700">{stats.rate}%</span>
          <div className="mt-2 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
            <span>تم حل</span>
            <span className="font-bold font-mono">{stats.resolved}</span>
            <span>طلب بنجاح تام</span>
          </div>
        </div>

        {/* كارت قيد المتابعة والتنفيذ */}
        <div className="bg-white rounded-3xl p-5 border border-purple-200 bg-purple-50/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-bold">جاري التنفيذ والمتابعة</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <span className="text-3xl font-black text-purple-700">{stats.inProgress}</span>
          <div className="mt-2 text-[11px] text-purple-800 font-semibold flex items-center gap-1">
            <span>مع الجهات التنفيذية واللجنة</span>
          </div>
        </div>

        {/* كارت الشكاوى العاجلة والطارئة */}
        <div className="bg-white rounded-3xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-bold">حالات عاجلة وطارئة</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <span className="text-3xl font-black text-rose-700">{stats.urgentPriority + stats.emergencyPriority}</span>
          <div className="mt-2 text-[11px] text-rose-800 font-semibold flex items-center gap-1">
            <span>{stats.emergencyPriority} طارئ جداً • {stats.urgentPriority} عاجل</span>
          </div>
        </div>
      </div>

      {/* قسم الرسوم البيانية التفاعلية 1: توزيع الحالات ومعدل الإنجاز */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الرسم البياني الشريطي لتوزيع حالات الشكاوى */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-[#133063] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00a3e0]" />
                <span>رسم بياني: توزيع الشكاوى حسب الحالة</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-400">
                {stats.total} إجمالي الطلبات
              </span>
            </div>

            <div className="space-y-4">
              {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((stKey) => {
                const meta = STATUS_META[stKey];
                const count = filteredComplaints.filter(c => c.status === stKey).length;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

                return (
                  <div key={stKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.dotClass}`} />
                        <span className="font-extrabold text-slate-800">{meta.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-extrabold text-slate-900">{count} طلب</span>
                        <span className="text-slate-400 text-[11px]">({pct}%)</span>
                      </div>
                    </div>

                    {/* البار البياني الملون */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${meta.dotClass}`}
                        style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>تحديث بياني لحظي</span>
            <span>البيانات معتمدة من أمانة التنظيم</span>
          </div>
        </div>

        {/* الرسم البياني الدائري ومؤشر سرعة الاستجابة */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-[#133063] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#00a3e0]" />
                <span>مؤشر ونسبة الإنجاز التراكمي (Resolution Rate)</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                مؤشر قياسي
              </span>
            </div>

            {/* تمثيل بياني دائري تفاعلي (Radial Gauge) */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* الدائرة الخلفية */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-slate-100"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* مسار تم الحل (الأخضر) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * stats.rate) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-[#133063] font-mono leading-none">
                    {stats.rate}%
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 mt-1">نسبة الإنجاز</span>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                    {stats.resolved} من {stats.total}
                  </span>
                </div>
              </div>
            </div>

            {/* تفصيل الأولويات */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block">عادي</span>
                <span className="font-black text-slate-700 text-sm">{stats.normalPriority}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 block">عاجل</span>
                <span className="font-black text-amber-900 text-sm">{stats.urgentPriority}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-800 block">طارئ</span>
                <span className="font-black text-rose-900 text-sm">{stats.emergencyPriority}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            تحديث المؤشرات تلقائياً وفق القرارات الإدارية المعتمدة
          </div>
        </div>
      </div>

      {/* قسم الرسوم البيانية 2: مقارنة حجم المشاكل والشكاوى بين اللجان المركزية */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-[#133063] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#00a3e0]" />
              <span>مقارنة حجم المشاكل والشكاوى الموجهة لكل لجنة (Cross-Committee Analysis)</span>
            </h3>
            <span className="text-xs text-slate-400">
              رسم بياني مقارن يوضح حصة كل لجنة ونسبة حل الشكاوى بها
            </span>
          </div>

          <span className="text-xs font-mono font-bold text-[#133063] bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
            {committees.length} لجان مسجلة
          </span>
        </div>

        <div className="space-y-5">
          {committeeComparison.map((comm, idx) => {
            const barColors = [
              'bg-[#133063]',
              'bg-[#00a3e0]',
              'bg-purple-600',
              'bg-indigo-600',
              'bg-emerald-600',
              'bg-amber-600',
            ];
            const colorClass = barColors[idx % barColors.length];

            return (
              <div key={comm.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-600 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-[#133063] block">
                        {comm.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        رئيس اللجنة: <b>{comm.headName}</b>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 text-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">عدد الشكاوى:</span>
                      <span className="font-mono font-black text-[#133063] text-sm">{comm.count} طلب</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">نسبة الحل:</span>
                      <span className="font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {comm.commRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* البار البياني النسبي */}
                <div className="w-full bg-slate-200/70 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                    style={{ width: `${Math.max(comm.pct, comm.count > 0 ? 6 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
