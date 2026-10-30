'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Flame, 
  Filter, 
  ArrowUpRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { Complaint, ComplaintStatus, STATUS_META } from '@/types/database';
import { CommitteeDef } from '@/lib/auth';

interface AdminChartsProps {
  complaints: Complaint[];
  committees: CommitteeDef[];
  activeStatusFilter: string;
  onSelectStatus: (status: string) => void;
  activeCommitteeFilter: string;
  onSelectCommittee: (committeeId: string) => void;
}

export const AdminCharts: React.FC<AdminChartsProps> = ({
  complaints,
  committees,
  activeStatusFilter,
  onSelectStatus,
  activeCommitteeFilter,
  onSelectCommittee,
}) => {
  // وضع العرض: أعمدة رأسية للحالات، أو توزيع اللجان، أو كلاهما
  const [viewMode, setViewMode] = useState<'columns' | 'committees' | 'both'>('columns');

  // حساب إحصائيات الحالات
  const statusCounts = useMemo(() => {
    const total = complaints.length;
    const newCount = complaints.filter((c) => c.status === 'new').length;
    const underReview = complaints.filter((c) => c.status === 'under_review').length;
    const needsInfo = complaints.filter((c) => c.status === 'needs_info').length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const rejected = complaints.filter((c) => c.status === 'rejected').length;

    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const urgentCount = complaints.filter(
      (c) => c.priority === 'urgent' || c.priority === 'emergency'
    ).length;

    return {
      total,
      newCount,
      underReview,
      needsInfo,
      inProgress,
      resolved,
      rejected,
      rate,
      urgentCount,
    };
  }, [complaints]);

  // إحصائيات توزيع المشاكل على كافة اللجان
  const committeeStats = useMemo(() => {
    const totalAll = complaints.length;
    return committees.map((comm) => {
      const commComplaints = complaints.filter(
        (c) => (c.committee_id || 'youth') === comm.id
      );
      const count = commComplaints.length;
      const resolvedCount = commComplaints.filter((c) => c.status === 'resolved').length;
      const rate = count > 0 ? Math.round((resolvedCount / count) * 100) : 0;
      const pct = totalAll > 0 ? Math.round((count / totalAll) * 100) : 0;

      return {
        ...comm,
        count,
        resolvedCount,
        rate,
        pct,
      };
    }).sort((a, b) => b.count - a.count);
  }, [complaints, committees]);

  // بيانات الأعمدة الرأسية القياسية
  const columnsData = useMemo(() => {
    return [
      {
        key: 'new',
        label: 'جديد',
        count: statusCounts.newCount,
        color: 'from-blue-500 to-blue-600',
        barBg: 'bg-blue-500',
        textColor: 'text-blue-700',
        badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
        borderActive: 'ring-2 ring-blue-500 ring-offset-2',
      },
      {
        key: 'under_review',
        label: 'قيد المراجعة',
        count: statusCounts.underReview,
        color: 'from-amber-400 to-amber-500',
        barBg: 'bg-amber-500',
        textColor: 'text-amber-800',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        borderActive: 'ring-2 ring-amber-500 ring-offset-2',
      },
      {
        key: 'needs_info',
        label: 'استكمال بيانات',
        count: statusCounts.needsInfo,
        color: 'from-orange-400 to-orange-500',
        barBg: 'bg-orange-500',
        textColor: 'text-orange-800',
        badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
        borderActive: 'ring-2 ring-orange-500 ring-offset-2',
      },
      {
        key: 'in_progress',
        label: 'جاري التنفيذ',
        count: statusCounts.inProgress,
        color: 'from-purple-500 to-purple-600',
        barBg: 'bg-purple-500',
        textColor: 'text-purple-800',
        badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
        borderActive: 'ring-2 ring-purple-500 ring-offset-2',
      },
      {
        key: 'resolved',
        label: 'تم الحل',
        count: statusCounts.resolved,
        color: 'from-emerald-500 to-emerald-600',
        barBg: 'bg-emerald-500',
        textColor: 'text-emerald-800',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        borderActive: 'ring-2 ring-emerald-500 ring-offset-2',
      },
      {
        key: 'rejected',
        label: 'مرفوض',
        count: statusCounts.rejected,
        color: 'from-rose-500 to-rose-600',
        barBg: 'bg-rose-500',
        textColor: 'text-rose-800',
        badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
        borderActive: 'ring-2 ring-rose-500 ring-offset-2',
      },
    ];
  }, [statusCounts]);

  // إيجاد أعلى قيمة لضبط ارتفاع المحور الرأسي
  const maxColumnCount = Math.max(
    ...columnsData.map((c) => c.count),
    1
  );

  // درجات المحور الرأسي Y-Axis
  const yAxisTicks = useMemo(() => {
    const max = Math.max(maxColumnCount, 4);
    const step = Math.ceil(max / 4);
    return [max, Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];
  }, [maxColumnCount]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
      {/* ترويسة قسم الرسوم البيانية وأزرار التبديل */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a3e0] animate-pulse" />
            <h3 className="text-sm sm:text-base font-black text-[#133063] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#00a3e0]" />
              <span>الرسم البياني التنفيذي للشكاوى والمشاكل (Visual Column Charts)</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            أعمدة بيانية قياسية تعكس عدد المشاكل بدقة، مع إمكانية النقر على أي عمود للفلترة الفورية للجدول أدناه.
          </p>
        </div>

        {/* أزرار اختيار نمط الرسم البياني */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('columns')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'columns'
                ? 'bg-white text-[#133063] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 أعمدة الحالات
          </button>
          <button
            type="button"
            onClick={() => setViewMode('committees')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'committees'
                ? 'bg-white text-[#133063] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏛️ توزيع اللجان
          </button>
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`hidden md:inline-flex px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'both'
                ? 'bg-white text-[#133063] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 كلاهما
          </button>
        </div>
      </div>

      {/* 1. الرسم البياني القياسي بالأعمدة الرأسية (Vertical Column Chart) */}
      {(viewMode === 'columns' || viewMode === 'both') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <span>توزيع حجم المشاكل بالأعمدة الرأسية:</span>
              {activeStatusFilter !== 'all' && (
                <span className="text-[#00a3e0] bg-blue-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  (مفلتر حالياً: {columnsData.find(c => c.key === activeStatusFilter)?.label})
                </span>
              )}
            </span>
            {activeStatusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectStatus('all')}
                className="text-rose-600 hover:underline flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                عرض كافة الشكاوى
              </button>
            )}
          </div>

          {/* مساحة الرسم البياني ذات الأعمدة مع خطوط الشبكة والمحور الرأسي */}
          <div className="relative bg-slate-50/60 rounded-2xl p-4 sm:p-6 border border-slate-200/80">
            {/* خطوط الشبكة الخلفية والمحور الرأسي */}
            <div className="absolute inset-x-4 sm:inset-x-6 top-6 bottom-16 flex flex-col justify-between pointer-events-none opacity-40">
              {yAxisTicks.map((tick, idx) => (
                <div key={idx} className="border-b border-dashed border-slate-300 w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{tick}</span>
                  <span>{tick}</span>
                </div>
              ))}
            </div>

            {/* الأعمدة الرأسية */}
            <div className="relative z-10 grid grid-cols-6 gap-2 sm:gap-4 h-48 sm:h-56 items-end pt-4 pb-2">
              {columnsData.map((col) => {
                const isSelected = activeStatusFilter === col.key;
                const pct = statusCounts.total > 0
                  ? Math.round((col.count / statusCounts.total) * 100)
                  : 0;
                
                // حساب الارتفاع النسبي للعمود (بحد أدنى 10% ليكون واضحاً وقابلاً للنقر)
                const heightPercent = col.count > 0
                  ? Math.max(Math.round((col.count / maxColumnCount) * 100), 14)
                  : 6;

                return (
                  <div
                    key={col.key}
                    onClick={() => onSelectStatus(isSelected ? 'all' : col.key)}
                    className="group flex flex-col items-center h-full justify-end cursor-pointer"
                    title={`انقر لفلترة شكاوى: ${col.label} (${col.count} طلب - ${pct}%)`}
                  >
                    {/* رقم العداد فوق رأس العمود */}
                    <div className="mb-2 transition-transform group-hover:-translate-y-1">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-xs font-black shadow-2xs transition ${
                          col.count > 0
                            ? isSelected
                              ? 'bg-[#133063] text-white ring-2 ring-[#00a3e0]'
                              : 'bg-white text-slate-800 border border-slate-300 group-hover:border-[#00a3e0]'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 text-[10px]'
                        }`}
                      >
                        {col.count}
                      </span>
                    </div>

                    {/* جسم العمود البياني الرأسي */}
                    <div className="w-full max-w-[48px] sm:max-w-[64px] bg-slate-200/50 rounded-2xl p-1 flex items-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-xl bg-gradient-to-t ${col.color} transition-all duration-500 relative shadow-sm group-hover:brightness-110 ${
                          isSelected ? 'ring-2 ring-[#133063] ring-offset-2 scale-105' : ''
                        } ${col.count === 0 ? 'opacity-30' : 'opacity-100'}`}
                      >
                        {/* خط لمعان علوي أنيق للعمود */}
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-white/40 rounded-t-xl" />
                      </div>
                    </div>

                    {/* عنوان وتسمية العمود أسفل الرسم */}
                    <div className="mt-3 text-center space-y-0.5">
                      <span
                        className={`block text-[11px] sm:text-xs font-extrabold truncate max-w-full ${
                          isSelected ? 'text-[#133063] font-black underline' : 'text-slate-700'
                        }`}
                      >
                        {col.label}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400 font-semibold">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. الرسم البياني لتوزيع المشاكل على اللجان المركزية (Committee Bar Chart) */}
      {(viewMode === 'committees' || viewMode === 'both') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#00a3e0]" />
              <span>أحمال العمل وتوزيع الشكاوى ونسب الحل على اللجان النوعية:</span>
              {activeCommitteeFilter !== 'all' && (
                <span className="text-[#00a3e0] bg-blue-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  (لجنة محددة)
                </span>
              )}
            </span>
            {activeCommitteeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectCommittee('all')}
                className="text-rose-600 hover:underline flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                عرض كافة اللجان
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {committeeStats.map((comm) => {
              const isSelected = activeCommitteeFilter === comm.id;
              return (
                <div
                  key={comm.id}
                  onClick={() => onSelectCommittee(isSelected ? 'all' : comm.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400'
                      : 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-100/70'
                  }`}
                  title={`انقر لفلترة طلبات: ${comm.name}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#133063] flex items-center justify-center font-bold text-xs shrink-0">
                        🏛️
                      </div>
                      <span className="font-extrabold text-xs text-[#133063] truncate">
                        {comm.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-black text-slate-800 font-mono shadow-2xs">
                        {comm.count} شكوى
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        {comm.rate}% حل
                      </span>
                    </div>
                  </div>

                  {/* شريط التقدم الأفقي للجنة */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-[#133063] to-[#00a3e0] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(comm.pct, comm.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-medium">
                    <span>رئيس اللجنة: {comm.headName}</span>
                    <span>تم حل {comm.resolvedCount} من {comm.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
