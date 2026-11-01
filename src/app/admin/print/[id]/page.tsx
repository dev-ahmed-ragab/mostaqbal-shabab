'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { Printer, Download, ChevronRight, Check } from 'lucide-react';
import { Complaint, STATUS_META } from '@/types/database';
import { complaintsService } from '@/lib/complaintsService';
import { generatePdfFromElement } from '@/lib/generatePdf';
import { LOGO_BASE64 } from '@/lib/logoBase64';

function PrintComplaintContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [printDate, setPrintDate] = useState('');
  const printDocRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    setPrintDate(new Date().toLocaleDateString('ar-EG'));
    if (!id) return;
    const fetchComplaint = async () => {
      setLoading(true);
      try {
        const item = await complaintsService.getById(id);
        setComplaint(item);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaint();
  }, [id]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/admin/complaints');
    }
  };

  const handleDownloadPdf = async () => {
    if (!printDocRef.current || !complaint) return;
    setIsGeneratingPdf(true);
    try {
      await generatePdfFromElement(printDocRef.current, {
        filename: `استمارة_شكوى_${complaint.tracking_code}.pdf`,
        orientation: 'portrait',
        fitToSinglePage: true,
      });
      showToast('تم تنزيل ملف الـ PDF بنجاح');
    } catch (err) {
      console.error(err);
      showToast('تعذر تنزيل الـ PDF مباشرة، جاري فتح نافذة الطباعة كبديل...');
      setTimeout(() => {
        window.print();
      }, 500);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-slate-500 font-bold text-sm gap-3">
        <div className="w-8 h-8 border-3 border-[#133063] border-t-transparent rounded-full animate-spin" />
        <span>جاري تجهيز استمارة الشكوى للطباعة...</span>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center gap-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          لم يتم العثور على الشكوى المطلوبة (الكود: {id}).
        </div>
        <Link
          href="/admin/complaints"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#133063] text-white text-xs font-bold hover:bg-[#0d234a] transition"
        >
          <ChevronRight className="w-4 h-4" />
          العودة لإدارة الشكاوى
        </Link>
      </div>
    );
  }

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track?code=${complaint.tracking_code}`
    : `https://mostaqbal-shabab.vercel.app/track?code=${complaint.tracking_code}`;

  const statusInfo = STATUS_META[complaint.status] || STATUS_META.new;

  return (
    <div className="bg-slate-100 min-h-screen py-5 px-3 sm:px-6 flex flex-col items-center">
      {/* ستايل الطباعة الإجباري لصفحة A4 واحدة بدقة عالية وبدون أي صفحة ثانية */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 6mm 6mm !important;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, aside {
            display: none !important;
          }
          #official-print-document {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      {/* توست إشعار */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#133063] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#00a3e0]/40 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200 no-print">
          <Check className="w-4 h-4 text-[#00a3e0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* شريط الإجراءات والعودة العلوي (لا يظهر أثناء الطباعة) */}
      <div className="w-full max-w-[210mm] mb-4 flex flex-wrap items-center justify-between gap-3 no-print bg-white p-3 sm:p-3.5 rounded-2xl shadow-sm border border-slate-200">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-[#00a3e0]" />
          <span>العودة لإدارة الشكاوى</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'جاري التوليد...' : 'تنزيل PDF معتمد'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#133063] hover:bg-[#0d234a] text-white transition shadow-md shadow-[#133063]/20 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#00a3e0]" />
            <span>طباعة المستند (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* مستند الطباعة الرسمي A4 المجهز لصفحة واحدة بالضبط */}
      <div
        ref={printDocRef}
        id="official-print-document"
        className="w-full max-w-[210mm] bg-white text-black p-5 sm:p-6 shadow-xl border border-slate-300 rounded-none relative overflow-hidden text-right box-border"
        style={{ direction: 'rtl' }}
      >
        {/* الترويسة الرسمية للحزب والأمانة */}
        <div className="flex items-start justify-between border-b-2 border-[#133063] pb-2.5 mb-2.5">
          <div className="space-y-0.5 text-right">
            <h3 className="text-[10px] font-bold text-slate-700">جمهورية مصر العربية</h3>
            <span className="text-[11px] font-bold text-[#00a3e0] block">
              حزب مستقبل وطن • أمانة مركز بركة السبع
            </span>
            <h1 className="text-base font-extrabold text-[#133063]">
              {complaint.committee_name || 'أمانة رعاية الشباب'}
            </h1>
            <p className="text-[9.5px] font-semibold text-slate-600">مكتب خدمة المواطنين والشكاوى</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-13 h-13 mb-0.5 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_BASE64}
                alt="شعار حزب مستقبل وطن"
                className="w-13 h-13 object-contain"
              />
            </div>
            <span className="text-[8.5px] font-bold text-[#133063]">استمارة فحص شكوى معتمدة</span>
          </div>

          <div className="flex flex-col items-end">
            <QRCodeCanvas
              value={trackingUrl}
              size={58}
              level="M"
              fgColor="#000000"
            />
            <span className="text-[8.5px] font-mono mt-0.5 text-slate-600 font-bold">
              {complaint.tracking_code}
            </span>
          </div>
        </div>

        {/* شريط معلومات القيد الرسمي */}
        <div className="grid grid-cols-3 gap-2 border border-black p-1.5 bg-slate-50 text-[10px] font-semibold mb-2.5">
          <div>
            <span className="text-slate-600 block text-[8.5px]">كود الشكوى:</span>
            <span className="font-mono text-xs font-extrabold text-[#133063]">{complaint.tracking_code}</span>
          </div>
          <div>
            <span className="text-slate-600 block text-[8.5px]">تاريخ وتوقيت الورود:</span>
            <span>{new Date(complaint.created_at).toLocaleString('ar-EG')}</span>
          </div>
          <div>
            <span className="text-slate-600 block text-[8.5px]">حالة الشكوى:</span>
            <span className="font-bold underline">{statusInfo.label}</span>
          </div>
        </div>

        {/* جدول بيانات المواطن */}
        <div className="mb-2.5">
          <h4 className="text-[10px] font-extrabold bg-slate-200 border-x border-t border-black px-2 py-0.5">
            أولاً: بيانات مقدم الشكوى / المواطن
          </h4>
          <table className="w-full border border-black text-[10px]">
            <tbody>
              <tr className="border-b border-black">
                <td className="p-1 font-bold w-1/4 bg-slate-50 border-l border-black">
                  اسم المواطن:
                </td>
                <td className="p-1 w-3/4 font-semibold">{complaint.citizen_name}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-1 font-bold bg-slate-50 border-l border-black">
                  الرقم القومي:
                </td>
                <td className="p-1 font-mono" dir="ltr">
                  {complaint.national_id}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-1 font-bold bg-slate-50 border-l border-black">
                  رقم الهاتف الأساسي:
                </td>
                <td className="p-1 font-mono" dir="ltr">
                  {complaint.primary_phone}
                </td>
              </tr>
              {complaint.alt_contacts && complaint.alt_contacts.length > 0 && (
                <tr className="border-b border-black">
                  <td className="p-1 font-bold bg-slate-50 border-l border-black">
                    وسائل تواصل إضافية:
                  </td>
                  <td className="p-1 font-mono" dir="ltr">
                    {complaint.alt_contacts.map((c) => `${c.type}: ${c.value}`).join(' | ')}
                  </td>
                </tr>
              )}
              {complaint.location_address && (
                <tr>
                  <td className="p-1 font-bold bg-slate-50 border-l border-black">
                    الموقع / العنوان:
                  </td>
                  <td className="p-1">{complaint.location_address}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* موضوع ومحتوى الشكوى */}
        <div className="mb-2.5">
          <h4 className="text-[10px] font-extrabold bg-slate-200 border-x border-t border-black px-2 py-0.5">
            ثانياً: موضوع وتفاصيل الشكوى
          </h4>
          <div className="border border-black p-2 space-y-1 text-[10px] leading-relaxed">
            <div>
              <span className="font-bold text-slate-800 block text-[9px]">
                الموضوع:
              </span>
              <p className="font-bold text-xs text-[#133063]">{complaint.title}</p>
            </div>
            <div>
              <span className="font-bold text-slate-800 block text-[9px]">
                شرح وتفاصيل الشكوى:
              </span>
              <p className="text-justify whitespace-pre-wrap text-[10px] line-clamp-6">{complaint.description}</p>
            </div>

            {complaint.attachments && complaint.attachments.length > 0 && (
              <div className="pt-0.5 border-t border-slate-300 text-[9px]">
                <span className="font-bold">المرفقات المسجلة: </span>
                <span>{complaint.attachments.length} ملفات محفوظة إلكترونياً بالمنظومة.</span>
              </div>
            )}
          </div>
        </div>

        {/* تأشيرة وقرار الأمانة المختصة */}
        <div className="mb-3">
          <h4 className="text-[10px] font-extrabold bg-slate-200 border-x border-t border-black px-2 py-0.5">
            ثالثاً: دراسة الموقف وقرار وتأشيرة الأمانة
          </h4>
          <div className="border border-black p-2 min-h-[55px] text-[10px] space-y-1 relative">
            <span className="font-bold text-slate-800 block text-[9px]">إفادة وتأشيرة الأمانة:</span>
            <p className="text-slate-800 italic text-[10px]">
              {complaint.admin_notes ||
                'جاري الفحص الميداني والمتابعة مع الأجهزة التنفيذية والمجلس المحلي المختص.'}
            </p>

            <div className="pt-1.5 flex items-center justify-between text-[9px] text-slate-600">
              <span>[ ] تمت المعاينة</span>
              <span>[ ] إحالة للجهة التنفيذية</span>
              <span>[ ] تم استيفاء المطلوب</span>
              <span>[ ] حفظ لعدم الاختصاص</span>
            </div>
          </div>
        </div>

        {/* خانات الاعتماد والتوقيعات والأختام الرسمية */}
        <div className="grid grid-cols-3 gap-3 text-center text-[10px] font-bold pt-2 border-t-2 border-black">
          <div className="space-y-4">
            <span>أمين مساعد تنفيذي</span>
            <span className="block text-[9px] text-slate-500 font-normal">
              ( م. محمود الجزار )
            </span>
          </div>

          <div className="space-y-1">
            <span>خاتم الاعتماد الرسمي</span>
            <div className="w-12 h-12 mx-auto rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[7.5px] text-slate-400">
              خاتم الأمانة
            </div>
          </div>

          <div className="space-y-4">
            <span>أمين الشباب ببركة السبع</span>
            <span className="block text-[9px] text-slate-500 font-normal">
              ( أ. سامر التلاوي )
            </span>
          </div>
        </div>

        {/* تذييل المستند */}
        <div className="mt-2.5 pt-1.5 border-t border-slate-300 flex items-center justify-between text-[7.5px] text-slate-500">
          <span>مستند رسمي صادر عن حزب مستقبل وطن - منظومة خدمة المواطنين</span>
          <span>تاريخ الطباعة: {printDate || '2026/10/30'}</span>
        </div>
      </div>
    </div>
  );
}

export default function PrintComplaintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 text-center text-sm font-bold text-slate-500">
          جاري تجهيز استمارة الطباعة...
        </div>
      }
    >
      <PrintComplaintContent />
    </Suspense>
  );
}
