'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck, 
  Award, 
  X, 
  CheckCircle2, 
  Share2, 
  Sparkles,
  PhoneCall,
  MapPin,
  Building2,
  Maximize2
} from 'lucide-react';
import { EgyptEagle } from '@/components/EgyptEagle';

interface LeaderMember {
  id: string;
  name: string;
  title: string;
  roleDescription: string;
  badge: string;
  avatarSrc: string;
  fullSrc: string;
  facebookUrl: string;
  organization: string;
  locationScope: string;
}

const LEADERS_DATA: LeaderMember[] = [
  {
    id: 'batt',
    name: 'المحاسب / محمد بط',
    title: 'أمين التنظيم بحزب مستقبل وطن - محافظة المنوفية',
    roleDescription: 'الإشراف التنظيمي العام على الهيكل الحزبي والأمانات النوعية بمحافظة المنوفية، وتنسيق الجهود لدعم الشباب والمواطنين بكافة المراكز.',
    badge: 'أمانة التنظيم بالمحافظة',
    avatarSrc: '/leaders/avatar-batt.jpg',
    fullSrc: '/leaders/full-batt.jpg',
    facebookUrl: 'https://facebook.com/mohamed.batt.official',
    organization: 'أمانة حزب مستقبل وطن بمحافظة المنوفية',
    locationScope: 'أمانة المحافظة'
  },
  {
    id: 'talawe',
    name: 'أ. سامر التلاوي',
    title: 'أمين الشباب بمركز بركة السبع',
    roleDescription: 'قيادة أمانة الشباب وتوجيه سياسات الدعم الشبابي والرياضي بمركز بركة السبع، واعتماد القرارات والتأشيرات الرسمية لمطالب وشكاوى المواطنين.',
    badge: 'أمين الأمانة - اعتماد نهائي',
    avatarSrc: '/leaders/avatar-talawe.jpg',
    fullSrc: '/leaders/full-talawe.jpg',
    facebookUrl: 'https://facebook.com/samer.talawe.official',
    organization: 'حزب مستقبل وطن - أمانة مركز بركة السبع',
    locationScope: 'أمانة مركز بركة السبع'
  },
  {
    id: 'gazzar',
    name: 'م. محمود الجزار',
    title: 'أمين مساعد بأمانة الشباب بمركز بركة السبع',
    roleDescription: 'المتابعة التنفيذية المباشرة لملفات الشكاوى والمقترحات اليومية، والتنسيق الميداني مع الأجهزة التنفيذية ومراكز الشباب بقرى ومركز بركة السبع والمحافظة.',
    badge: 'أمين مساعد تنفيذي',
    avatarSrc: '/leaders/avatar-gazzar.jpg',
    fullSrc: '/leaders/full-gazzar.jpg',
    facebookUrl: 'https://facebook.com/mahmoud.elgazzar.official',
    organization: 'حزب مستقبل وطن - أمانة مركز بركة السبع',
    locationScope: 'أمانة مركز بركة السبع'
  },
  {
    id: 'helal',
    name: 'أ. محمد هلال',
    title: 'قيادي ومسؤول تنفيذي بأمانة الشباب',
    roleDescription: 'التنسيق الميداني والمتابعة التنظيمية لفعاليات وأنشطة قطاع الشباب والمبادرات المجتمعية ورعاية المواهب والكوادر بمركز بركة السبع.',
    badge: 'قيادي تنفيذي معتمد',
    avatarSrc: '/leaders/avatar-helal.jpg',
    fullSrc: '/leaders/full-helal.jpg',
    facebookUrl: 'https://facebook.com/mohamed.helal.official',
    organization: 'حزب مستقبل وطن - أمانة مركز بركة السبع',
    locationScope: 'أمانة مركز بركة السبع'
  },
  {
    id: 'azab',
    name: 'أ. محمد العزب',
    title: 'عضو هيئة مكتب أمانة الشباب ومسؤول المتابعة الميدانية',
    roleDescription: 'التواصل المباشر مع شباب القرى والمراكز وتلقي الاحتياجات العاجلة وتنظيم المعاينات الميدانية للملاعب والمنشآت بمركز بركة السبع.',
    badge: 'متابعة وتنسيق ميداني',
    avatarSrc: '/leaders/avatar-azab.jpg',
    fullSrc: '/leaders/full-azab.jpg',
    facebookUrl: 'https://facebook.com/mohamed.elazab.official',
    organization: 'حزب مستقبل وطن - أمانة مركز بركة السبع',
    locationScope: 'أمانة مركز بركة السبع'
  },
];

