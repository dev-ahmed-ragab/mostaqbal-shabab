'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Download,
  Printer,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

export default function QrPage() {
  const [copied, setCopied] = useState(false);
  const targetUrl = 'https://mostaqbal-shabab.vercel.app/';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 1. واجهة العرض للمستخدم (تختفي عند الطباعة) */}
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 no-print">
        <div className="w-full max-w-md mx-auto space-y-6">

          {/* ترويسة بسيطة ومختصرة ("كلمتين") */}
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold text-[#00a3e0] bg-sky-50 border border-sky-200/80 px-3 py-1 rounded-full inline-block">
              حزب مستقبل وطن • بركة السبع
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#133063]">
              رمز الـ QR للدخول السريع
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              امسح الرمز بكاميرا هاتفك للدخول المباشر إلى المنصة الرسمية.
            </p>
          </div>

          {/* بطاقة الـ QR الواحدة فقط */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 flex flex-col items-center space-y-5">
            
            {/* إطار الرمز وبداخله الشعار */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 bg-white p-3 rounded-2xl border-2 border-sky-100 shadow-inner flex items-center justify-center">
              <Image
                src="/qr-mostaqbal-shabab.png"
                alt="رمز الدخول السريع - حزب مستقبل وطن"
                fill
                className="object-contain p-1"
                priority
                unoptimized
              />
            </div>

            {/* إرشاد المسح */}
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#133063] bg-sky-50 border border-sky-200 px-3.5 py-1 rounded-full">
              <Smartphone className="w-3.5 h-3.5 text-[#00a3e0]" />
              وجّه كاميرا هاتفك نحو الرمز
            </span>

            {/* شريط الرابط المباشر مع زر النسخ */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center gap-2">
              <span className="text-xs font-mono text-[#133063] font-bold truncate flex-1 text-left" dir="ltr">
                {targetUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 bg-white text-[#133063] hover:bg-sky-50 border border-slate-200 active:scale-95"
                title="نسخ الرابط"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#00a3e0]" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>

            {/* أزرار الإجراءات الثلاثة الأساسية: طباعة، تحميل PDF، تحميل PNG */}
            <div className="w-full space-y-2.5 pt-2">
              {/* 1. أمر طباعة واحد مباشر */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-[#133063] hover:bg-[#0f2752] text-white py-3 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition active:scale-98"
              >
                <Printer className="w-4 h-4 text-sky-300" />
                <span>طباعة</span>
              </button>

              {/* 2 و 3. زري تحميل PDF و PNG في صف واحد */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="/qr-poster-A4.pdf"
                  download="بوستر_مستقبل_وطن_A4.pdf"
                  className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-[#133063] py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs hover:shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#00a3e0]" />
                  <span>تحميل PDF</span>
                </a>

                <a
                  href="/qr-mostaqbal-shabab.png"
                  download="رمز_QR_مستقبل_وطن.png"
                  className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs hover:shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>تحميل PNG</span>
                </a>
              </div>

              {/* زر الانتقال المباشر */}
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-500 hover:text-[#133063] transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح الرابط مباشرة</span>
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* 2. وضع الطباعة المباشر من المتصفح (يظهر فقط عند أمر Print) */}
      <div className="hidden print:block print:p-0 print:m-0 bg-white">
        <div className="w-[210mm] min-h-[297mm] mx-auto p-10 flex flex-col justify-between border-8 border-[#133063] rounded-2xl bg-white">
          
          {/* شريط العلم المصري */}
          <div className="w-full flex h-2 rounded-full overflow-hidden mb-6">
            <div className="flex-1 bg-[#ce1126]" />
            <div className="flex-1 bg-white border-y border-slate-200" />
            <div className="flex-1 bg-black" />
          </div>

          {/* ترويسة البوستر */}
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-5">
            <div className="text-right space-y-1">
              <p className="text-xs font-bold text-slate-500">جمهورية مصر العربية</p>
              <h2 className="text-xl font-black text-[#133063]">حزب مستقبل وطن</h2>
              <p className="text-xs font-extrabold text-[#00a3e0]">أمانة مركز بركة السبع - أمانة الشباب</p>
            </div>

            <div className="relative w-16 h-20">
              <Image
                src="/logo.png"
                alt="شعار حزب مستقبل وطن"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* العنوان الرئيسي */}
          <div className="text-center my-6 space-y-2">
            <h1 className="text-3xl font-black text-[#133063]">
              امسح الرمز للدخول إلى المنصة الرسمية
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              وجّه كاميرا هاتفك المحمول نحو الرمز لفتح المنصة مباشرة
            </p>
          </div>

          {/* رمز الـ QR المطبوع في المنتصف */}
          <div className="flex flex-col items-center justify-center p-8 border-2 border-slate-200 rounded-3xl bg-slate-50/50 max-w-[150mm] mx-auto my-4">
            <div className="relative w-80 h-80 bg-white p-3 rounded-2xl border-2 border-[#133063]">
              <Image
                src="/qr-mostaqbal-shabab.png"
                alt="رمز الـ QR"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>

            <div className="mt-4 text-center">
              <span className="inline-block text-xs font-bold text-[#133063] bg-sky-100 border border-sky-300 px-5 py-1.5 rounded-full">
                📷 افتح كاميرا الهاتف • وجّه العدسة نحو الرمز • اضغط للفتح
              </span>
            </div>
          </div>

          {/* بطاقة الرابط */}
          <div className="p-3 bg-[#133063] text-white rounded-xl text-center my-3 max-w-[150mm] mx-auto w-full">
            <p className="text-xs text-sky-200 mb-0.5">الرابط المباشر:</p>
            <p className="text-base font-mono font-bold tracking-wider" dir="ltr">
              https://mostaqbal-shabab.vercel.app/
            </p>
          </div>

          {/* التذييل الرسمي */}
          <div className="text-center pt-4 border-t border-slate-200 space-y-1">
            <p className="text-sm font-black text-[#133063]">
              كلنا نعمل من أجل مصر • مستقبل وطن
            </p>
            <p className="text-xs text-slate-500 font-semibold">
              أمانة مركز بركة السبع - أمانة الشباب • محافظة المنوفية
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
