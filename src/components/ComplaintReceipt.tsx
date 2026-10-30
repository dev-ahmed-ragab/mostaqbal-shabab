'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Copy, Check, ShieldCheck } from 'lucide-react';
import { Complaint, STATUS_META } from '@/types/database';
import { generatePdfFromElement } from '@/lib/generatePdf';

interface ComplaintReceiptProps {
  complaint: Complaint;
  onClose?: () => void;
}

export const ComplaintReceipt: React.FC<ComplaintReceiptProps> = ({
  complaint,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printDate = React.useMemo(() => {
    return new Date().toLocaleDateString('ar-EG');
  }, []);

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track?code=${complaint.tracking_code}`
    : `https://mostaqbal-shabab.vercel.app/track?code=${complaint.tracking_code}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(complaint.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await generatePdfFromElement(receiptRef.current, {
        filename: `إيصال_شكوى_${complaint.tracking_code}.pdf`,
        orientation: 'portrait',
      });
    } catch (err) {
      console.error('فشل إنشاء الـ PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const statusInfo = STATUS_META[complaint.status] || STATUS_META.new;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* بطاقة الإيصال المصممة للطباعة والـ PDF */}
      <div
        ref={receiptRef}
        id="complaint-receipt-card"
        className="bg-white border-2 border-[#133063]/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        {/* شريط زينة علوي بهوية مستقبل وطن */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-[#133063] to-[#00a3e0]" />

        {/* الترويسة الرسمية */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 shrink-0">
              <Image
                src="/logo.svg"
                alt="شعار حزب مستقبل وطن"
                width={56}
                height={56}
                className="w-full h-full object-contain"
                priority
                unoptimized
              />
            </div>
            <div>
              <span className="text-xs font-bold text-[#00a3e0] block">حزب مستقبل وطن</span>
              <h2 className="text-lg font-extrabold text-[#133063] leading-tight">
                لجنة رعاية الشباب
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                منظومة خدمة المواطنين وتلقي الشكاوى
              </p>
            </div>
          </div>

          <div className="text-left">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#133063] rounded-lg border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00a3e0]" />
              إيصال رسمي معتمد
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {new Date(complaint.created_at).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* باركود QR وكود الشكوى البارز */}
        <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-100 rounded-xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 text-center sm:text-right">
            <p className="text-xs font-bold text-[#133063] uppercase tracking-wider">
              كود تتبع الشكوى الرسمي
            </p>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#133063] tracking-wider font-mono">
                {complaint.tracking_code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-md hover:bg-blue-200/50 text-[#133063] transition"
                title="نسخ كود الشكوى"
              >
                {copied ? <Check className="w-4 h-4 text-[#00a3e0]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              احفظ هذا الكود للاستعلام الهاتفي أو الإلكتروني السريع
            </p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
            <QRCodeSVG
              value={trackingUrl}
              size={96}
              level="M"
              includeMargin={false}
              fgColor="#133063"
            />
            <span className="text-[10px] text-slate-500 mt-1 font-medium">
              امسح للـمـتـابـعـة
            </span>
          </div>
        </div>

        {/* جدول بيانات المواطن والشكوى */}
        <div className="space-y-4 mb-6 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-xs text-slate-500 block">اسم المواطن:</span>
              <span className="font-semibold text-slate-800">{complaint.citizen_name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">رقم الهاتف الأساسي:</span>
              <span className="font-semibold text-slate-800 font-mono" dir="ltr">
                {complaint.primary_phone}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">الرقم القومي:</span>
              <span className="font-semibold text-slate-800 font-mono" dir="ltr">
                {complaint.national_id.slice(0, 4)}******{complaint.national_id.slice(-4)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">حالة الشكوى الحالية:</span>
              <span className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-md ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-white">
            <span className="text-xs text-slate-500 block mb-1">موضوع الطلب / الشكوى:</span>
            <h4 className="font-bold text-slate-900 mb-1.5">{complaint.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {complaint.location_address && (
            <div className="text-xs text-slate-600 flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-lg">
              <span>📍 الموقع الجغرافي:</span>
              <span className="font-medium text-slate-800">{complaint.location_address}</span>
            </div>
          )}
        </div>

        {/* تذييل الإيصال */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>صادر إلكترونياً عن منظومة خدمة المواطنين - حزب مستقبل وطن</span>
          <span>تاريخ الطباعة: {printDate}</span>
        </div>
      </div>

      {/* أزرار الإجراءات الفورية للمواطن (بدون زر واتساب كما طلب المستخدم) */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 no-print">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#133063] hover:bg-[#0d234a] active:scale-95 text-white shadow-md transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isGeneratingPdf ? 'جاري تجهيز الـ PDF...' : '📥 تحميل إيصال الشكوى (PDF)'}
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          طباعة
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 transition"
          >
            إغلاق
          </button>
        )}
      </div>
    </div>
  );
};
