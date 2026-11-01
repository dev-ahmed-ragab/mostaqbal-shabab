'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  FileSpreadsheet, 
  Printer, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  Eye, 
  Download, 
  Check, 
  FileText, 
  ChevronLeft, 
  LockKeyhole,
  EyeOff,
  MapPin,
  ExternalLink,
  Phone,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
  X,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '@/types/database';
import { complaintsService } from '@/lib/complaintsService';
import { YOUTH_SECRETARIAT } from '@/lib/auth';
import { StatusBadge } from '@/components/StatusBadge';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { exportComplaintsToExcel } from '@/lib/exportExcel';
import { generateBulkComplaintsPdf, printBulkComplaintsWindow } from '@/lib/generateBulkPdf';
import { generateSingleComplaintPdf } from '@/lib/generateSinglePdf';
import { authService, AdminUser, ROLES_META } from '@/lib/auth';

function ComplaintsManagerContent() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // إخفاء / كشف البيانات الحساسة لأمان المواطن
  const [maskSensitiveData, setMaskSensitiveData] = useState(true);

  // مودال تفاصيل الشكوى الكامل مع الخريطة والقرارات
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // نموذج اتخاذ القرار والتأشيرة
  const [actionStatus, setActionStatus] = useState<ComplaintStatus>('under_review');
  const [actionNote, setActionNote] = useState('');
  const [actionPublishResponse, setActionPublishResponse] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [todayStr, setTodayStr] = useState('');
  const [isGeneratingBulkPdf, setIsGeneratingBulkPdf] = useState(false);
  const [isGeneratingSinglePdfId, setIsGeneratingSinglePdfId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const u = authService.getCurrentUser();
      setCurrentUser(u);

      const all = await complaintsService.getAll();
      setComplaints(all);
    } catch (err) {
      console.error(err);
      showToast('تعذر تحميل الشكاوى، يرجى إعادة المحاولة');
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

  const isAdmin = Boolean(currentUser);

  // مزامنة حالة المودال عند اختيار شكوى
  const handleOpenDetailModal = (c: Complaint) => {
    setSelectedComplaint(c);
    setActionStatus(c.status);
    setActionNote(c.admin_notes || '');
    setActionPublishResponse(Boolean(c.public_response));
  };

  // حفظ التأشيرة وتحديث الحالة
  const handleSaveDecision = async () => {
    if (!selectedComplaint) return;
    if (!isAdmin && (actionStatus === 'resolved' || actionStatus === 'rejected')) {
      alert('اعتماد إنهاء أو رفض الشكوى مقتصر على أمين رعاية الشباب أو المشرف العام.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const actor = `${currentUser?.name || 'مسؤول المنظومة'} (${currentUser?.role ? ROLES_META[currentUser.role]?.label : 'إداري'})`;
      await complaintsService.updateStatus(
        selectedComplaint.id,
        actionStatus,
        actionNote.trim() || undefined,
        actor,
        actionPublishResponse ? actionNote.trim() || undefined : undefined
      );

      const updated = {
        ...selectedComplaint,
        status: actionStatus,
        admin_notes: actionNote.trim() || selectedComplaint.admin_notes,
        public_response: actionPublishResponse
          ? actionNote.trim() || selectedComplaint.public_response
          : selectedComplaint.public_response,
      };

      setComplaints((prev) =>
        prev.map((c) => (c.id === selectedComplaint.id ? updated : c))
      );
      setSelectedComplaint(updated);
      showToast('تم حفظ التأشيرة والقرار بنجاح وتحديث بيانات الشكوى');
    } catch (err) {
      console.error(err);
      alert('فشل حفظ التأشيرة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // التصفية والبحث
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && (c.priority || 'normal') !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesCode = c.tracking_code.toLowerCase().includes(q);
        const matchesName = c.citizen_name.toLowerCase().includes(q);
        const matchesPhone = c.primary_phone.includes(q);
        const matchesNatId = c.national_id.includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesAddress = (c.location_address || '').toLowerCase().includes(q);
        return matchesCode || matchesName || matchesPhone || matchesNatId || matchesTitle || matchesAddress;
      }
      return true;
    });
  }, [complaints, statusFilter, priorityFilter, searchQuery]);

  // التحديد المتعدد
  const isAllSelected = filteredComplaints.length > 0 && selectedIds.size === filteredComplaints.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredComplaints.map((c) => c.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExportExcel = () => {
    const listToExport = selectedIds.size > 0
      ? complaints.filter((c) => selectedIds.has(c.id))
      : filteredComplaints;

    if (listToExport.length === 0) {
      alert('لا توجد شكاوى للتصدير.');
      return;
    }

    exportComplaintsToExcel(listToExport, `شكاوى_أمانة_الشباب_${todayStr || '2026'}.xlsx`);
    showToast(`تم تصدير ${listToExport.length} شكوى بنجاح بصيغة Excel`);
  };

  const handleExportBulkPdf = async () => {
    const listToExport = selectedIds.size > 0
      ? complaints.filter((c) => selectedIds.has(c.id))
      : filteredComplaints;

    if (listToExport.length === 0) {
      alert('لا توجد شكاوى لتصديرها إلى PDF.');
      return;
    }

    setIsGeneratingBulkPdf(true);
    try {
      await generateBulkComplaintsPdf(
        listToExport,
        'كشف شكاوى ومقترحات المواطنين - أمانة رعاية الشباب'
      );
      showToast('تم استخراج ملف PDF المعتمد بنجاح');
    } catch {
      alert('حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مجدداً.');
    } finally {
      setIsGeneratingBulkPdf(false);
    }
  };

  const handleDownloadSinglePdf = async (e: React.MouseEvent, complaintToDownload: Complaint) => {
    e.stopPropagation();
    setIsGeneratingSinglePdfId(complaintToDownload.id);
    try {
      await generateSingleComplaintPdf(complaintToDownload);
      showToast(`تم تنزيل إشعار الشكوى (${complaintToDownload.tracking_code}) بصيغة PDF بنجاح`);
    } catch (err) {
      console.error(err);
      showToast('تعذر تنزيل ملف PDF، يرجى المحاولة مرة أخرى');
    } finally {
      setIsGeneratingSinglePdfId(null);
    }
  };

  const handlePrint = () => {
    const listToExport = selectedIds.size > 0
      ? complaints.filter((c) => selectedIds.has(c.id))
      : filteredComplaints;

    if (listToExport.length === 0) {
      alert('لا توجد شكاوى للطباعة.');
      return;
    }

    printBulkComplaintsWindow(listToExport, 'كشف شكاوى ومقترحات أمانة رعاية الشباب بمركز بركة السبع');
  };

  return (
    <div className="space-y-6">
      {/* إشعار التوست */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#133063] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#00a3e0]/40 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-[#00a3e0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* الترويسة العلوية */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#00a3e0] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              حزب مستقبل وطن • أمانة مركز بركة السبع
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-bold text-slate-500">إدارة الشكاوى والطلبات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#133063]">
            جدول الشكاوى والمتابعة الميدانية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            استعراض كافة طلبات المواطنين، اتخاذ التأشيرات الرسمية، فحص المواقع على الخريطة، والتواصل المباشر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            تصدير Excel
          </button>

          <button
            type="button"
            onClick={handleExportBulkPdf}
            disabled={isGeneratingBulkPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            كشف PDF معتمد
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold transition shadow-md shadow-[#133063]/20 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            طباعة الكشف
          </button>
        </div>
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* محرك البحث */}
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بكود الشكوى، اسم المواطن، رقم الهاتف، الرقم القومي، أو موضوع الطلب..."
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* فلتر الأولوية */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 cursor-pointer"
          >
            <option value="all">كل درجات الأهمية</option>
            <option value="normal">عادي</option>
            <option value="urgent">عاجل</option>
            <option value="emergency">طارئ جداً</option>
          </select>

          {/* زر تبديل الخصوصية */}
          <button
            type="button"
            onClick={() => setMaskSensitiveData(!maskSensitiveData)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shrink-0"
            title="إخفاء/إظهار الأرقام الحساسة"
          >
            {maskSensitiveData ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>إخفاء الأرقام القومية</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#00a3e0]" />
                <span>كشف الأرقام الحساسة</span>
              </>
            )}
          </button>
        </div>

        {/* فلاتر الحالة السريعة كأزرار Tabs نظيفة */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 ml-2">حالة الطلب:</span>
          {[
            { key: 'all', label: 'الكل', count: complaints.length },
            { key: 'new', label: 'جديد', count: complaints.filter(c => c.status === 'new').length },
            { key: 'under_review', label: 'قيد المراجعة', count: complaints.filter(c => c.status === 'under_review').length },
            { key: 'in_progress', label: 'جاري التنفيذ', count: complaints.filter(c => c.status === 'in_progress').length },
            { key: 'resolved', label: 'تم الحل بنجاح', count: complaints.filter(c => c.status === 'resolved').length },
            { key: 'needs_info', label: 'استكمال بيانات', count: complaints.filter(c => c.status === 'needs_info').length },
            { key: 'rejected', label: 'مرفوض', count: complaints.filter(c => c.status === 'rejected').length },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#133063] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* شريط الإجراءات عند تحديد شكاوى متعددة */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50/80 border-2 border-[#00a3e0]/40 rounded-3xl p-3.5 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a3e0] animate-pulse" />
            <span className="text-xs font-black text-[#133063]">
              تم تحديد <span className="underline font-mono text-sm">{selectedIds.size}</span> شكوى
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline px-2.5 py-1 rounded-xl bg-white border border-rose-200 cursor-pointer transition shadow-2xs"
            >
              إلغاء التحديد
            </button>
            {selectedIds.size < filteredComplaints.length && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set(filteredComplaints.map(c => c.id)))}
                className="text-xs font-bold text-[#133063] hover:underline px-2.5 py-1 rounded-xl bg-white border border-slate-200 cursor-pointer transition shadow-2xs"
              >
                تحديد جميع المعروض ({filteredComplaints.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              تصدير المحدد ({selectedIds.size})
            </button>

            <button
              type="button"
              onClick={handleExportBulkPdf}
              disabled={isGeneratingBulkPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-300 bg-white text-rose-800 text-xs font-bold hover:bg-rose-50 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              PDF للمحدد
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#00a3e0]" />
              طباعة المحدد
            </button>
          </div>
        </div>
      )}

      {/* جدول الشكاوى */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-1 text-slate-400 hover:text-[#133063]"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#00a3e0]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4 w-28">كود التتبع</th>
                <th className="py-3.5 px-4">مقدم الطلب والموضوع</th>
                <th className="py-3.5 px-4 w-36">الموقع / العنوان</th>
                <th className="py-3.5 px-4 w-32">الحالة</th>
                <th className="py-3.5 px-4 w-24">تاريخ الورود</th>
                <th className="py-3.5 px-4 w-36 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00a3e0]" />
                    جاري تحميل بيانات الشكاوى...
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد شكاوى مطابقة للبحث أو الفلتر المحدد.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => {
                  const isSelected = selectedIds.has(c.id);
                  const displayPhone = maskSensitiveData
                    ? c.primary_phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
                    : c.primary_phone;
                  const hasLocation = Boolean(c.location_lat && c.location_lng) || Boolean(c.location_address);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenDetailModal(c)}
                      className={`hover:bg-blue-50/40 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* صندوق التحديد */}
                      <td 
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(c.id);
                        }}
                      >
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-[#133063]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#00a3e0]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* كود الشكوى */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#133063] bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {c.tracking_code}
                          </span>
                          {c.is_confidential && (
                            <span title="طلب سري" className="text-amber-600">
                              <LockKeyhole className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* بيانات المواطن والموضوع */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#133063] block text-xs sm:text-sm">
                              {c.citizen_name}
                            </span>
                            {c.priority === 'urgent' && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                عاجل
                              </span>
                            )}
                            {c.priority === 'emergency' && (
                              <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[10px] font-extrabold animate-pulse">
                                طارئ
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-slate-800 line-clamp-1 max-w-sm">
                            {c.title}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="font-mono" dir="ltr">{displayPhone}</span>
                            {c.admin_notes && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500 italic line-clamp-1 max-w-[200px]">
                                  تأشيرة: {c.admin_notes}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* الموقع الجغرافي */}
                      <td className="py-3.5 px-4">
                        {hasLocation ? (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-[#00a3e0] shrink-0" />
                            <span className="text-[11px] font-bold truncate max-w-[140px]" title={c.location_address || 'إحداثيات محددة'}>
                              {c.location_address || 'إحداثيات GPS'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">غير محدد</span>
                        )}
                      </td>

                      {/* الحالة */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>

                      {/* تاريخ التسجيل */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('ar-EG') : '—'}
                      </td>

                      {/* الإجراءات السريعة */}
                      <td 
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleDownloadSinglePdf(e, c)}
                            disabled={isGeneratingSinglePdfId === c.id}
                            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 transition disabled:opacity-50 cursor-pointer"
                            title="تنزيل PDF معتمد مباشرة"
                          >
                            {isGeneratingSinglePdfId === c.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                            ) : (
                              <Download className="w-4 h-4 text-emerald-700" />
                            )}
                          </button>

                          <WhatsAppButton
                            complaint={c}
                            iconOnly={true}
                          />

                          <Link
                            href={`/admin/print/${c.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                            title="معاينة وطباعة المستند الرسمي"
                          >
                            <Printer className="w-4 h-4 text-slate-500" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة تفاصيل الشكوى الكاملة مع الخريطة والتأشيرات (Detail Modal) */}
      {selectedComplaint && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedComplaint(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 relative shadow-2xl border border-slate-200 my-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* الترويسة العلوية للمودال */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#00a3e0]">طلب رسمي:</span>
                  <span className="font-mono font-black text-lg text-[#133063]">
                    {selectedComplaint.tracking_code}
                  </span>
                  <StatusBadge status={selectedComplaint.status} />
                </div>
                <span className="text-[11px] text-slate-400">
                  تاريخ التسجيل: {new Date(selectedComplaint.created_at).toLocaleString('ar-EG')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* بيانات مقدم الطلب */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-black text-[#133063] block text-xs mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00a3e0]" />
                  بيانات المواطن مقدم الشكوى:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div><b>الاسم الكامل:</b> {selectedComplaint.citizen_name}</div>
                  <div><b>الرقم القومي:</b> <span className="font-mono">{selectedComplaint.national_id}</span></div>
                  <div className="flex items-center gap-2">
                    <b>رقم الهاتف:</b> 
                    <span className="font-mono" dir="ltr">{selectedComplaint.primary_phone}</span>
                    <a
                      href={`tel:${selectedComplaint.primary_phone}`}
                      className="p-1 rounded bg-blue-100 text-[#133063] hover:bg-blue-200 transition"
                      title="اتصال مباشر"
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <b>الأمانة المختصة:</b> {selectedComplaint.committee_name || 'أمانة رعاية الشباب بمركز بركة السبع'}
                  </div>
                </div>
              </div>

              {/* نص موضوع الشكوى وتفاصيلها */}
              <div className="space-y-2">
                <span className="font-black text-[#133063] block text-xs">
                  موضوع الطلب:
                </span>
                <p className="font-extrabold text-slate-900 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/80 leading-relaxed">
                  {selectedComplaint.title}
                </p>

                <span className="font-black text-[#133063] block pt-2 text-xs">
                  شرح وتفاصيل الشكوى:
                </span>
                <div className="text-slate-700 bg-white p-4 rounded-2xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedComplaint.description}
                </div>
              </div>

              {/* قسم الموقع والخريطة الجغرافية (إذا توفر لوكيشن أو عنوان) */}
              {(selectedComplaint.location_address || (selectedComplaint.location_lat && selectedComplaint.location_lng)) && (
                <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#133063] block text-xs flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#00a3e0]" />
                      الموقع الجغرافي للشكوى:
                    </span>
                    {selectedComplaint.location_lat && selectedComplaint.location_lng ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedComplaint.location_lat},${selectedComplaint.location_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00a3e0] hover:underline"
                      >
                        فتح في خرائط Google
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedComplaint.location_address || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00a3e0] hover:underline"
                      >
                        بحث في خرائط Google
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {selectedComplaint.location_address && (
                    <p className="text-xs text-slate-700 font-bold bg-white p-2.5 rounded-xl border border-sky-100">
                      📍 {selectedComplaint.location_address}
                    </p>
                  )}

                  {/* خريطة مدمجة حية عبر إحداثيات GPS */}
                  {selectedComplaint.location_lat && selectedComplaint.location_lng && (
                    <div className="w-full h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                      <iframe
                        title="خريطة موقع الشكوى"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://maps.google.com/maps?q=${selectedComplaint.location_lat},${selectedComplaint.location_lng}&hl=ar&z=15&output=embed`}
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* قسم التأشيرة الرسمية والقرار الإداري */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                <span className="font-black text-amber-900 block text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  اتخاذ القرار والتأشيرة الرسمية (للمشرفين):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      تحديث حالة الطلب:
                    </label>
                    <select
                      value={actionStatus}
                      onChange={(e) => setActionStatus(e.target.value as ComplaintStatus)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
                    >
                      <option value="new">جديد</option>
                      <option value="under_review">قيد المراجعة والدراسة</option>
                      <option value="in_progress">جاري التنفيذ والمتابعة الميدانية</option>
                      <option value="resolved">تم الحل والإنجاز بنجاح ✅</option>
                      <option value="needs_info">يحتاج استكمال بيانات أو مستندات ⚠️</option>
                      <option value="rejected">مرفوض مع ذكر الأسباب ❌</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-start gap-2 cursor-pointer mt-4 select-none">
                      <input
                        type="checkbox"
                        checked={actionPublishResponse}
                        onChange={(e) => setActionPublishResponse(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-[#133063] focus:ring-[#00a3e0]"
                      />
                      <span className="text-[11px] font-bold text-slate-700">
                        نشر التأشيرة كرد رسمي يظهر للمواطن عند الاستعلام
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    نص التأشيرة والملاحظات الإدارية:
                  </label>
                  <textarea
                    rows={3}
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="اكتب التوجيه أو قرار الأمانة أو الإجراء المتخذ مع الجهات التنفيذية..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveDecision}
                    disabled={isSubmittingAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingAction ? 'جاري حفظ التأشيرة...' : 'اعتماد وحفظ القرار'}
                  </button>
                </div>
              </div>

              {/* أزرار سريعة في ذيل المودال */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <WhatsAppButton
                    complaint={selectedComplaint}
                    customNote={actionNote || undefined}
                    label="مراسلة المواطن واتساب"
                  />

                  <button
                    type="button"
                    onClick={(e) => handleDownloadSinglePdf(e, selectedComplaint)}
                    disabled={isGeneratingSinglePdfId === selectedComplaint.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingSinglePdfId === selectedComplaint.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                    تنزيل PDF مباشر
                  </button>

                  <Link
                    href={`/admin/print/${selectedComplaint.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    معاينة الطباعة
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminComplaintsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">جاري تحميل إدارة الشكاوى...</div>}>
      <ComplaintsManagerContent />
    </Suspense>
  );
}
