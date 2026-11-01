'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Complaint } from '@/types/database';
import { 
  TrendingUp, 
  CheckCircle2, 
  PieChart as PieChartIcon,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DashboardAnalyticsChartsProps {
  complaints: Complaint[];
}

type TimeRange = '7d' | '30d' | '90d';

export const DashboardAnalyticsCharts: React.FC<DashboardAnalyticsChartsProps> = ({ complaints }) => {
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    setMounted(true);
  }, []);

  // تجهيز بيانات الرسم البياني التفاعلي Area Chart حسب النطاق الزمني
  const timelineData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const now = new Date();
    const result: Array<{
      date: string;
      label: string;
      received: number;
      resolved: number;
      inProgress: number;
    }> = [];

    const countsMap = new Map<string, { received: number; resolved: number; inProgress: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('ar-EG', {
        month: days > 30 ? 'short' : 'numeric',
        day: 'numeric',
        ...(days <= 7 ? { weekday: 'short' } : {})
      });

      countsMap.set(isoKey, { received: 0, resolved: 0, inProgress: 0 });
      result.push({
        date: isoKey,
        label: dayLabel,
        received: 0,
        resolved: 0,
        inProgress: 0,
      });
    }

    complaints.forEach((c) => {
      const dateKey = c.created_at ? c.created_at.split('T')[0] : '';
      if (countsMap.has(dateKey)) {
        const item = countsMap.get(dateKey)!;
        item.received += 1;
        if (c.status === 'resolved') item.resolved += 1;
        if (c.status === 'in_progress' || c.status === 'under_review') item.inProgress += 1;
      }
    });

    return result.map((entry) => {
      const counts = countsMap.get(entry.date) || { received: 0, resolved: 0, inProgress: 0 };
      return {
        ...entry,
        received: counts.received,
        resolved: counts.resolved,
        inProgress: counts.inProgress,
      };
    });
  }, [complaints, timeRange]);

  // تجهيز بيانات الرسم البياني الدائري (Donut / Pie Chart)
  const donutData = useMemo(() => {
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const underReview = complaints.filter(c => c.status === 'under_review').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const newCount = complaints.filter(c => c.status === 'new').length;
    const needsInfo = complaints.filter(c => c.status === 'needs_info').length;

    const data = [
      { name: 'تم الحل بنجاح', value: resolved, color: '#10b981' },
      { name: 'قيد المراجعة', value: underReview, color: '#f59e0b' },
      { name: 'جاري التنفيذ', value: inProgress, color: '#6366f1' },
      { name: 'جديد', value: newCount, color: '#00a3e0' },
      { name: 'استكمال بيانات', value: needsInfo, color: '#f97316' },
    ].filter(item => item.value > 0);

    return data.length > 0 ? data : [{ name: 'لا توجد شكاوى', value: 1, color: '#e2e8f0' }];
  }, [complaints]);

  // نسبة الإنجاز والحل
  const resolutionRate = useMemo(() => {
    if (complaints.length === 0) return 0;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    return Math.round((resolved / complaints.length) * 100);
  }, [complaints]);

  // إحصائيات ما وراء الشكاوى (الشكاوى دي كانت في إيه ونسبة حل كل مجال)
  const categoryStats = useMemo(() => {
    const categories: Record<string, { total: number; resolved: number; inProgress: number }> = {
      'أنشطة وملاعب رياضية': { total: 0, resolved: 0, inProgress: 0 },
      'توظيف وتأهيل لسوق العمل': { total: 0, resolved: 0, inProgress: 0 },
      'صيانة وتجهيز مراكز الشباب': { total: 0, resolved: 0, inProgress: 0 },
      'دورات تدريبية وتثقيفية': { total: 0, resolved: 0, inProgress: 0 },
      'مبادرات وطلبات عامة': { total: 0, resolved: 0, inProgress: 0 },
    };

    complaints.forEach((c) => {
      const text = `${c.title} ${c.description}`.toLowerCase();
      let matched = 'مبادرات وطلبات عامة';

      if (text.includes('ملعب') || text.includes('كورة') || text.includes('رياض') || text.includes('فريق') || text.includes('بطول')) {
        matched = 'أنشطة وملاعب رياضية';
      } else if (text.includes('وظي') || text.includes('عمل') || text.includes('خريج') || text.includes('ملتقى توظيف')) {
        matched = 'توظيف وتأهيل لسوق العمل';
      } else if (text.includes('صيان') || text.includes('نور') || text.includes('كهرب') || text.includes('كشاف') || text.includes('تجهيز')) {
        matched = 'صيانة وتجهيز مراكز الشباب';
      } else if (text.includes('دورة') || text.includes('تدريب') || text.includes('برمج') || text.includes('تثقيف')) {
        matched = 'دورات تدريبية وتثقيفية';
      }

      categories[matched].total += 1;
      if (c.status === 'resolved') categories[matched].resolved += 1;
      if (c.status === 'in_progress') categories[matched].inProgress += 1;
    });

    return Object.entries(categories).map(([name, data]) => {
      const rate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
      return {
        name,
        total: data.total,
        resolved: data.resolved,
        inProgress: data.inProgress,
        rate,
      };
    }).sort((a, b) => b.total - a.total);
  }, [complaints]);

  // التولتيب المخصص لـ Area Chart
  const CustomShadcnTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200/90 text-right min-w-[160px] animate-in fade-in-50 zoom-in-95 duration-150">
          <p className="font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 mb-2 text-xs">
            📅 {label}
          </p>
          <div className="space-y-1.5 text-[11px]">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3 font-bold">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-mono font-black text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // التولتيب المخصص لـ Donut Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-200 text-right text-xs font-bold animate-in fade-in-50 duration-150">
          <p className="flex items-center gap-1.5 text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
            {item.name}: <strong className="font-mono font-black">{item.value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-80 w-full animate-pulse bg-slate-100 rounded-3xl border border-slate-200" />
        <div className="h-64 w-full animate-pulse bg-slate-100 rounded-3xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. صف الرسوم البيانية: Area Chart + Donut Chart جنبًا إلى جنب */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* الرسم البياني الانسيابي (Area Chart) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00a3e0] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    <TrendingUp className="w-3.5 h-3.5" />
                    مسار الشكاوى (Area Chart)
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#133063]">
                  الوارد مقابل ما تم حله
                </h2>
              </div>

              {/* محول النطاق الزمني */}
              <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200 self-start sm:self-center shrink-0">
                {(['7d', '30d', '90d'] as TimeRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      timeRange === r
                        ? 'bg-white text-[#133063] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === '7d' ? '7 أيام' : r === '30d' ? '30 يوم' : '3 شهور'}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-64 sm:h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00a3e0" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#00a3e0" stopOpacity={0.01}/>
                    </linearGradient>

                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  
                  <XAxis 
                    dataKey="label" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    interval={timeRange === '90d' ? 8 : timeRange === '30d' ? 3 : 0}
                  />
                  
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  />
                  
                  <Tooltip content={<CustomShadcnTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="received"
                    name="الوارد"
                    stroke="#00a3e0"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReceived)"
                    activeDot={{ r: 5, fill: '#00a3e0', stroke: '#ffffff', strokeWidth: 2 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="تم الحل"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-[11px] font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00a3e0]" />
              <span className="text-slate-700">الشكاوى الواردة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span className="text-slate-700">تم حلها بنجاح</span>
            </div>
          </div>
        </div>

        {/* الرسم البياني الدائري (Donut / Pie Chart) لتوزيع الحالات والإنجاز */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    <PieChartIcon className="w-3.5 h-3.5" />
                    رسم بياني دائري (Donut)
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#133063]">
                  توزيع حالات الشكاوى
                </h2>
              </div>
            </div>

            {/* الدائرة المفرغة وبداخلها النسبة */}
            <div className="relative w-full h-52 sm:h-56 flex items-center justify-center" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* النسبة المركزية داخل التجويف */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl sm:text-3xl font-black text-[#133063]">
                  {resolutionRate}%
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  نسبة الإنجاز
                </span>
              </div>
            </div>
          </div>

          {/* وسيلة الإيضاح والقيم */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px]">
            {donutData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-700 font-bold truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <strong className="font-mono text-slate-900">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 2. قسم "الشكاوي دي كانت في إيه، وإيه تم حله" (Category & Subject Breakdown) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#133063] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                <Layers className="w-3.5 h-3.5 text-[#00a3e0]" />
                تصنيف موضوعات الشكاوى
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#133063]">
              الشكاوى كانت في إيه؟ وما تم حله في كل قطاع
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              توزيع المشاكل الجماهيرية حسب القطاعات الشبابية، ونسبة الإنجاز والحل في كل مجال.
            </p>
          </div>
        </div>

        {/* شبكة البطاقات التحليلية لكل قطاع */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryStats.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4.5 hover:border-[#00a3e0]/60 hover:bg-white hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-slate-900">{item.name}</h3>
                  <span className="font-mono text-xs font-black text-[#133063] bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                    {item.total} طلب
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  <span>تم الحل: <strong className="text-emerald-700">{item.resolved}</strong></span>
                  <span>نسبة الإنجاز: <strong className="text-[#00a3e0]">{item.rate}%</strong></span>
                </div>

                {/* شريط التقدم الناعم */}
                <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00a3e0] to-[#10b981] transition-all duration-500"
                    style={{ width: `${Math.max(item.rate, item.total > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>جاري المتابعة: {item.inProgress}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  {item.rate >= 80 ? 'إنجاز ممتاز' : item.rate >= 50 ? 'معدل جيد' : 'قيد المعالجة'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
