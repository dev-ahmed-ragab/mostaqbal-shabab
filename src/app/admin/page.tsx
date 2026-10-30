'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  CheckSquare, 
  Square, 
  Clock, 
  AlertCircle, 
  Phone, 
  RefreshCw, 
  Eye, 
  ShieldCheck, 
  MapPin, 
  Mail, 
  Download, 
  Lock, 
  Check, 
  ShieldAlert, 
  FileText, 
  Building2, 
  Layers, 
  ArrowRightLeft, 
  ChevronLeft, 
  Filter, 
  Zap, 
  CheckCircle2,
  LockKeyhole,
  EyeOff
} from 'lucide-react';
import { Complaint, ComplaintStatus, STATUS_META } from '@/types/database';
import { complaintsService } from '@/lib/complaintsService';
import { committeesService } from '@/lib/committeesService';
import { StatusBadge } from '@/components/StatusBadge';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { exportComplaintsToExcel } from '@/lib/exportExcel';
import { generateBulkComplaintsPdf, printBulkComplaintsWindow } from '@/lib/generateBulkPdf';
import { AdminCharts } from '@/components/AdminCharts';
import { authService, AdminUser, CommitteeDef, ROLES_META } from '@/lib/auth';

function AdminComplaintsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCommParam = searchParams.get('committee');

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [committees, setCommittees] = useState<CommitteeDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [committeeFilter, setCommitteeFilter] = useState<string>(initialCommParam || 'all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // إخفاء / كشف البيانات الحساسة لأمان المواطن
  const [maskSensitiveData, setMaskSensitiveData] = useState(true);

  // مودال تفاصيل الشكوى
  const [viewComplaint, setViewComplaint] = useState<Complaint | null>(null);

  // مودال تغيير الحالة وتأشيرة المشرف
  const [statusModalComplaint, setStatusModalComplaint] = useState<Complaint | null>(null);
  const [modalNewStatus, setModalNewStatus] = useState<ComplaintStatus>('under_review');
  const [modalNote, setModalNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // مودال تحويل الشكوى للجنة ثانية (خاص بالأدمن العام)
  const [transferModalComplaint, setTransferModalComplaint] = useState<Complaint | null>(null);
  const [targetCommitteeId, setTargetCommitteeId] = useState('');

  const [todayStr, setTodayStr] = useState('');
  const [isGeneratingBulkPdf, setIsGeneratingBulkPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const u = authService.getCurrentUser();
      setCurrentUser(u);
      
      const comms = committeesService.getActive();
      setCommittees(comms);
      if (comms.length > 0 && !targetCommitteeId) {
        setTargetCommitteeId(comms[0].id);
      }

      // إذا كان رئيس لجنة، نضبط الفلتر على لجنته تلقائياً إذا لم يحدد غير ذلك
      if (u && u.role === 'committee_head' && u.committeeId && !initialCommParam) {
        setCommitteeFilter(u.committeeId);
      }

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

    const unsubComm = committeesService.subscribe(() => {
      setCommittees(committeesService.getActive());
    });
    const unsubAuth = authService.subscribe(() => {
      setCurrentUser(authService.getCurrentUser());
    });

    return () => {
      unsubComm();
      unsubAuth();
    };
  }, []);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isHead = currentUser?.role === 'committee_head';
  const isExec = currentUser?.role === 'executive_member';

  // حساب مؤشرات الأداء الحية
  const stats = useMemo(() => {
    const list = committeeFilter === 'all' 
      ? complaints 
      : complaints.filter(c => (c.committee_id || 'youth') === committeeFilter);

    const total = list.length;
    const today = todayStr ? list.filter((c) => c.created_at.startsWith(todayStr)).length : 0;
    const newCount = list.filter((c) => c.status === 'new').length;
    const underReview = list.filter((c) => c.status === 'under_review').length;
    const needsInfo = list.filter((c) => c.status === 'needs_info').length;
    const inProgress = list.filter((c) => c.status === 'in_progress').length;
    const resolved = list.filter((c) => c.status === 'resolved').length;
    const rejected = list.filter((c) => c.status === 'rejected').length;

    return { total, today, newCount, underReview, needsInfo, inProgress, resolved, rejected };
  }, [complaints, todayStr, committeeFilter]);

  // التصفية والبحث
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // فلتر اللجنة
      if (committeeFilter !== 'all') {
        const cId = c.committee_id || 'youth';
        if (cId !== committeeFilter) return false;
      }
      // فلتر الحالة
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      // نص البحث
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesCode = c.tracking_code.toLowerCase().includes(q);
        const matchesName = c.citizen_name.toLowerCase().includes(q);
        const matchesPhone = c.primary_phone.includes(q);
        const matchesNatId = c.national_id.includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        return matchesCode || matchesName || matchesPhone || matchesNatId || matchesTitle;
      }
      return true;
    });
  }, [complaints, committeeFilter, statusFilter, searchQuery]);

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
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // تعديل سريع ومباشر للحالة من داخل الجدول مع فحص الصلاحية
  const handleQuickStatusChange = async (complaintId: string, newStatus: ComplaintStatus) => {
    if (!isAdmin && !isHead && (newStatus === 'resolved' || newStatus === 'rejected')) {
      alert('اعتماد إنهاء أو رفض الشكوى مقتصر على رئيس اللجنة أو المشرف العام.');
      return;
    }

    try {
      const actor = `${currentUser?.name || 'مسؤول المنظومة'} (${currentUser?.role ? ROLES_META[currentUser.role]?.label : 'إداري'})`;
      await complaintsService.updateStatus(complaintId, newStatus, undefined, actor);
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
      );
      showToast('تم تحديث حالة الشكوى بنجاح وتوثيق المسؤول');
    } catch {
      alert('حدث خطأ أثناء تحديث الحالة.');
    }
  };

  // تأشيرة مفصلة وقرار معتمد
  const handleSaveModalStatus = async () => {
    if (!statusModalComplaint) return;
    if (!isAdmin && !isHead && (modalNewStatus === 'resolved' || modalNewStatus === 'rejected')) {
      alert('تأشيرة الإنهاء أو الرفض النهائي مقتصرة على رئيس اللجنة أو المشرف العام.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const actor = `${currentUser?.name || 'مسؤول المنظومة'} (${currentUser?.role ? ROLES_META[currentUser.role]?.label : 'إداري'})`;
      await complaintsService.updateStatus(
        statusModalComplaint.id,
        modalNewStatus,
        modalNote.trim() || undefined,
        actor
      );

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === statusModalComplaint.id
            ? { ...c, status: modalNewStatus, admin_notes: modalNote.trim() || c.admin_notes }
            : c
        )
      );

      setStatusModalComplaint(null);
      showToast('تم تسجيل تأشيرة وقرار اللجنة بنجاح وتحديث السجل');
    } catch (err) {
      console.error(err);
      alert('فشل حفظ التأشيرة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // تحويل الشكوى إلى لجنة ثانية (خاص بالأدمن العام)
  const handleTransferCommittee = async () => {
    if (!transferModalComplaint) return;
    if (!isAdmin) {
      alert('إحالة وتحويل الشكاوى بين اللجان مقتصر على المشرف العام (أمانة التنظيم).');
      return;
    }

    const targetComm = committees.find(c => c.id === targetCommitteeId);
    if (!targetComm) return;

    try {
      await complaintsService.updateCommittee(
        transferModalComplaint.id,
        targetComm.id,
        targetComm.name,
        `تم تحويل الشكوى إلى "${targetComm.name}" بمعرفة المشرف العام`
      );

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === transferModalComplaint.id
            ? { ...c, committee_id: targetComm.id, committee_name: targetComm.name }
            : c
        )
      );

      setTransferModalComplaint(null);
      showToast(`تم تحويل الشكوى إلى "${targetComm.name}" بنجاح`);
    } catch (err) {
      console.error(err);
      alert('فشل تحويل الشكوى.');
    }
  };

  // طباعة الكشف عبر نافذة المتصفح المعتمدة فورياً
  const handleDirectPrint = () => {
    const listToExport = selectedIds.size > 0
      ? filteredComplaints.filter((c) => selectedIds.has(c.id))
      : filteredComplaints;

    if (listToExport.length === 0) {
      alert('لا توجد طلبات لطباعتها.');
      return;
    }

    const commName = committeeFilter === 'all'
      ? 'كافة اللجان النوعية'
      : committees.find(c => c.id === committeeFilter)?.name || 'لجنة رعاية الشباب';

    printBulkComplaintsWindow(listToExport, {
      committeeName: commName,
      printedBy: currentUser?.name || 'مسؤول المنظومة',
    });
  };

  // تصدير PDF مجمع للكشوف
  const handleBulkPdfExport = async () => {
    const listToExport = selectedIds.size > 0
      ? filteredComplaints.filter((c) => selectedIds.has(c.id))
      : filteredComplaints;

    if (listToExport.length === 0) {
      alert('لا توجد طلبات لتصديرها.');
      return;
    }

    setIsGeneratingBulkPdf(true);
    try {
      const commName = committeeFilter === 'all'
        ? 'كافة اللجان النوعية'
        : committees.find(c => c.id === committeeFilter)?.name || 'لجنة رعاية الشباب';

      await generateBulkComplaintsPdf(listToExport, {
        committeeName: commName,
        printedBy: currentUser?.name || 'مسؤول المنظومة',
      });
      showToast(`تم استخراج ملف PDF بنجاح لعدد ${listToExport.length} طلب`);
    } catch (err) {
      console.error(err);
      alert('فشل إنشاء ملف الـ PDF المجمع.');
    } finally {
      setIsGeneratingBulkPdf(false);
    }
  };

  // تصدير إكسيل
  const handleExcelExport = () => {
    const listToExport = selectedIds.size > 0
      ? filteredComplaints.filter((c) => selectedIds.has(c.id))
      : filteredComplaints;

    if (listToExport.length === 0) {
      alert('لا توجد شكاوى لتصديرها.');
      return;
    }

    exportComplaintsToExcel(listToExport, `كشف_شكاوى_${committeeFilter}_${todayStr}.xlsx`);
    showToast(`تم تصدير ${listToExport.length} شكوى إلى Excel`);
  };

  return (
    <div className="space-y-6">
      {/* إشعار الـ Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#133063] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-[#00a3e0] transition-all">
          <Check className="w-4 h-4 text-[#00a3e0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* بطاقة الرأس والتحكم العلوي */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#ce1126]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#133063] border border-blue-200 text-[11px] font-extrabold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#00a3e0]" />
                إدارة وفحص الشكاوى
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                آخر تحديث: {todayStr}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#133063]">
              مراجعة واعتماد طلبات المواطنين
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              فحص الشكاوى بدقة وسرية، توجيهها للجان المختصة، اعتماد التأشيرات الميدانية، وإرسال التحديثات الرسمية للمواطنين عبر المنظومة وواتساب.
            </p>
          </div>

          {/* أزرار العمليات السريعة */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* زر تفعيل الخصوصية وإخفاء الأرقام القومية */}
            <button
              type="button"
              onClick={() => setMaskSensitiveData(!maskSensitiveData)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition border ${
                maskSensitiveData
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="تفعيل وضع حماية خصوصية بيانات المواطنين"
            >
              {maskSensitiveData ? <EyeOff className="w-4 h-4 text-amber-700" /> : <Eye className="w-4 h-4" />}
              <span>{maskSensitiveData ? 'البيانات محمية (مشفرة)' : 'عرض كامل الأرقام'}</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00a3e0]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleExcelExport}
              disabled={filteredComplaints.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handleBulkPdfExport}
              disabled={filteredComplaints.length === 0 || isGeneratingBulkPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold transition shadow-md shadow-[#133063]/20 disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-[#00a3e0]" />
              <span>{isGeneratingBulkPdf ? 'جاري التحضير...' : 'طباعة كشف مجمع'}</span>
            </button>
          </div>
        </div>

        {/* كروت الإحصاءات السريعة الحية */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-6 pt-6 border-t border-slate-100">
          <div 
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-2xl cursor-pointer transition border ${
              statusFilter === 'all' ? 'bg-[#133063] text-white border-[#133063]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`text-[10px] font-bold block ${statusFilter === 'all' ? 'text-blue-200' : 'text-slate-400'}`}>
              الكل
            </span>
            <span className="text-lg font-black mt-0.5 block">{stats.total}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('new')}
            className={`p-3 rounded-2xl cursor-pointer transition border ${
              statusFilter === 'new' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50/70 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span className={`text-[10px] font-bold block ${statusFilter === 'new' ? 'text-white' : 'text-blue-700'}`}>
              جديد
            </span>
            <span className="text-lg font-black mt-0.5 block">{stats.newCount}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('under_review')}
            className={`p-3 rounded-2xl cursor-pointer transition border ${
              statusFilter === 'under_review' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className={`text-[10px] font-bold block ${statusFilter === 'under_review' ? 'text-white' : 'text-amber-800'}`}>
              قيد المراجعة
            </span>
            <span className="text-lg font-black mt-0.5 block">{stats.underReview}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('needs_info')}
            className={`p-3 rounded-2xl cursor-pointer transition border ${
              statusFilter === 'needs_info' ? 'bg-orange-600 text-white border-orange-600' : 'bg-orange-50/70 border-orange-200 hover:bg-orange-100'
            }`}
          >
            <span className={`text-[10px] font-bold block ${statusFilter === 'needs_info' ? 'text-white' : 'text-orange-800'}`}>
              استكمال بيانات
            </span>
            <span className="text-lg font-black mt-0.5 block">{stats.needsInfo}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('in_progress')}
            className={`p-3 rounded-2xl cursor-pointer transition border ${
              statusFilter === 'in_progress' ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50/70 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span className={`text-[10px] font-bold block ${statusFilter === 'in_progress' ? 'text-white' : 'text-purple-800'}`}>
              جاري التنفيذ
            </span>
            <span className="text-lg font-black mt-0.5 block">{stats.inProgress}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('resolved')}
            className={`p-3 rounded-2xl cursor-pointer transition border ${
              statusFilter === 'resolved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className={`text-[10px] font-bold block ${statusFilter === 'resolved' ? 'text-white' : 'text-emerald-800'}`}>
              تم الحل
            </span>
            <span className="text-lg font-black mt-0.5 block">{stats.resolved}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('rejected')}
            className={`p-3 rounded-2xl cursor-pointer transition border ${
              statusFilter === 'rejected' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className={`text-[10px] font-bold block ${statusFilter === 'rejected' ? 'text-white' : 'text-rose-800'}`}>
              مرفوض
            </span>
            <span className="text-lg font-black mt-0.5 block">{stats.rejected}</span>
          </div>
        </div>

        {/* الشريط البياني المرئي لتوزيع المشاكل ونسبة الإنجاز */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#133063] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#00a3e0]" />
              <span>التمثيل البياني لحالات الشكاوى الحالية (نظرة تنفيذية سريعة):</span>
            </span>
            <Link
              href="/admin/reports"
              className="text-[#00a3e0] hover:underline font-bold text-[11px] flex items-center gap-1"
            >
              <span>فتح الرسوم البيانية الموسعة</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3.5 flex overflow-hidden p-0.5 gap-0.5">
            {stats.newCount > 0 && (
              <div
                title={`جديد: ${stats.newCount}`}
                style={{ width: `${(stats.newCount / (stats.total || 1)) * 100}%` }}
                className="bg-blue-500 h-full rounded-xs transition-all"
              />
            )}
            {stats.underReview > 0 && (
              <div
                title={`قيد المراجعة: ${stats.underReview}`}
                style={{ width: `${(stats.underReview / (stats.total || 1)) * 100}%` }}
                className="bg-amber-500 h-full rounded-xs transition-all"
              />
            )}
            {stats.needsInfo > 0 && (
              <div
                title={`استكمال بيانات: ${stats.needsInfo}`}
                style={{ width: `${(stats.needsInfo / (stats.total || 1)) * 100}%` }}
                className="bg-orange-500 h-full rounded-xs transition-all"
              />
            )}
            {stats.inProgress > 0 && (
              <div
                title={`جاري التنفيذ: ${stats.inProgress}`}
                style={{ width: `${(stats.inProgress / (stats.total || 1)) * 100}%` }}
                className="bg-purple-500 h-full rounded-xs transition-all"
              />
            )}
            {stats.resolved > 0 && (
              <div
                title={`تم الحل: ${stats.resolved}`}
                style={{ width: `${(stats.resolved / (stats.total || 1)) * 100}%` }}
                className="bg-emerald-500 h-full rounded-xs transition-all"
              />
            )}
            {stats.rejected > 0 && (
              <div
                title={`مرفوض: ${stats.rejected}`}
                style={{ width: `${(stats.rejected / (stats.total || 1)) * 100}%` }}
                className="bg-rose-500 h-full rounded-xs transition-all"
              />
            )}
          </div>
        </div>
      </div>

      {/* شريط الفلاتر والبحث المتقدم */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالكود، الاسم، الهاتف، الرقم القومي..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* فلتر اختيار اللجنة (ديناميكي من اللجان المسجلة) */}
          <select
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
          >
            <option value="all">كافة اللجان ({complaints.length})</option>
            {committees.map((comm) => (
              <option key={comm.id} value={comm.id}>
                {comm.name}
              </option>
            ))}
          </select>

          {/* فلتر الحالة */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
          >
            <option value="all">كافة الحالات</option>
            <option value="new">جديد</option>
            <option value="under_review">قيد المراجعة</option>
            <option value="needs_info">يحتاج استكمال بيانات</option>
            <option value="in_progress">جاري المتابعة والتنفيذ</option>
            <option value="resolved">تم الحل بنجاح</option>
            <option value="rejected">مرفوض</option>
          </select>

          {/* زر إعادة ضبط الفلاتر */}
          {(statusFilter !== 'all' || committeeFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCommitteeFilter('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline px-2"
            >
              إلغاء الفلترة
            </button>
          )}
        </div>
      </div>

      {/* شريط الإجراءات الجماعية إذا تم تحديد صفوف */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs animate-in slide-in-from-top-1">
          <span className="font-extrabold text-[#133063]">
            تم تحديد {selectedIds.size} من أصل {filteredComplaints.length} طلب
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkPdfExport}
              className="px-3 py-1.5 rounded-xl bg-[#133063] text-white font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-[#00a3e0]" />
              طباعة كشف المحدد
            </button>
            <button
              type="button"
              onClick={handleExcelExport}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              تصدير المحدد Excel
            </button>
          </div>
        </div>
      )}

      {/* جدول فحص الشكاوى المركزي */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <button type="button" onClick={toggleSelectAll} className="p-1 hover:text-[#133063]">
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-[#00a3e0]" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3.5 px-4">كود الطلب</th>
                <th className="py-3.5 px-4">المواطن وموضوع الطلب</th>
                <th className="py-3.5 px-4">اللجنة المختصة</th>
                <th className="py-3.5 px-4">الحالة والتأشيرة</th>
                <th className="py-3.5 px-4">تاريخ التقديم</th>
                <th className="py-3.5 px-4 text-center">إجراءات المراجعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                    لا توجد شكاوى أو طلبات مطابقة للمعايير المحددة.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => {
                  const isSelected = selectedIds.has(c.id);
                  const isConfidential = Boolean(c.is_confidential);

                  // إخفاء الأرقام القومية للخصوصية إذا تم تفعيل وضع الحماية
                  const displayNatId = maskSensitiveData && c.national_id.length >= 14
                    ? `${c.national_id.slice(0, 4)}••••••${c.national_id.slice(-4)}`
                    : c.national_id;

                  const displayPhone = maskSensitiveData && c.primary_phone.length >= 10
                    ? `${c.primary_phone.slice(0, 3)}••••${c.primary_phone.slice(-3)}`
                    : c.primary_phone;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* صندوق التحديد */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(c.id)}
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
                          <span className="font-mono font-bold text-[#133063] bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {c.tracking_code}
                          </span>
                          {isConfidential && (
                            <span title="طلب سري وخاص" className="text-amber-600">
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
                            {c.wants_promotion && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                طلب انضمام
                              </span>
                            )}
                          </div>

                          <p className="font-bold text-slate-800 line-clamp-1 max-w-sm">
                            {c.title}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="font-mono" dir="ltr">{displayPhone}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px]">الرقم القومي: {displayNatId}</span>
                          </div>
                        </div>
                      </td>

                      {/* اللجنة المختصة */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] inline-block">
                          {c.committee_name || 'لجنة رعاية الشباب'}
                        </span>
                      </td>

                      {/* الحالة وتغييرها السريع */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <select
                            value={c.status}
                            onChange={(e) => handleQuickStatusChange(c.id, e.target.value as ComplaintStatus)}
                            className="text-[11px] font-bold py-1 px-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#00a3e0]"
                          >
                            <option value="new">جديد</option>
                            <option value="under_review">قيد المراجعة</option>
                            <option value="needs_info">يحتاج استكمال بيانات</option>
                            <option value="in_progress">جاري التنفيذ</option>
                            <option value="resolved">تم الحل</option>
                            <option value="rejected">مرفوض</option>
                          </select>

                          {c.admin_notes && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 italic max-w-xs">
                              تأشيرة: {c.admin_notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* تاريخ التسجيل */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('ar-EG') : '—'}
                      </td>

                      {/* إجراءات المراجعة والأمان */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* استعراض التفاصيل */}
                          <button
                            type="button"
                            onClick={() => setViewComplaint(c)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                            title="عرض كافة التفاصيل والمرفقات"
                          >
                            <Eye className="w-4 h-4 text-[#00a3e0]" />
                          </button>

                          {/* كتابة تأشيرة وقرار */}
                          <button
                            type="button"
                            onClick={() => {
                              setStatusModalComplaint(c);
                              setModalNewStatus(c.status);
                              setModalNote(c.admin_notes || '');
                            }}
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[#133063] transition"
                            title="إصدار تأشيرة وقرار رسمي"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* تحويل للجنة أخرى (خاص بالأدمن العام) */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setTransferModalComplaint(c);
                                setTargetCommitteeId(c.committee_id === 'youth' ? 'citizen_affairs' : 'youth');
                              }}
                              className="p-1.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 transition"
                              title="إحالة وتحويل الشكوى للجنة ثانية"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}

                          {/* محادثة واتساب سريعة */}
                          <WhatsAppButton
                            complaint={c}
                            iconOnly={true}
                          />

                          {/* طباعة إشعار رسمي فردي */}
                          <Link
                            href={`/admin/print/${c.id}`}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                            title="طباعة قرار فردي معتمد"
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

      {/* مودال استعراض تفاصيل الشكوى الكاملة */}
      {viewComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#133063]">
                    تفاصيل الطلب: {viewComplaint.tracking_code}
                  </h3>
                  <StatusBadge status={viewComplaint.status} />
                </div>
                <span className="text-[11px] text-slate-400">
                  مسجل بتاريخ: {new Date(viewComplaint.created_at).toLocaleString('ar-EG')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewComplaint(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* بيانات المواطن */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-[#133063] block text-xs">بيانات المواطن:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div><b>الاسم:</b> {viewComplaint.citizen_name}</div>
                  <div><b>الرقم القومي:</b> <span className="font-mono">{viewComplaint.national_id}</span></div>
                  <div><b>رقم الهاتف:</b> <span className="font-mono" dir="ltr">{viewComplaint.primary_phone}</span></div>
                  <div><b>اللجنة المختصة:</b> {viewComplaint.committee_name || 'لجنة رعاية الشباب'}</div>
                  {viewComplaint.location_address && (
                    <div className="col-span-2"><b>العنوان / الموقع:</b> {viewComplaint.location_address}</div>
                  )}
                </div>
              </div>

              {/* نص الموضوع والتفاصيل */}
              <div className="space-y-1.5">
                <span className="font-extrabold text-[#133063] block">موضوع الطلب:</span>
                <p className="font-bold text-slate-900 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  {viewComplaint.title}
                </p>

                <span className="font-extrabold text-[#133063] block pt-2">شرح وتفاصيل الشكوى:</span>
                <p className="text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {viewComplaint.description}
                </p>
              </div>

              {/* التأشيرة والملاحظات الإدارية */}
              {viewComplaint.admin_notes && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900">
                  <span className="font-extrabold block text-xs mb-1">تأشيرة وقرار المشرف:</span>
                  <p className="leading-relaxed">{viewComplaint.admin_notes}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setViewComplaint(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
              >
                إغلاق
              </button>
              <Link
                href={`/admin/print/${viewComplaint.id}`}
                className="px-4 py-2.5 rounded-xl bg-[#133063] text-white text-xs font-bold"
              >
                طباعة إشعار رسمي
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* مودال اعتماد تأشيرة وقرار اللجنة */}
      {statusModalComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-[#133063]">
                  تأشيرة وقرار اللجنة
                </h3>
                <span className="text-[11px] text-slate-400">
                  كود الطلب: {statusModalComplaint.tracking_code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalComplaint(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تحديد حالة الطلب بعد الفحص:
                </label>
                <select
                  value={modalNewStatus}
                  onChange={(e) => setModalNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] bg-white"
                >
                  <option value="new">جديد</option>
                  <option value="under_review">قيد المراجعة والدراسة</option>
                  <option value="needs_info">يحتاج استكمال مستندات</option>
                  <option value="in_progress">جاري التنفيذ والتنسيق</option>
                  <option value="resolved">تم الحل بنجاح</option>
                  <option value="rejected">مرفوض / غير مطابق</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نص التأشيرة الرسمية أو ملاحظات التنفيذ:
                </label>
                <textarea
                  rows={4}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="اكتب التوجيه الصادر للجهات التنفيذية أو أسباب القرار..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatusModalComplaint(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalStatus}
                  disabled={isUpdatingStatus}
                  className="px-5 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold shadow-md shadow-[#133063]/20 active:scale-95 transition"
                >
                  {isUpdatingStatus ? 'جاري الاعتماد...' : 'اعتماد التأشيرة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال تحويل الشكوى للجنة أخرى (خاص بالأدمن العام) */}
      {transferModalComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#133063]">
                    إحالة وتحويل الشكوى
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    خاص بالأدمن العام (أمانة التنظيم واللجان)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalComplaint(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 block">اللجنة الحالية:</span>
                <span className="font-extrabold text-[#133063] text-sm">
                  {transferModalComplaint.committee_name || 'لجنة رعاية الشباب'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اختر اللجنة المحال إليها الشكوى:
                </label>
                <select
                  value={targetCommitteeId}
                  onChange={(e) => setTargetCommitteeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] bg-white"
                >
                  {committees.map((comm) => (
                    <option key={comm.id} value={comm.id}>
                      {comm.name} (رئيس اللجنة: {comm.headName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTransferModalComplaint(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleTransferCommittee}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 active:scale-95 transition"
                >
                  تأكيد الإحالة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">جاري تحميل لوحة التحكم...</div>}>
      <AdminComplaintsContent />
    </Suspense>
  );
}
