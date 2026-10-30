'use client';

import React from 'react';
import { EgyptEagle } from './EgyptEagle';

interface WavingEgyptFlagProps {
  className?: string;
  width?: number; // e.g. 280
  height?: number; // e.g. 180
  showPole?: boolean;
  showStand?: boolean;
}

export const WavingEgyptFlag: React.FC<WavingEgyptFlagProps> = ({
  className = '',
  width = 280,
  height = 186,
  showPole = true,
  showStand = true,
}) => {
  return (
    <div className={`relative inline-flex items-end select-none ${className}`} dir="ltr">
      {/* 1. سارية العلم الذهبية (Flagpole) */}
      {showPole && (
        <div className="relative flex flex-col items-center z-20 shrink-0 mr-[-2px]">
          {/* رأس السارية الذهبي الدائري / الحربة */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#996515] via-[#f7dc6f] to-[#d4af37] shadow-md border border-[#875d06] flex items-center justify-center -mb-1 relative z-30">
            <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
          </div>

          {/* عمود السارية المعدني اللامع */}
          <div
            className="w-2.5 rounded-full bg-gradient-to-r from-[#94a3b8] via-[#e2e8f0] to-[#64748b] shadow-md relative z-20"
            style={{ height: height + 50 }}
          >
            {/* حلقات تثبيت حبل العلم الذهبية */}
            <div className="absolute top-4 -left-0.5 w-3.5 h-1 bg-[#d4af37] rounded-sm" />
            <div className="absolute bottom-12 -left-0.5 w-3.5 h-1 bg-[#d4af37] rounded-sm" />
          </div>

          {/* قاعدة السارية الأرضية الذهبية */}
          {showStand && (
            <div className="w-12 h-3.5 bg-gradient-to-t from-[#875d06] via-[#d4af37] to-[#fef08a] rounded-t-full shadow-lg border-b-2 border-slate-900 -mt-1 relative z-10 flex items-center justify-center">
              <div className="w-6 h-1 bg-[#aa7c11] rounded-full" />
            </div>
          )}
        </div>
      )}

      {/* 2. قماش العلم مع تأثير الرفرفة ثلاثي الأبعاد والتموج الواقعي */}
      <div
        className="relative perspective-[1200px] mb-8"
        style={{ width, height }}
      >
        <div
          className="w-full h-full relative rounded-r-md overflow-hidden shadow-2xl origin-left animate-flag-wave transition-transform"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '0 20px 30px -10px rgba(0,0,0,0.45), 0 0 15px rgba(0,0,0,0.15)',
          }}
        >
          {/* الشريحة العليا: الأحمر المصري */}
          <div className="h-1/3 w-full bg-[#ce1126] relative">
            {/* لمعان خفيف */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
          </div>

          {/* الشريحة الوسطى: الأبيض مع نسر صلاح الدين الذهبي */}
          <div className="h-1/3 w-full bg-[#ffffff] relative flex items-center justify-center">
            {/* نسر صلاح الدين الذهبي الرسمي لجمهورية مصر العربية */}
            <div className="relative z-10 drop-shadow-sm transform scale-110">
              <EgyptEagle size={Math.round(height * 0.28)} variant="gold" />
            </div>
          </div>

          {/* الشريحة السفلى: الأسود المصري */}
          <div className="h-1/3 w-full bg-[#111827] relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* طبقة تموجات الظل والضوء وحركة الرياح الواقعية */}
          <div
            className="absolute inset-0 pointer-events-none animate-flag-shimmer mix-blend-overlay opacity-80"
            style={{
              background:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(0,0,0,0.4) 12%, rgba(255,255,255,0.4) 25%, rgba(0,0,0,0.35) 38%, rgba(255,255,255,0.3) 50%)',
              backgroundSize: '200% 100%',
            }}
          />

          {/* تظليل إضافي لحافة السارية (عمق الانحناء الأول) */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

          {/* تظليل أطراف العلم الحرة المرفرفة */}
          <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />
        </div>

        {/* ظل العلم الساقط على الأرض أو الخلفية */}
        <div
          className="absolute -bottom-4 left-4 right-0 h-4 bg-black/20 rounded-full blur-md animate-flag-shadow transform origin-left"
          style={{ width: width * 0.95 }}
        />
      </div>
    </div>
  );
};
