'use client';

import React from 'react';

interface EgyptEagleProps {
  className?: string;
  size?: number;
  variant?: 'gold' | 'white' | 'monochrome';
}

export const EgyptEagle: React.FC<EgyptEagleProps> = ({
  className = 'w-6 h-6',
  size,
  variant = 'gold',
}) => {
  const isGold = variant === 'gold';

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="نسر صلاح الدين - شعار جمهورية مصر العربية"
    >
      <defs>
        {/* تدرج ذهبي ملكي للنسر المصري */}
        <linearGradient id="goldEagleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdf0cd" />
          <stop offset="25%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#aa7c11" />
          <stop offset="75%" stopColor="#eec759" />
          <stop offset="100%" stopColor="#966b0a" />
        </linearGradient>

        <linearGradient id="goldWingLeft" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#f7dc6f" />
          <stop offset="60%" stopColor="#c0932b" />
          <stop offset="100%" stopColor="#875d06" />
        </linearGradient>

        <linearGradient id="goldWingRight" x1="100%" y1="0%" x2="0%" y2="80%">
          <stop offset="0%" stopColor="#f7dc6f" />
          <stop offset="60%" stopColor="#c0932b" />
          <stop offset="100%" stopColor="#875d06" />
        </linearGradient>

        <filter id="eagleGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#eagleGlow)">
        {/* الرأس والمنقار متجهاً لليمين (نحو علم مصر) */}
        <path
          d="M 60 14 C 62 10, 67 11, 71 14 C 74 16, 78 18, 80 22 C 78 23, 74 23, 71 22 C 73 25, 71 28, 68 30 C 65 31, 62 31, 60 30 Z"
          fill={isGold ? 'url(#goldEagleGrad)' : 'currentColor'}
        />
        {/* العين */}
        <circle cx="68" cy="18" r="1.5" fill="#1e293b" />
        {/* المنقار الذهبي الحاد */}
        <path
          d="M 76 17 Q 83 20 81 24 Q 77 23 75 21 Z"
          fill={isGold ? '#e5a93b' : 'currentColor'}
        />

        {/* تاج الرأس والريش العلوي */}
        <path
          d="M 58 15 C 55 18, 54 23, 56 28 C 58 31, 62 32, 65 32 C 60 35, 57 39, 58 44 L 62 44 Z"
          fill={isGold ? 'url(#goldEagleGrad)' : 'currentColor'}
        />

        {/* الجناح الأيمن (ناظر النسر - يسار المشاهد) */}
        <g fill={isGold ? 'url(#goldWingLeft)' : 'currentColor'}>
          {/* طبقة الريش الرئيسية */}
          <path d="M 48 38 C 36 32, 22 36, 12 48 C 18 56, 26 58, 34 54 C 24 64, 24 74, 28 82 C 34 82, 40 76, 44 70 C 40 78, 42 86, 48 90 L 52 74 C 50 62, 48 50, 48 38 Z" />
          {/* ريشات تفصيلية */}
          <path d="M 16 46 Q 28 42 38 48" stroke="#fef08a" strokeWidth="0.8" opacity="0.6" fill="none" />
          <path d="M 22 58 Q 32 54 42 58" stroke="#fef08a" strokeWidth="0.8" opacity="0.6" fill="none" />
          <path d="M 30 70 Q 38 66 46 70" stroke="#fef08a" strokeWidth="0.8" opacity="0.6" fill="none" />
        </g>

        {/* الجناح الأيسر (يمين المشاهد) */}
        <g fill={isGold ? 'url(#goldWingRight)' : 'currentColor'}>
          {/* طبقة الريش الرئيسية */}
          <path d="M 72 38 C 84 32, 98 36, 108 48 C 102 56, 94 58, 86 54 C 96 64, 96 74, 92 82 C 86 82, 80 76, 76 70 C 80 78, 78 86, 72 90 L 68 74 C 70 62, 72 50, 72 38 Z" />
          {/* ريشات تفصيلية */}
          <path d="M 104 46 Q 92 42 82 48" stroke="#fef08a" strokeWidth="0.8" opacity="0.6" fill="none" />
          <path d="M 98 58 Q 88 54 78 58" stroke="#fef08a" strokeWidth="0.8" opacity="0.6" fill="none" />
          <path d="M 90 70 Q 82 66 74 70" stroke="#fef08a" strokeWidth="0.8" opacity="0.6" fill="none" />
        </g>

        {/* الذيل السفلي */}
        <path
          d="M 52 86 L 46 104 L 54 102 L 60 106 L 66 102 L 74 104 L 68 86 Z"
          fill={isGold ? 'url(#goldEagleGrad)' : 'currentColor'}
        />

        {/* الدرع الأوسط على صدر النسر */}
        <g>
          {/* إطار الدرع الذهبي */}
          <path
            d="M 47 40 L 73 40 C 74 56, 72 70, 60 82 C 48 70, 46 56, 47 40 Z"
            fill={isGold ? '#d4af37' : 'currentColor'}
            stroke="#875d06"
            strokeWidth="1.2"
          />

          {/* خطوط علم مصر داخل الدرع (أحمر، أبيض، أسود) */}
          <g>
            {/* الشريحة العليا الحمراء */}
            <path
              d="M 48.5 42 L 71.5 42 C 72 48, 71.5 53, 71 55 L 49 55 C 48.5 53, 48 48, 48.5 42 Z"
              fill="#ce1126"
            />
            {/* الشريحة الوسطى البيضاء */}
            <path
              d="M 49 55 L 71 55 C 70 63, 67 69, 60 74 C 53 69, 50 63, 49 55 Z"
              fill="#ffffff"
            />
            {/* الشريحة السفلى السوداء */}
            <path
              d="M 53 69 L 67 69 C 65 73, 63 76, 60 79 C 57 76, 55 73, 53 69 Z"
              fill="#111827"
            />
            {/* نسر ذهبي منمنم داخل الدرع */}
            <circle cx="60" cy="62" r="2.5" fill="#c0932b" />
          </g>
        </g>

        {/* مخالب النسر الذهبية والقاعدة */}
        <path
          d="M 48 84 Q 45 88 47 92 Q 52 90 53 85 Z"
          fill={isGold ? '#eec759' : 'currentColor'}
        />
        <path
          d="M 72 84 Q 75 88 73 92 Q 68 90 67 85 Z"
          fill={isGold ? '#eec759' : 'currentColor'}
        />

        {/* لفافة القاعدة المكتوب عليها (جمهورية مصر العربية) */}
        <path
          d="M 38 92 C 48 89, 72 89, 82 92 C 85 94, 82 98, 78 97 C 68 95, 52 95, 42 97 C 38 98, 35 94, 38 92 Z"
          fill={isGold ? '#fef08a' : 'currentColor'}
          stroke="#aa7c11"
          strokeWidth="0.8"
        />
      </g>
    </svg>
  );
};
