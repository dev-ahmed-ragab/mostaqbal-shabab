'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Heart, ShieldCheck, Phone, Mail, MapPin, ExternalLink, Globe } from 'lucide-react';

function FooterInner() {
  const pathname = usePathname();
  const currentYear = 2026;

  // إخفاء الفوتر العام للمواطنين داخل لوحة المشرفين وصفحات الطباعة
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 no-print mt-auto relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* العمود 1: التعريف الرسمي بالحزب والأمانة */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-14 shrink-0 bg-white/5 p-1 rounded-xl border border-white/10">
                <Image
                  src="/logo.png"
                  alt="شعار حزب مستقبل وطن المعتمد"
                  width={48}
                  height={56}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#00a3e0] block">حزب مستقبل وطن</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                    أمانة مركز بركة السبع
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white">أمانة الشباب</h3>
                <p className="text-[11px] text-slate-400 font-semibold">محافظة المنوفية</p>
                <p className="text-xs text-amber-300 font-bold mt-1">
                  أمين الشباب بالمركز: المهندس / محمد العزب
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
              المنظومة الإلكترونية الرسمية المعتمدة لتلقي وفحص ومتابعة شكاوى ومقترحات ومطالب قطاع الشباب، والتنسيق الميداني المباشر مع الأجهزة التنفيذية ومراكز الشباب بمركز وقرى بركة السبع ومحافظة المنوفية.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-[#00a3e0] bg-[#133063]/60 border border-[#00a3e0]/30 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-[#00a3e0] shrink-0" />
                <span>منظومة إلكترونية مؤمنة وسرية تامة للمعلومات</span>
              </div>
            </div>
          </div>

          {/* العمود 2: روابط سريعة ومبادرات */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>أقسام ومبادرات المنظومة</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/" className="hover:text-[#00a3e0] transition flex items-center gap-1.5">
                  • الصفحة الرئيسية للمنظومة
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-[#00a3e0] transition flex items-center gap-1.5">
                  • تقديم طلب أو شكوى جديدة
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-[#00a3e0] transition flex items-center gap-1.5">
                  • الاستعلام ومتابعة حالة طلب
                </Link>
              </li>
              <li>
                <Link href="/committee" className="hover:text-[#00a3e0] transition flex items-center gap-1.5 text-amber-300 font-semibold">
                  • قيادات وأعضاء هيئة المكتب
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#00a3e0] transition flex items-center gap-1.5">
                  • بوابة دخول المشرفين
                </Link>
              </li>
            </ul>
          </div>

          {/* العمود 3: العناوين والمقرات الرسمية المعتمدة */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              المقرات وقنوات التواصل
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#00a3e0] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200 block text-[11px]">مقر أمانة حزب مستقبل وطن بمركز بركة السبع:</strong>
                  مركز بركة السبع - بجوار كافيه كارليتوس - محافظة المنوفية
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#00a3e0] shrink-0" />
                <span dir="ltr" className="font-mono text-slate-200">01012920967 / 01004744265</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#00a3e0] shrink-0" />
                <a
                  href="https://facebook.com/MostaqbalWatanOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 hover:underline flex items-center gap-1"
                >
                  الصفحة الرسمية الموثقة على Facebook
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* شريط الحقوق الوطني النظيف */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative w-5 h-6">
              <Image
                src="/egypt-eagle.svg"
                alt="شعار نسر جمهورية مصر العربية"
                width={20}
                height={24}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <p>© {currentYear} جمهورية مصر العربية | حزب مستقبل وطن - أمانة الشباب بمركز بركة السبع. جميع الحقوق محفوظة.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-bold text-amber-300 border border-amber-500/30">
              تحيا مصر 🇪🇬
            </span>
            <p className="flex items-center gap-1 text-[11px]">
              صُمم لخدمة شباب مصر بكل <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export const Footer: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <FooterInner />
    </Suspense>
  );
};
