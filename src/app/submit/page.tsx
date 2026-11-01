'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { 
  FilePlus, 
  MapPin, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Award,
  Video,
  ShieldCheck
} from 'lucide-react';
import { AltContact, Attachment, Complaint } from '@/types/database';
import { uploadAttachment } from '@/lib/supabaseStorage';
import { complaintsService } from '@/lib/complaintsService';
import { YOUTH_SECRETARIAT } from '@/lib/auth';
import { ComplaintReceipt } from '@/components/ComplaintReceipt';

export default function SubmitComplaintPage() {
  const [isConfidential, setIsConfidential] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // بيانات المواطن الأساسية
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  
  // موضوع وتفاصيل الطلب
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('طلب عام / توجيه لأمانة رعاية الشباب');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'emergency'>('normal');

  // وسائل تواصل إضافية
  const [showAltContact, setShowAltContact] = useState(false);
  const [altPhone, setAltPhone] = useState('');

  // الموقع الجغرافي
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  // المرفقات
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // حالة الإرسال
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  // تحديد الموقع الجغرافي بنقرة واحدة
  const handleToggleLocation = () => {
    if (locationEnabled) {
      setLocationEnabled(false);
      setLocationCoords(null);
      setLocationAddress('');
      return;
    }

    if (!navigator.geolocation) {
      alert('متصفحك لا يدعم تحديد الموقع الجغرافي.');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationCoords({ lat, lng });
        setLocationAddress(`الموقع الجغرافي للمعاينة: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setLocationEnabled(true);
        setLocationLoading(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        alert('تعذر تحديد الموقع تلقائياً، يمكنك كتابة العنوان يدوياً.');
        setLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // رفع الصور والفيديوهات بضغط ذكي
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const newAttachments: Attachment[] = [];
    const allowedImages = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ];
    const allowedVideos = ['video/mp4', 'video/quicktime', 'video/webm'];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = allowedVideos.includes(file.type);
        const isImage = allowedImages.includes(file.type);

        if (isVideo) {
          if (file.size > 25 * 1024 * 1024) {
            alert(`حجم الفيديو "${file.name}" أكبر من 25 ميجابايت.`);
            continue;
          }
        } else if (isImage) {
          if (file.size > 5 * 1024 * 1024) {
            alert(`حجم الصورة "${file.name}" أكبر من 5 ميجابايت.`);
            continue;
          }
        } else {
          alert(`الملف "${file.name}" غير مدعوم.`);
          continue;
        }

        try {
          const att = await uploadAttachment(file);
          newAttachments.push(att);
        } catch (err) {
          alert(
            err instanceof Error
              ? err.message
              : `تعذّر رفع الملف "${file.name}".`
          );
        }
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // إرسال الطلب واعتماده
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!privacyAgreed) {
      setErrorMessage('يجب الموافقة على سياسة الخصوصية قبل إرسال الطلب.');
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMessage('يرجى إدخال اسمك الكريم بشكل صحيح.');
      return;
    }

    if (fullName.trim().length > 150) {
      setErrorMessage('الاسم أطول من الحد المسموح (150 حرفاً).');
      return;
    }

    const cleanPhone = primaryPhone.trim();
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      setErrorMessage('يرجى كتابة رقم موبايل مصري صحيح (11 رقماً يبدأ بـ 01).');
      return;
    }

    const cleanNatId = nationalId.trim();
    if (cleanNatId && !/^\d{14}$/.test(cleanNatId)) {
      setErrorMessage('إذا قمت بكتابة الرقم القومي، فيجب أن يتكون من 14 رقماً، أو يمكنك تركه فارغاً.');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('يرجى كتابة تفاصيل وموضوع طلبك أو مشكلتك بوضوح.');
      return;
    }

    if (description.trim().length > 10000) {
      setErrorMessage('تفاصيل الطلب أطول من الحد المسموح (10000 حرف).');
      return;
    }

    setIsSubmitting(true);

    try {
      // إذا ترك المواطن العنوان فارغاً، يتم اشتقاق عنوان معبّر تلقائياً من أول كلمات الشرح
      let finalTitle = title.trim();
      if (!finalTitle) {
        const words = description.trim().split(/\s+/);
        finalTitle = words.slice(0, 8).join(' ');
        if (words.length > 8) finalTitle += '...';
      }

      if (priority !== 'normal') {
        finalTitle = `[${priority === 'emergency' ? '🚨 طارئ' : '⚡ عاجل'}] [${category}] ${finalTitle}`;
      } else {
        finalTitle = `[${category}] ${finalTitle}`;
      }

      // الحد المطابق للتحقق الخادمي في submit_complaint.
      finalTitle = finalTitle.slice(0, 300);

      const fullDesc = description.trim();

      const altList: AltContact[] = [];
      if (altPhone.trim()) {
        altList.push({ type: 'phone', value: altPhone.trim() });
      }

      const activeComm = YOUTH_SECRETARIAT;

      // الربط بالحساب يتم على الخادم داخل submit_complaint،
      // لذلك لا نرسل citizen_id من العميل.
      const created = await complaintsService.create({
        citizen_name: fullName.trim(),
        national_id: cleanNatId,
        primary_phone: cleanPhone,
        alt_contacts: altList,
        title: finalTitle,
        description: fullDesc,
        status: 'new',
        committee_id: activeComm.id,
        committee_name: activeComm.name,
        is_confidential: isConfidential,
        location_lat: locationCoords?.lat || null,
        location_lng: locationCoords?.lng || null,
        location_address: locationAddress.trim() || null,
        attachments,
      });

      // إطلاق احتفال Confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#133063', '#00a3e0', '#ce1126']
        });
      } catch {
        // continue
      }

      // حفظ الكود على جهاز المواطن لسهولة العودة
      try {
        localStorage.setItem('last_submitted_complaint_code', created.tracking_code);
      } catch {
        // continue
      }

      setSubmittedComplaint(created);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء حفظ الشكوى، يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // شاشة نجاح تقديم الشكوى وعرض الإيصال الرسمي
  if (submittedComplaint) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex-1">
        <div className="text-center mb-6 no-print">
          <div className="w-16 h-16 mx-auto mb-3 bg-blue-50 text-[#133063] rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#00a3e0]" />
          </div>
          <span className="text-xs font-bold text-[#00a3e0] tracking-wider block">
            حزب مستقبل وطن • كلنا نعمل من أجل مصر
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#133063] mt-1">
            تم تسجيل طلبك بنجاح
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
            وصل طلبك إلى أمانة الشباب بمركز بركة السبع لبدء الفحص والمتابعة الميدانية الفورية.
          </p>
        </div>

        {/* كارت الإيصال الرسمي مع الطباعة والـ PDF في صفحة واحدة */}
        <ComplaintReceipt complaint={submittedComplaint} />

        <div className="mt-8 text-center no-print">
          <Link
            href="/"
            className="text-xs sm:text-sm font-bold text-[#133063] hover:text-[#00a3e0] underline"
          >
            العودة للصفحة الرئيسية للمنظومة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex-1 w-full">
      {/* الترويسة المبسطة */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#133063] transition mb-3"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          العودة للرئيسية
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[#00a3e0]">حزب مستقبل وطن</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-bold text-slate-500">أمانة الشباب بمركز بركة السبع</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#133063] mb-1.5">
          تقديم شكوى أو طلب جديد
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          التقديم متاح لكافة المواطنين والشباب مجاناً كزائر بدون اشتراط تسجيل مسبق، وتتم المتابعة إلكترونياً.
        </p>
      </div>

      {/* رسالة الخطأ إن وُجدت */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* استمارة التقديم المبسطة */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* الخطوة 1: بيانات المواطن الأساسية */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-[#133063] text-white flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h2 className="text-base font-extrabold text-slate-900">
              بيانات مقدم الطلب
            </h2>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الاسم بالكامل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="اكتب اسمك الثلاثي أو الرباعي..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] text-sm font-medium transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الهاتف المحمول <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="01xxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] text-sm font-mono transition"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الرقم القومي (14 رقم) <span className="text-slate-400 font-normal">(اختياري - لتسريع المتابعة إن وُجد)</span>
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                  placeholder="14 رقماً (اختياري)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] text-sm font-mono transition"
                  dir="ltr"
                />
              </div>
            </div>

            {/* خيار إضافة هاتف بديل */}
            {!showAltContact ? (
              <button
                type="button"
                onClick={() => setShowAltContact(true)}
                className="text-xs font-bold text-[#00a3e0] hover:text-[#133063] transition flex items-center gap-1 pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة رقم هاتف آخر للتواصل (اختياري)
              </button>
            ) : (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="tel"
                  maxLength={11}
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="رقم هاتف إضافي (اختياري)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowAltContact(false);
                    setAltPhone('');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600"
                  title="إلغاء"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* الخطوة 2: موضوع الطلب والتفاصيل */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-[#133063] text-white flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h2 className="text-base font-extrabold text-slate-900">
              تفاصيل وموضوع الطلب أو الشكوى
            </h2>
          </div>

          <div className="space-y-3.5">
            {/* جهة توجيه الطلب: أمانة الشباب (أمانة واحدة) */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80">
              <span className="block text-xs font-bold text-[#133063] mb-1.5">
                جهة استقبال الطلب:
              </span>
              <div className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-xs font-extrabold bg-white text-[#133063]">
                {YOUTH_SECRETARIAT.name} — {YOUTH_SECRETARIAT.headName}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                <b>اختصاص الأمانة:</b> {YOUTH_SECRETARIAT.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع وتصنيف الطلب:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 cursor-pointer"
                >
                  <option value="طلب عام / توجيه لأمانة رعاية الشباب">طلب عام / توجيه لأمانة رعاية الشباب (الافتراضي)</option>
                  <option value="أنشطة وملاعب رياضية">أنشطة وملاعب رياضية</option>
                  <option value="توظيف وتأهيل لسوق العمل">توظيف وتأهيل لسوق العمل</option>
                  <option value="دورات تدريبية وتثقيفية">دورات تدريبية وتثقيفية</option>
                  <option value="دعم مبادرات وأفكار شبابية">دعم مبادرات وأفكار شبابية</option>
                  <option value="صيانة وتجهيز مراكز الشباب">صيانة وتجهيز مراكز الشباب</option>
                  <option value="استغاثة أو حالة طارئة">استغاثة أو حالة طارئة</option>
                  <option value="مقترح عام لأمانة رعاية الشباب">مقترح عام لأمانة رعاية الشباب</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  درجة الأهمية:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                      priority === 'normal'
                        ? 'bg-blue-50 border-[#133063] text-[#133063]'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    عادي
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                      priority === 'urgent'
                        ? 'bg-amber-50 border-amber-400 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    عاجل
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('emergency')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                      priority === 'emergency'
                        ? 'bg-rose-50 border-rose-400 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    طارئ جداً
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                موضوع وتفاصيل طلبك أو شكواك بالتفصيل <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح المشكلة أو الطلب والمكان وما ترجوه من أمانة الشباب بوضوح..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] text-sm font-medium transition leading-relaxed resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان مختصر للطلب <span className="text-slate-400 font-normal">(اختياري - سيُستخرج تلقائياً من الشرح إن ترك فارغاً)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: صيانة إنارة الملعب الخماسي أو طلب دعم ملتقى توظيف"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30 focus:border-[#00a3e0] text-sm font-medium transition"
              />
            </div>
          </div>
        </div>

        {/* الخطوة 3: الموقع والمرفقات (اختياري) */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-[#133063] text-white flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h2 className="text-base font-extrabold text-slate-900">
              الموقع والمرفقات (اختياري)
            </h2>
          </div>

          <div className="space-y-4">
            {/* الموقع الجغرافي */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  📍 تحديد المكان على الخريطة
                </span>
                <span className="text-[11px] text-slate-500">
                  {locationCoords
                    ? `تم التقاط الموقع: ${locationCoords.lat.toFixed(4)}, ${locationCoords.lng.toFixed(4)}`
                    : 'يساعد أمانة الشباب على سرعة الانتقال والمعاينة الميدانية'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleLocation}
                disabled={locationLoading}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  locationEnabled
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    : 'bg-[#133063] text-white hover:bg-[#0d234a]'
                }`}
              >
                {locationLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-[#00a3e0]" />
                )}
                {locationEnabled ? 'إلغاء الموقع' : 'تحديد موقعي الآن GPS'}
              </button>
            </div>

            {/* رفع صور أو فيديو */}
            <div>
              <label className="border-2 border-dashed border-slate-300 hover:border-[#00a3e0] rounded-2xl p-5 text-center cursor-pointer block transition bg-slate-50/50 hover:bg-blue-50/20">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFiles}
                />
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="w-6 h-6 text-[#133063]" />
                  <span className="text-xs font-bold text-slate-800">
                    {uploadingFiles ? 'جاري فحص وضغط الملفات...' : 'اضغط لإرفاق صور للمكان أو المشكلة'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    نقبل الصور والفيديوهات بحد أقصى 25 ميجابايت
                  </span>
                </div>
              </label>

              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="relative border border-slate-200 rounded-xl overflow-hidden aspect-video bg-slate-100 flex items-center justify-center"
                    >
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-6 h-6 text-[#133063]" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="absolute top-1 left-1 p-1 bg-rose-600 text-white rounded-md"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* تنويه اختياري للراغبين في التطوع */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00a3e0]" />
            <span>ترغب في التطوع أو الانضمام لفريق عمل أمانة الشباب؟</span>
          </div>
          <Link
            href="/committee"
            className="text-[#133063] font-bold hover:text-[#00a3e0] underline shrink-0"
          >
            تعرف على هيئة المكتب وقنوات الانضمام
          </Link>
        </div>

        {/* خيارات الخصوصية والأمان */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#133063]">
            <ShieldCheck className="w-4 h-4 text-[#00a3e0]" />
            <span>خيارات الخصوصية والأمان وحماية البيانات</span>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
            <input
              type="checkbox"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#133063] focus:ring-[#00a3e0]"
            />
            <div>
              <span className="font-extrabold text-slate-900 block">
                🔒 اعتبار هذا الطلب سرياً وخاصاً بأمين الشباب والمشرف العام فقط
              </span>
              <span className="text-[11px] text-slate-500">
                لن يتم إظهار تفاصيل أو مستندات هذا الطلب لأي عضو عادي، وسيقتصر الفحص على القيادة التنفيذية.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none pt-2 border-t border-slate-100">
            <input
              type="checkbox"
              required
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#133063] focus:ring-[#00a3e0]"
            />
            <span className="text-[11px] font-bold text-slate-600">
              أتعهد بصحة البيانات المدخلة، وأوافق على معالجة الطلب بسرية تامة طبقاً للائحة خدمة المواطنين وحماية البيانات الشخصية بحزب مستقبل وطن.
            </span>
          </label>
        </div>

        {/* زر الإرسال الرئيسي */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || uploadingFiles || !privacyAgreed}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-base font-extrabold bg-[#133063] hover:bg-[#0d234a] text-white shadow-xl shadow-[#133063]/20 active:scale-[0.99] transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#00a3e0]" />
                جاري إرسال الطلب وحفظ البيانات...
              </>
            ) : (
              <>
                <FilePlus className="w-5 h-5 text-[#00a3e0]" />
                إرسال الطلب الآن واعتماد الشكوى
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            بمجرد الإرسال ستحصل على كود تتبع رسمي وإيصال PDF فوري لمتابعة طلبك.
          </p>
        </div>
      </form>
    </div>
  );
}
