'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FilePlus, 
  Search, 
  ShieldCheck, 
  ArrowLeft, 
  Smartphone, 
  Compass, 
  Award, 
  Sparkles, 
  X,
  Download
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function HomePage() {
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [showPwaToast, setShowPwaToast] = useState(true);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      const code = localStorage.getItem('last_submitted_complaint_code');
      if (code) {
        // قراءة قيمة موجودة في المتصفح فقط بعد التركيب لتفادي اختلاف SSR.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavedCode(code);
      }
    } catch {
      // ignore
    }

    const handleBeforeInstall = (event: Event) => {
      const e = event as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaToast(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('لتثبيت التطبيق على هاتفك، اضغط على زر خيارات المتصفح (⋮ أو مشاركة) ثم اختر "إضافة إلى الشاشة الرئيسية".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPwaToast(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* تنبيه ذكي للمواطن عند وجود شكوى سابقة مسجلة على هاتفه */}
      {savedCode && (
        <aside aria-label="تنبيه الشكوى السابقة" className="bg-[#133063] text-white px-4 py-3 shadow-sm border-b border-[#00a3e0]/40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a3e0] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00a3e0]"></span>
              </span>
              <span>
                أهلاً بك مجدداً! لديك طلب سابق محفوظ على هذا الجهاز برقم:{' '}
                <strong className="font-mono bg-[#0d234a] px-2.5 py-0.5 rounded text-[#38bdf8] border border-[#00a3e0]/30">
                  {savedCode}
                </strong>
              </span>
            </div>
            <Link
              href={`/track?code=${savedCode}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#00a3e0] hover:bg-[#0284c7] text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              متابعة حالة هذا الطلب
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>
      )}

      {/* 1. السيكشن الأول: الهيرو الرئيسي مع فيديو علم مصر المرفرف بوضوح فائق */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[75vh] flex flex-col justify-between pt-16 pb-10">
        {/* فيديو علم مصر المرفرف المعتمد بدرجة ظهور واضحة جداً */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-85 filter contrast-110 saturate-125"
            src="/egypt-flag.mp4"
          />
          {/* طبقة تظليل سينمائية خفيفة لحماية تباين النصوص مع الحفاظ التام على ألوان العلم */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-[#0a192f]/85" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center my-auto">
          {/* العنوان الرئيسي بلون صلب وظل نص واضح فوق العلم */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-8 leading-tight max-w-4xl mx-auto drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">
            صوتك مسموع، وخدمتك في صدارة <span className="text-[#00a3e0] drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">أولوياتنا</span>
          </h1>

          {/* أزرار الإجراءات السريعة للمواطن */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-[#00a3e0] hover:bg-[#0284c7] text-white shadow-xl shadow-black/40 transition active:scale-95 border border-sky-400/40"
            >
              <FilePlus className="w-5 h-5 text-white" />
              تقديم طلب جديد الآن
            </Link>

            <Link
              href="/track"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-base font-bold bg-slate-900/80 hover:bg-slate-900 text-white border border-white/30 backdrop-blur-md shadow-xl shadow-black/40 transition active:scale-95"
            >
              <Search className="w-5 h-5 text-slate-200" />
              متابعة طلب قائم
            </Link>
          </div>
        </div>

        {/* شارة الهوية الرسمية بالأسفل خالص في الهيرو كما طلب المستخدم */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold text-white shadow-xl">
            <div className="relative w-4 h-5 shrink-0">
              <Image
                src="/egypt-eagle.svg"
                alt="نسر جمهورية مصر العربية"
                width={16}
                height={20}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <span className="text-[#00a3e0] font-extrabold">حزب مستقبل وطن</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="text-amber-300 font-extrabold">كلنا نعمل من أجل مصر</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="text-slate-200">أمانة الشباب بمركز بركة السبع</span>
          </div>
        </div>
      </section>

      {/* 2. السيكشن الثاني: حزب مستقبل وطن - أمانة الشباب (الهوية والرسالة المبسطة) */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* الشعار بحجم مكبّر وواضح */}
            <div className="lg:col-span-4 flex flex-col items-center text-center bg-slate-50 border border-slate-200 rounded-3xl p-8 shadow-xs">
              <div className="relative w-36 h-44 mb-3 drop-shadow-md">
                <Image
                  src="/logo.png"
                  alt="شعار حزب مستقبل وطن الرسمي"
                  width={144}
                  height={176}
                  className="w-full h-full object-contain"
                  priority
                  unoptimized
                />
              </div>
              <span className="text-xs font-bold text-[#00a3e0] uppercase tracking-wider block">
                حزب مستقبل وطن
              </span>
              <h2 className="text-xl font-extrabold text-[#133063] mt-1">
                أمانة الشباب
              </h2>
              <span className="text-xs text-slate-500 font-semibold mt-1">
                أمانة مركز بركة السبع • محافظة المنوفية
              </span>
              <div className="mt-3 pt-3 border-t border-slate-200/80 w-full text-center">
                <span className="text-[11px] font-bold text-slate-500 block">أمين الشباب بالمركز</span>
                <strong className="text-sm font-black text-[#133063] block">المهندس / محمد العزب</strong>
              </div>
            </div>

            {/* التعريف والركائز الثلاث المبسطة */}
            <div className="lg:col-span-8 space-y-6 text-right">
              <div>
                <span className="text-xs font-extrabold text-[#00a3e0] tracking-wider uppercase block mb-1">
                  المنظومة الإلكترونية المتكاملة
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#133063]">
                  المنصة الرسمية لتلقي ودراسة شكاوى ومقترحات الشباب
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-2.5">
                  منصة رقمية ميسرة مخصصة لاستقبال طلبات ومقترحات قطاع الشباب، وتوفير قناة اتصال مباشرة وآمنة تضمن المعاينة الميدانية وسرعة التنسيق مع الأجهزة التنفيذية والمعنية.
                </p>
              </div>

              {/* الركائز الثلاث المبسطة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-[#00a3e0] transition">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#133063] flex items-center justify-center font-bold mb-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#00a3e0]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">صوتك أمانة</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    استقبال مباشر لطلبك دون وسيط مع فحص سريع وسرية تامة.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-[#00a3e0] transition">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#133063] flex items-center justify-center font-bold mb-2.5">
                    <Compass className="w-5 h-5 text-[#00a3e0]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">متابعة ميدانية</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    معاينات واقعية وتنسيق مستمر مع الأجهزة ومراكز الشباب.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-[#00a3e0] transition">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#133063] flex items-center justify-center font-bold mb-2.5">
                    <Award className="w-5 h-5 text-[#00a3e0]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">تمكين الشباب</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    دعم ملتقيات التوظيف والأنشطة والمبادرات الشبابية الواعدة.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. آلية العمل الميسرة (3 خطوات فقط) */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#00a3e0] uppercase tracking-widest mb-2">
              آلية العمل الميسرة
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#133063]">
              ثلاث خطوات فقط لفحص وحل طلبك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xs hover:border-[#00a3e0] hover:shadow-md transition">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-blue-50 text-[#133063] flex items-center justify-center font-extrabold text-xl border border-blue-200">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">قدّم طلبك في دقيقة</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                اكتب طلبك ومكانك بوضوح كزائر بدون الحاجة لإنشاء حساب أو تعقيدات إدارية.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xs hover:border-[#00a3e0] hover:shadow-md transition">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-extrabold text-xl border border-amber-200">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">مراجعة وتنسيق فوري</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                تصل الشكوى فوراً للوحة مسؤولي أمانة الشباب بمركز بركة السبع لدراستها وتوجيه المعاينة الميدانية.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xs hover:border-[#00a3e0] hover:shadow-md transition">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center font-extrabold text-xl border border-sky-200">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">إنجاز وإيصال معتمد</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                تابع مسار الشكوى بكود التتبع أو هاتفك في أي وقت مع إمكانية طباعة إيصال رسمي PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. سيكشن الانضمام لكوادر شباب حزب مستقبل وطن */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#133063] rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-right max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300 border border-white/15">
                <Sparkles className="w-3.5 h-3.5" />
                المشاركة المجتمعية والتطوع
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold">
                ترغب في الانضمام لكوادر شباب حزب مستقبل وطن بمركز بركة السبع؟
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                نرحب بكل شاب وفتاة يمتلكون الرغبة في العمل العام وخدمة أهالينا والمشاركة في تنظيم الفعاليات والمبادرات الميدانية بمركز وقرى بركة السبع.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/committee"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold bg-[#00a3e0] text-white hover:bg-[#0284c7] shadow-md transition active:scale-95"
              >
                تعرف على هيئة مكتب الأمانة وقنوات الانضمام
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* توست / بنر عائم لتثبيت التطبيق PWA بأسفل الشاشة */}
      {showPwaToast && (
        <div className="fixed bottom-5 left-5 right-5 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#133063] text-white p-4 rounded-2xl shadow-2xl border border-[#00a3e0]/50 flex items-center justify-between gap-3 animate-fade-in no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#00a3e0]" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold">تثبيت تطبيق المنصة</h4>
              <p className="text-[11px] text-slate-300">للوصول السريع لطلباتك في أي وقت</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-[#00a3e0] hover:bg-[#0284c7] text-white text-xs font-bold transition shadow-xs"
            >
              تثبيت
            </button>
            <button
              type="button"
              onClick={() => setShowPwaToast(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
