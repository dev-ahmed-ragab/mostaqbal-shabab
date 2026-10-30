'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Phone, 
  User, 
  Users, 
  FileText, 
  ChevronLeft, 
  ShieldCheck, 
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Layers,
  Check
} from 'lucide-react';
import { authService, AdminUser, CommitteeDef } from '@/lib/auth';
import { committeesService } from '@/lib/committeesService';
import { complaintsService } from '@/lib/complaintsService';
import { Complaint } from '@/types/database';

export default function AdminCommitteesPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [committees, setCommittees] = useState<CommitteeDef[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');

  // مودال إضافة لجنة جديدة
  const [showAddModal, setShowAddModal] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newHeadName, setNewHeadName] = useState('');
  const [newRapporteur, setNewRapporteur] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // مودال تعديل لجنة
  const [editingCommittee, setEditingCommittee] = useState<CommitteeDef | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // رسائل التنبيه والنجاح
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setCurrentUser(authService.getCurrentUser());
    setCommittees(committeesService.getAll());
    try {
      const allComplaints = await complaintsService.getAll();
      setComplaints(allComplaints);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadData();

    const unsubComm = committeesService.subscribe(() => {
      setCommittees(committeesService.getAll());
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

  // حساب عدد الشكاوى لكل لجنة
  const complaintsCountByCommittee = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of complaints) {
      const cid = c.committee_id || 'youth';
      counts[cid] = (counts[cid] || 0) + 1;
    }
    return counts;
  }, [complaints]);

  // تصفية اللجان
  const filteredCommittees = useMemo(() => {
    return committees.filter(c => {
      if (filterStatus === 'active' && c.status === 'archived') return false;
      if (filterStatus === 'archived' && c.status !== 'archived') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.headName.toLowerCase().includes(q) ||
          c.rapporteur.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [committees, filterStatus, searchQuery]);

  // حفظ إضافة لجنة جديدة
  const handleCreateCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newName.trim()) {
      setAddError('يرجى إدخال اسم اللجنة الرسمي.');
      return;
    }

    const generatedId = newId.trim() || `comm_${Date.now().toString().slice(-4)}`;

    const res = committeesService.create({
      id: generatedId,
      name: newName.trim(),
      headName: newHeadName.trim() || 'لم يُحدد رئيس بعد',
      rapporteur: newRapporteur.trim() || 'لم يُحدد مقرر بعد',
      description: newDescription.trim() || 'لجنة نوعية تابعة لأمانة حزب مستقبل وطن',
      phone: newPhone.trim() || '01000000000',
      status: 'active',
    });

    if (res.success) {
      showToast(`تمت إضافة "${newName}" إلى اللجان المركزية بنجاح`);
      setShowAddModal(false);
      setNewId('');
      setNewName('');
      setNewHeadName('');
      setNewRapporteur('');
      setNewPhone('');
      setNewDescription('');
    } else {
      setAddError(res.error || 'تعذر إضافة اللجنة.');
    }
  };

  // حفظ تعديل لجنة
  const handleUpdateCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommittee) return;
    setEditError(null);

    const res = committeesService.update(editingCommittee.id, {
      name: editingCommittee.name,
      headName: editingCommittee.headName,
      rapporteur: editingCommittee.rapporteur,
      description: editingCommittee.description,
      phone: editingCommittee.phone,
      status: editingCommittee.status,
    });

    if (res.success) {
      showToast(`تم تحديث بيانات "${editingCommittee.name}" بنجاح`);
      setEditingCommittee(null);
    } else {
      setEditError(res.error || 'تعذر تحديث اللجنة.');
    }
  };

  // حذف أو أرشفة لجنة
  const handleDeleteCommittee = (committee: CommitteeDef) => {
    if (!isAdmin) {
      alert('عذراً، حذف أو أرشفة اللجان مقتصر على المشرف العام (الأدمن).');
      return;
    }

    if (committee.id === 'youth' || committee.id === 'citizen_affairs') {
      alert('لا يمكن حذف اللجان الأساسية المعتمدة للمنظومة.');
      return;
    }

    const confirmDelete = window.confirm(`هل أنت متأكد من حذف "${committee.name}"؟`);
    if (!confirmDelete) return;

    const res = committeesService.delete(committee.id);
    if (res.success) {
      showToast(`تم حذف لجنة "${committee.name}" بنجاح`);
    } else {
      alert(res.error || 'تعذر حذف اللجنة.');
    }
  };

  // تبديل حالة اللجنة (نشطة / معلقة)
  const handleToggleStatus = (committee: CommitteeDef) => {
    if (!isAdmin) {
      alert('تعديل حالة اللجان مقتصر على الأدمن العام.');
      return;
    }

    const newStatus = committee.status === 'archived' ? 'active' : 'archived';
    committeesService.update(committee.id, { status: newStatus });
    showToast(`تم تغيير حالة "${committee.name}" إلى ${newStatus === 'active' ? 'نشطة' : 'معلقة'}`);
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

      {/* شريط العنوان الترحيبي والإحصاءات */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#133063]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#133063] border border-blue-200 text-[11px] font-extrabold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#00a3e0]" />
                منظومة اللجان المركزية والنوعية
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  صلاحيات الأدمن الكاملة
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#133063]">
              إدارة اللجان وتوزيع الاختصاصات
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              إضافة لجان جديدة لأمانة الحزب، وتعيين رؤساء اللجان والمقررين، ومتابعة تدفق الشكاوى والطلبات الموجهة لكل لجنة بشكل مستقل ومنفصل عن إدارة المستخدمين.
            </p>
          </div>

          {/* زر إضافة لجنة جديدة (خاص بالأدمن العام) */}
          <div className="shrink-0">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setAddError(null);
                  setShowAddModal(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-[#133063]/25 active:scale-95 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#00a3e0]" />
                <span>إضافة لجنة نوعية جديدة</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>إضافة اللجان مقتصرة على المشرف العام</span>
              </div>
            )}
          </div>
        </div>

        {/* كروت المؤشرات السريعة للجان */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block">إجمالي اللجان المسجلة</span>
            <span className="text-xl font-black text-[#133063] mt-0.5 block">{committees.length}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-700 block">اللجان النشطة والمفعلة</span>
            <span className="text-xl font-black text-emerald-800 mt-0.5 block">
              {committees.filter(c => c.status !== 'archived').length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-[11px] font-bold text-[#133063] block">إجمالي الشكاوى الموزعة</span>
            <span className="text-xl font-black text-[#133063] mt-0.5 block">{complaints.length}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200">
            <span className="text-[11px] font-bold text-purple-700 block">لجنة رعاية الشباب</span>
            <span className="text-xl font-black text-purple-800 mt-0.5 block">
              {complaintsCountByCommittee['youth'] || 0} طلب
            </span>
          </div>
        </div>

        {/* رسم بياني مقارن لحجم الشكاوى بين اللجان */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#133063] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#00a3e0]" />
              <span>الرسم البياني لتوزيع الشكاوى والمشاكل على اللجان:</span>
            </span>
            <Link
              href="/admin/reports"
              className="text-[#00a3e0] hover:underline font-bold flex items-center gap-1"
            >
              <span>لوحة التحليلات الموسعة</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {committees.map((c, i) => {
              const cCount = complaintsCountByCommittee[c.id] || 0;
              const totalAll = complaints.length;
              const pct = totalAll > 0 ? Math.round((cCount / totalAll) * 100) : 0;
              const colors = ['bg-[#133063]', 'bg-[#00a3e0]', 'bg-purple-600', 'bg-indigo-600', 'bg-emerald-600'];
              const clr = colors[i % colors.length];

              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-slate-700">{c.name}</span>
                    <span className="font-mono font-bold text-slate-600">
                      {cCount} طلب ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${clr}`}
                      style={{ width: `${Math.max(pct, cCount > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم اللجنة، رئيس اللجنة، المقرر، أو الاختصاص..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              filterStatus === 'all'
                ? 'bg-[#133063] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            كافة اللجان ({committees.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              filterStatus === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            النشطة فقط
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('archived')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              filterStatus === 'archived'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المعلقة / المؤرشفة
          </button>
        </div>
      </div>

      {/* شبكة بطاقات اللجان */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCommittees.map((committee) => {
          const complaintCount = complaintsCountByCommittee[committee.id] || 0;
          const isCore = committee.id === 'youth' || committee.id === 'citizen_affairs';

          return (
            <div
              key={committee.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group"
            >
              {/* شريط الحالة بالأعلى */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#133063] flex items-center justify-center border border-blue-200/80 shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6 text-[#00a3e0]" />
                </div>

                <div className="flex items-center gap-1.5">
                  {committee.status === 'archived' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                      معلقة
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      نشطة
                    </span>
                  )}

                  {isCore && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold">
                      لجنة أساسية
                    </span>
                  )}
                </div>
              </div>

              {/* تفاصيل اللجنة */}
              <div className="space-y-3 mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#133063] leading-snug">
                    {committee.name}
                  </h3>
                  <code className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    ID: {committee.id}
                  </code>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {committee.description}
                </p>

                {/* قيادات اللجنة */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#00a3e0]" />
                      رئيس اللجنة:
                    </span>
                    <span className="font-extrabold text-[#133063]">{committee.headName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      المقرر التنفيذي:
                    </span>
                    <span className="font-bold text-slate-700">{committee.rapporteur}</span>
                  </div>

                  {committee.phone && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        هاتف التواصل:
                      </span>
                      <span className="font-mono text-xs text-slate-600" dir="ltr">{committee.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* أسفل البطاقة: مؤشر الشكاوى والأزرار */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">الطلبات المسجلة:</span>
                  <Link
                    href={`/admin?committee=${committee.id}`}
                    className="font-extrabold text-[#133063] hover:text-[#00a3e0] flex items-center gap-1 transition"
                  >
                    <span>{complaintCount} طلب</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCommittee(committee)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>تعديل</span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(committee)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                          committee.status === 'archived'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        }`}
                        title={committee.status === 'archived' ? 'تفعيل اللجنة' : 'تعطيل وأرشفة اللجنة'}
                      >
                        {committee.status === 'archived' ? 'تفعيل' : 'تعطيل'}
                      </button>

                      {!isCore && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCommittee(committee)}
                          className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white transition"
                          title="حذف اللجنة نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* مودال إضافة لجنة نوعية جديدة */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#133063] flex items-center justify-center border border-blue-200">
                  <Plus className="w-5 h-5 text-[#00a3e0]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#133063]">إضافة لجنة جديدة</h3>
                  <span className="text-[11px] text-slate-400">اعتماد لجنة نوعية بأمانة حزب مستقبل وطن</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCommittee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم اللجنة الرسمي *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newId) {
                      // توليد id تقريبي
                      setNewId(e.target.value.toLowerCase().replace(/[\s\u0600-\u06FF]+/g, '_').slice(0, 15) || '');
                    }
                  }}
                  placeholder="مثال: لجنة الإسكان والمرافق العامة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المعرف البرمجي (Code / ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="housing"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    هاتف التواصل / المنسق
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم رئيس اللجنة
                  </label>
                  <input
                    type="text"
                    value={newHeadName}
                    onChange={(e) => setNewHeadName(e.target.value)}
                    placeholder="مثال: م. أحمد عبد العزيز"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المقرر التنفيذي
                  </label>
                  <input
                    type="text"
                    value={newRapporteur}
                    onChange={(e) => setNewRapporteur(e.target.value)}
                    placeholder="مثال: أ. محمود حسني"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نطاق واختصاصات اللجنة (الوصف) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="المسؤولة عن ملفات ومشاكل المرافق وتطوير البنية التحتية ومطالب المواطنين المتعلقة بالإسكان..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold shadow-md shadow-[#133063]/20 active:scale-95 transition"
                >
                  حفظ واعتماد اللجنة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تعديل بيانات لجنة */}
      {editingCommittee && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-[#133063]">
                  تعديل بيانات: {editingCommittee.name}
                </h3>
                <span className="text-[11px] text-slate-400">تحديث المسؤولين والاختصاصات</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingCommittee(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCommittee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم اللجنة</label>
                <input
                  type="text"
                  required
                  value={editingCommittee.name}
                  onChange={(e) => setEditingCommittee({ ...editingCommittee, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رئيس اللجنة</label>
                  <input
                    type="text"
                    required
                    value={editingCommittee.headName}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, headName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المقرر التنفيذي</label>
                  <input
                    type="text"
                    required
                    value={editingCommittee.rapporteur}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, rapporteur: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">هاتف التواصل</label>
                  <input
                    type="tel"
                    value={editingCommittee.phone || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة اللجنة</label>
                  <select
                    value={editingCommittee.status || 'active'}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] bg-white"
                  >
                    <option value="active">نشطة ومفعلة</option>
                    <option value="archived">معلقة / مؤرشفة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاختصاصات والوصف</label>
                <textarea
                  rows={3}
                  required
                  value={editingCommittee.description}
                  onChange={(e) => setEditingCommittee({ ...editingCommittee, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCommittee(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs font-bold shadow-md shadow-[#133063]/20 active:scale-95 transition"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
