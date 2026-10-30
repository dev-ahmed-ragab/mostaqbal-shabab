'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  ArrowRight, 
  Calendar, 
  Phone, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  ChevronRight,
  ShieldCheck,
  User,
  Sparkles,
  Lock,
  EyeOff,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { Complaint, ComplaintTimeline, ComplaintStatus, STATUS_META } from '@/types/database';
import { complaintsService } from '@/lib/complaintsService';
import { StatusBadge } from '@/components/StatusBadge';
import { ComplaintReceipt } from '@/components/ComplaintReceipt';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [searchInput, setSearchInput] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [timeline, setTimeline] = useState<ComplaintTimeline[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // اختيار الشكوى وجلب مسارها
  const handleSelectComplaint = useCallback(async (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    try {
      const hist = await complaintsService.getTimeline(complaint.id);
      setTimeline(hist);
    } catch {
      setTimeline([]);
    }
  }, []);

  // فحص ذكي لنوع المدخل (كود شكوى أو رقم هاتف أو رقم قومي) مع مراعاة الخصوصية
  const executeSmartSearch = useCallback(async (val: string) => {
    const clean = val.trim();
    if (!clean) return;

    setIsLoading(true);
    setSearched(true);
    setSelectedComplaint(null);
    setTimeline([]);

    try {
      let found: Complaint[] = [];

      // 1. هل هو رقم قومي (14 رقماً)؟
      if (/^\d{14}$/.test(clean)) {
        found = await complaintsService.search({ nationalId: clean });
      }
      // 2. هل هو رقم هاتف محمول؟
      else if (/^01[0125][0-9]{8}$/.test(clean) || clean.startsWith('01')) {
        found = await complaintsService.search({ phone: clean });
      }
      // 3. كود شكوى خاص
      else {
        const item = await complaintsService.getByTrackingCode(clean);
        if (item) {
          found = [item];
        } else {
          found = await complaintsService.search({ phone: clean });
        }
      }

      setResults(found);
      if (found.length === 1) {
        handleSelectComplaint(found[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleSelectComplaint]);

  // البحث التلقائي إذا جاء الرابط عبر QR Code أو كود تتبع ?code=...
  useEffect(() => {
    if (initialCode) {
      setSearchInput(initialCode);
      executeSmartSearch(initialCode);
    }
  }, [initialCode, executeSmartSearch]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSmartSearch(searchInput);
  };

  // شريط مسار الحالة (Stepper)
  const steps: { status: ComplaintStatus; title: string }[] = [
    { status: 'new', title: 'تم استلام الطلب' },
    { status: 'under_review', title: 'قيد الفحص والمراجعة' },
    { status: 'in_progress', title: 'جاري التنسيق والمتابعة' },
    { status: 'resolved', title: 'تم الحل بنجاح' },
  ];

  const getStepState = (stepStatus: ComplaintStatus, currentStatus: ComplaintStatus) => {
    const order: ComplaintStatus[] = ['new', 'under_review', 'in_progress', 'resolved'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepStatus);

    if (currentStatus === 'rejected') {
      return stepStatus === 'new' ? 'completed' : 'rejected';
    }
    if (currentStatus === 'needs_info') {
      return stepStatus === 'new' ? 'completed' : 'needs_info';
    }

    if (stepIndex <= currentIndex) return 'completed';
    return 'upcoming';
  };

  // تشفير الأرقام للخصوصية في العرض العام للمواطن
  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 7) return phone;
    return `${phone.slice(0, 3)}••••${phone.slice(-3)}`;
  };

  const maskNationalId = (natId: string) => {
    if (!natId || natId.length < 14) return '••••••••••••••';
    return `${natId.slice(0, 3)}•••••••${natId.slice(-4)}`;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex-1 w-full">
      {/* الترويسة */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#133063] transition mb-3"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          العودة للرئيسية
        </Link>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xs font-bold text-[#00a3e0]">حزب مستقبل وطن</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-bold text-slate-500">منظومة خدمة المواطنين الآمنة</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#133063] mb-2">
          متابعة حالة الشكوى والاستعلام
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          استعلم مباشرة عن طلبك بكتابة كود الشكوى أو رقم الهاتف بخصوصية وسرية تامة.
        </p>
      </div>

      {/* حقل البحث الذكي الموحد */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="اكتب كود الشكوى (SH-...) أو رقم الهاتف المحمول..."
              className="w-full pl-4 pr-11 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] text-sm font-medium transition text-right"
              dir="auto"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
          </div>

          <button
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-extrabold text-sm bg-[#133063] hover:bg-[#0d234a] active:scale-95 text-white transition disabled:opacity-50 shadow-md shrink-0 cursor-pointer"
          >
            {isLoading ? 'جاري الاستعلام...' : 'استعلام الآن'}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            استعلام مشفر وآمن طبقاً لسياسة الخصوصية
          </span>
          <span>مثال: SH-1030-01 أو 01012345678</span>
        </div>
      </div>

      {/* إشعار الأمان والخصوصية */}
      <div className="mb-8 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#00a3e0] shrink-0" />
          <span><b>سرية البيانات:</b> كافة البيانات الشخصية والشكاوى تخضع لأعلى معايير السرية والأمان المعتمدة.</span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">أمانة التنظيم واللجان</span>
      </div>

      {/* نتائج البحث المتعددة */}
      {searched && results.length > 1 && !selectedComplaint && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs mb-8">
          <h3 className="text-sm font-extrabold text-[#133063] mb-3">
            تم العثور على {results.length} طلبات مسجلة:
          </h3>
          <div className="divide-y divide-slate-100">
            {results.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectComplaint(c)}
                className="py-3.5 px-3 flex items-center justify-between hover:bg-blue-50/50 rounded-2xl cursor-pointer transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#133063] text-sm block">
                      {c.tracking_code}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {c.committee_name || 'لجنة رعاية الشباب'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 block mt-0.5">{c.title}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    تاريخ التقديم: {new Date(c.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* لم يتم العثور على نتائج */}
      {searched && results.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800 mb-1">
            لم يتم العثور على أي شكاوى مسجلة
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
            يرجى التأكد من كتابة كود الشكوى أو رقم الهاتف بدقة، أو يمكنك تقديم طلب جديد فوراً وسيتولى مسؤولو اللجنة متابعته.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#133063] text-white text-xs font-bold hover:bg-[#0d234a] transition shadow-md"
          >
            تقديم طلب جديد الآن
          </Link>
        </div>
      )}

      {/* تفاصيل الشكوى المختارة والمسار الزمني */}
      {selectedComplaint && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">كود التتبع الرسمي المعتمد:</span>
                <span className="text-2xl font-extrabold text-[#133063] font-mono">
                  {selectedComplaint.tracking_code}
                </span>
                <span className="inline-block mr-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#133063] border border-blue-200">
                  {selectedComplaint.committee_name || 'لجنة رعاية الشباب'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusBadge status={selectedComplaint.status} />
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#00a3e0]" />
                  تحميل الإيصال الرسمي PDF
                </button>
              </div>
            </div>

            {/* مسار الفحص والإنجاز البصري */}
            <div className="mb-8">
              <h4 className="text-xs font-extrabold text-slate-500 mb-4">مسار فحص وإنجاز الطلب:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {steps.map((st, idx) => {
                  const state = getStepState(st.status, selectedComplaint.status);
                  const isDone = state === 'completed';
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border text-xs font-bold transition ${
                        isDone
                          ? 'bg-blue-50 border-blue-300 text-[#133063]'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1.5">
                        {isDone ? (
                          <CheckCircle className="w-5 h-5 text-[#00a3e0]" />
                        ) : (
                          <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <span>{st.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* تفاصيل الطلب مع حماية الخصوصية */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-xs block">مقدم الطلب:</span>
                  <span className="font-extrabold text-slate-900">{selectedComplaint.citizen_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">رقم الهاتف (محمي):</span>
                  <span className="font-mono text-slate-700" dir="ltr">{maskPhone(selectedComplaint.primary_phone)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">تاريخ الورود:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedComplaint.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-xs block mb-1">الموضوع:</span>
                <h3 className="text-base font-extrabold text-slate-900">{selectedComplaint.title}</h3>
              </div>

              <div>
                <span className="text-slate-400 text-xs block mb-1">التفاصيل والبيان:</span>
                <p className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* الرد والتأشيرة الرسمية للمواطن */}
              {selectedComplaint.admin_notes && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#133063]">
                  <span className="font-extrabold block mb-1 text-xs text-[#00a3e0]">
                    الرد الرسمي المعتمد من مسؤولي اللجنة:
                  </span>
                  <p className="text-xs leading-relaxed font-semibold">{selectedComplaint.admin_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* سجل التحديثات والإجراءات الرسمية */}
          {timeline.length > 0 && (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs">
              <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00a3e0]" />
                سجل التحديثات والإجراءات المعتمدة
              </h4>
              <div className="space-y-4">
                {timeline.map((item, idx) => {
                  const meta = STATUS_META[item.status] || STATUS_META.new;
                  return (
                    <div key={idx} className="flex gap-3 text-xs sm:text-sm">
                      <div className="flex flex-col items-center">
                        <span className={`w-3 h-3 rounded-full mt-1.5 ${meta.dotClass}`} />
                        {idx !== timeline.length - 1 && (
                          <span className="w-0.5 flex-1 bg-slate-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-900">{meta.label}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(item.created_at).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-slate-600 mt-1 text-xs leading-relaxed">
                            {item.note}
                          </p>
                        )}
                        {item.actor_name && (
                          <span className="text-[10px] text-[#133063] font-bold mt-1 block">
                            المسؤول المعتمد: {item.actor_name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* نافذة استعراض وتحميل إيصال الشكوى PDF */}
      {showReceiptModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-800 z-10 p-2"
            >
              ✕
            </button>
            <ComplaintReceipt
              complaint={selectedComplaint}
              onClose={() => setShowReceiptModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs font-bold text-slate-500">جاري تحميل صفحة المتابعة...</div>}>
      <TrackContent />
    </Suspense>
  );
}
