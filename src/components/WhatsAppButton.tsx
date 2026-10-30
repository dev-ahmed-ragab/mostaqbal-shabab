'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { Complaint } from '@/types/database';

interface WhatsAppButtonProps {
  complaint: Pick<Complaint, 'citizen_name' | 'tracking_code' | 'title' | 'status' | 'primary_phone'>;
  targetPhone?: string;
  customNote?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  complaint,
  targetPhone,
  customNote,
  label = 'مراسلة عبر واتساب',
  className = '',
  iconOnly = false,
}) => {
  const url = buildWhatsAppLink(complaint, targetPhone, customNote);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all duration-150 active:scale-95 ${className}`}
      title={`إرسال رسالة واتساب إلى ${complaint.citizen_name}`}
    >
      <MessageCircle className="w-4 h-4 text-emerald-100" />
      {!iconOnly && <span>{label}</span>}
    </a>
  );
};
