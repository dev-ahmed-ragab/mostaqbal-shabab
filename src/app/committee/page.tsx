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
  PhoneCall
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
}

const LEADERS_DATA: LeaderMember[] = [
  {
    id: 'batt',
    name: 'المحاسب / محمد بط',
    title: 'أمين التنظيم بحزب مستقبل وطن - محافظة المنوفية',
    roleDescription: 'الإشراف التنظيمي العام على الهيكل الحزبي واللجان النوعية بمحافظة المنوفية، وتنسيق الجهود لدعم الشباب والمواطنين بكافة المراكز.',
    badge: 'أمانة التنظيم بالمحافظة',
    avatarSrc: '/leaders/avatar-batt.jpg',
    fullSrc: '/leaders/full-batt.jpg',
    facebookUrl: 'https://facebook.com/mohamed.batt.official',
    organization: 'أمانة حزب مستقبل وطن بمحافظة المنوفية'
  },
  {
    id: 'talawe',
    name: 'أ. سامر التلاوي',
    title: 'رئيس لجنة رعاية الشباب',
    roleDescription: 'رئاسة اللجنة وتوجيه سياسات الدعم الشبابي والرياضي، واعتماد القرارات والتأشيرات الرسمية لمطالب وشكاوى المواطنين.',
    badge: 'رئيس اللجنة - اعتماد نهائي',
    avatarSrc: '/leaders/avatar-talawe.jpg',
    fullSrc: '/leaders/full-talawe.jpg',
    facebookUrl: 'https://facebook.com/samer.talawe.official',
    organization: 'حزب مستقبل وطن - لجنة رعاية الشباب'
  },
  {
    id: 'gazzar',
    name: 'م. محمود الجزار',
    title: 'مقرر لجنة رعاية الشباب',
    roleDescription: 'المتابعة التنفيذية المباشرة لملفات الشكاوى والمقترحات اليومية، والتنسيق الميداني مع الأجهزة التنفيذية ومراكز الشباب بالمحافظة.',
    badge: 'مقرر اللجنة التنفيذي',
    avatarSrc: '/leaders/avatar-gazzar.jpg',
    fullSrc: '/leaders/full-gazzar.jpg',
    facebookUrl: 'https://facebook.com/mahmoud.elgazzar.official',
    organization: 'حزب مستقبل وطن - لجنة رعاية الشباب'
  },
  {
    id: 'helal',
    name: 'أ. محمد هلال',
    title: 'قيادي ومسؤول تنفيذي بلجنة الشباب',
    roleDescription: 'التنسيق الميداني والمتابعة التنظيمية لفعاليات وأنشطة قطاع الشباب والمبادرات المجتمعية ورعاية المواهب.',
    badge: 'قيادي تنفيذي معتمد',
    avatarSrc: '/leaders/avatar-helal.jpg',
    fullSrc: '/leaders/full-helal.jpg',
    facebookUrl: 'https://facebook.com/mohamed.helal.official',
    organization: 'حزب مستقبل وطن - لجنة رعاية الشباب'
  },
  {
    id: 'azab',
    name: 'أ. محمد العزب',
    title: 'عضو لجنة الشباب ومسؤول المتابعة الميدانية',
    roleDescription: 'التواصل المباشر مع شباب القرى والمراكز وتلقي الاحتياجات العاجلة وتنظيم المعاينات الميدانية للملاعب والمنشآت.',
    badge: 'متابعة وتنسيق ميداني',
    avatarSrc: '/leaders/avatar-azab.jpg',
    fullSrc: '/leaders/full-azab.jpg',
    facebookUrl: 'https://facebook.com/mohamed.elazab.official',
    organization: 'حزب مستقبل وطن - لجنة رعاية الشباب'
  },
];

export default function CommitteeLeadersPage() {
  const [selectedLeader, setSelectedLeader] = useState<LeaderMember | null>(null);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 w-full">
      {/* الترويسة العلوية */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#133063] transition mb-4"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          العودة للصفحة الرئيسية
        </Link>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs font-extrabold text-[#00a3e0] uppercase tracking-wider">
            حزب مستقبل وطن
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
            <div className="relative w-3.5 h-4">
              <Image
                src="/egypt-eagle.svg"
                alt="نسر مصر"
                width={14}
                height={16}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            كلنا نعمل من أجل مصر
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#133063] mb-3">
          قيادات وأعضاء لجنة رعاية الشباب
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          فريق العمل والقيادات التنفيذية المسؤولة عن دراسة ومتابعة طلبات وشكاوى قطاع الشباب،
          والعمل الميداني المستمر على تذليل كافة العقبات وخدمة أهالينا.
        </p>
      </div>

      {/* شبكة بطاقات القيادات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {LEADERS_DATA.map((leader) => (
          <div
            key={leader.id}
            onClick={() => setSelectedLeader(leader)}
            className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm hover:shadow-xl hover:border-[#00a3e0] transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            {/* شريط زينة علوي بهوية الحزب */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#133063] to-[#00a3e0]" />

            <div>
              {/* صورة الوجه المقصوصة بدقة */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#133063]/20 shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0 bg-slate-100">
                  <Image
                    src={leader.avatarSrc}
                    alt={leader.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block text-[11px] font-bold text-[#133063] bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 rounded-lg mb-1">
                    {leader.badge}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#00a3e0] transition truncate">
                    {leader.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 truncate">
                    {leader.title}
                  </p>
                </div>
              </div>

              {/* الشرح والدور */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-5">
                {leader.roleDescription}
              </p>
            </div>

            {/* الإجراء السريع: فتح الصورة والتفاصيل ورابط فيسبوك */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-[#133063] group-hover:text-[#00a3e0] flex items-center gap-1">
                عرض الصورة والملف الشخصي
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </span>

              <span className="text-[11px] text-slate-400 font-medium">
                اضغط للتكبير
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة التكبير والعرض الكامل (Lightbox Modal) */}
      {selectedLeader && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedLeader(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden border border-slate-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
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
                  <span className="text-xs font-bold text-[#00a3e0] block">
                    {selectedLeader.organization}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#133063] mt-0.5">
                    {selectedLeader.name}
                  </h2>
                  <p className="text-xs font-semibold text-slate-600">
                    {selectedLeader.title}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-blue-50 text-[#133063] rounded-lg border border-blue-200 self-start sm:self-center">
                  <ShieldCheck className="w-4 h-4 text-[#00a3e0]" />
                  {selectedLeader.badge}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  الاختصاصات والمهام في اللجنة:
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
                  تقديم طلب موجه للجنة
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