export default function CommitteeLeadersPage() {
  const [selectedLeader, setSelectedLeader] = useState<LeaderMember | null>(null);

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 w-full">
      {/* الترويسة العلوية الأنيقة */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#133063] transition mb-4 group"
        >
          <ArrowRight className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          العودة للصفحة الرئيسية
        </Link>

        {/* الشارات الوطنية الرسمية */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#133063] bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#00a3e0] animate-pulse" />
            حزب مستقبل وطن
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            أمانة مركز بركة السبع
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            <div className="relative w-3.5 h-4">
              <Image
                src="/egypt-eagle.svg"
                alt="نسر جمهورية مصر العربية"
                width={14}
                height={16}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            كلنا نعمل من أجل مصر
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#133063] mb-3 tracking-tight">
          قيادات وأعضاء أمانة الشباب
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          فريق العمل والقيادات التنفيذية المسؤولة عن دراسة ومتابعة طلبات وشكاوى قطاع الشباب،
          والعمل الميداني المستمر على تذليل كافة العقبات وخدمة أهالينا بمركز وقرى بركة السبع ومحافظة المنوفية.
        </p>
      </div>

      {/* شبكة بطاقات القيادات بتصميم عصري راقٍ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 mb-14">
        {LEADERS_DATA.map((leader, index) => (
          <div
            key={leader.id}
            onClick={() => setSelectedLeader(leader)}
            className="group relative bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(19,48,99,0.12)] hover:border-[#00a3e0]/60 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            {/* شريط زينة علوي بلون الهوية */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#133063] group-hover:h-2 transition-all duration-300" />

            {/* وسام النطاق الجغرافي بالأعلى */}
            <div className="flex items-center justify-between mb-4 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#133063] bg-slate-100/80 px-2.5 py-0.5 rounded-lg border border-slate-200">
                <MapPin className="w-3 h-3 text-[#00a3e0]" />
                {leader.locationScope}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#00a3e0] bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                {leader.badge}
              </span>
            </div>

            <div>
              {/* قسم الصورة والاسم بتنسيق متوازن واحترافي */}
              <div className="flex items-center gap-4 mb-4">
                {/* إطار الصورة الشخصية المعدلة والمقصوصة بدقة */}
                <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-[#133063] to-[#00a3e0] shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-white">
                    <Image
                      src={leader.avatarSrc}
                      alt={leader.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover object-top"
                      unoptimized
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#00a3e0] transition leading-snug">
                    {leader.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {leader.title}
                  </p>
                </div>
              </div>

              {/* الشرح والدور التنفيذي */}
              <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100 mb-5">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {leader.roleDescription}
                </p>
              </div>
            </div>

            {/* الإجراء السريع بأسفل البطاقة */}
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#133063] group-hover:text-[#00a3e0] flex items-center gap-1.5 transition">
                <Maximize2 className="w-3.5 h-3.5 text-[#00a3e0]" />
                استعراض الملف الشخصي
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-600 font-semibold transition">
                انقر للتكبير
                <ArrowRight className="w-3 h-3 rotate-180 text-slate-400 group-hover:text-[#00a3e0] transition-transform group-hover:-translate-x-1" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* بنر تعريفي توضيحي بالأسفل */}
      <div className="bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 border border-blue-200/80 rounded-3xl p-6 sm:p-8 text-center max-w-4xl mx-auto shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-right space-y-1">
            <h4 className="text-sm sm:text-base font-extrabold text-[#133063]">
              أمانة الشباب بمركز بركة السبع في خدمتكم دائماً
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              يمكنكم في أي وقت رفع طلب أو شكوى أو مقترح مباشر لمسؤولي الأمانة ومتابعة الفحص إلكترونياً.
            </p>
          </div>
          <Link
            href="/submit"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
          >
            تقديم طلب أو مقترح جديد
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>

      {/* نافذة التكبير والعرض الكامل (Lightbox Modal) */}
      {selectedLeader && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedLeader(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden border border-slate-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* شريط زينة علوي للنافذة */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#133063] via-[#00a3e0] to-[#133063]" />

            {/* زر الإغلاق */}
            <button
              type="button"
              onClick={() => setSelectedLeader(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition z-10"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* الصورة الكاملة عالية الدقة */}
            <div className="relative w-full max-h-[460px] rounded-2xl overflow-hidden mb-6 bg-slate-100 shadow-inner flex items-center justify-center">
              <Image
                src={selectedLeader.fullSrc}
                alt={selectedLeader.name}
                width={700}
                height={850}
                className="max-h-[460px] w-auto object-contain mx-auto rounded-xl"
                priority
                unoptimized
              />
            </div>

            {/* تفاصيل القائد */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-extrabold text-[#00a3e0] block">
                    {selectedLeader.organization}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-[#133063] mt-0.5">
                    {selectedLeader.name}
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                    {selectedLeader.title}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-blue-50 text-[#133063] rounded-lg border border-blue-200 self-start sm:self-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#00a3e0]" />
                  {selectedLeader.badge}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-extrabold text-slate-800 block mb-1">
                  الاختصاصات والمهام في الأمانة:
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {selectedLeader.roleDescription}
                </p>
              </div>

              {/* أزرار التواصل والرابط الخارجي لفيسبوك */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <a
                  href={selectedLeader.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#1877f2] hover:bg-[#166fe5] text-white shadow-md transition active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  حساب فيسبوك الرسمي (مؤقت)
                </a>

                <Link
                  href="/submit"
                  onClick={() => setSelectedLeader(null)}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#133063] hover:bg-[#0d234a] text-white shadow-md transition active:scale-95"
                >
                  تقديم طلب موجه للأمانة
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
