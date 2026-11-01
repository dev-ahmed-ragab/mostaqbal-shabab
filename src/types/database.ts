export type ComplaintStatus =
  | 'new'
  | 'under_review'
  | 'needs_info'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export interface AltContact {
  type: 'whatsapp' | 'phone' | 'email';
  value: string;
}

export interface Attachment {
  url: string;
  name: string;
  type: 'image' | 'video';
  size?: number;
}

export interface Complaint {
  id: string;
  tracking_code: string;
  citizen_id?: string | null;
  citizen_name: string;
  national_id: string;
  primary_phone: string;
  alt_contacts: AltContact[];
  title: string;
  description: string;
  status: ComplaintStatus;
  committee_id?: string;
  committee_name?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
  category?: string;
  wants_promotion?: boolean;
  promotion_role?: string;
  is_confidential?: boolean; // خيار السرية والخصوصية للطلب
  public_response?: string; // الرد العام الرسمي الموجه للمواطن
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
  attachments: Attachment[];
  admin_notes?: string | null; // ملاحظات وتأشيرات داخلية مشفرة وسرية
  created_at: string;
  updated_at: string;
}

export interface ComplaintTimeline {
  id: string;
  complaint_id: string;
  status: ComplaintStatus;
  note?: string | null;
  actor_name?: string | null;
  /** false = ملاحظة داخلية لا تُعرض في صفحة المتابعة العامة. */
  is_public?: boolean;
  created_at: string;
}

export const STATUS_META: Record<
  ComplaintStatus,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    dotClass: string;
    description: string;
  }
> = {
  new: {
    label: 'جديد',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-200',
    dotClass: 'bg-sky-500',
    description: 'تم استلام الشكوى وبانتظار بدء المراجعة الأولية',
  },
  under_review: {
    label: 'قيد المراجعة',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
    description: 'الشكوى معروضة على مسؤولي أمانة رعاية الشباب لدراسة الموقف',
  },
  needs_info: {
    label: 'استكمال بيانات',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-200',
    dotClass: 'bg-orange-500',
    description: 'يرجى مراجعة أمانة رعاية الشباب أو تزويدنا بالمستندات المطلوبة',
  },
  in_progress: {
    label: 'جاري التنفيذ',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200',
    dotClass: 'bg-indigo-500',
    description: 'تم تحويل الموضوع للجهات التنفيذية وجاري العمل على الحل',
  },
  resolved: {
    label: 'تم الحل بنجاح',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
    description: 'تم الانتهاء من الطلب وإزالة أسباب الشكوى بنجاح',
  },
  rejected: {
    label: 'مرفوض',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-200',
    dotClass: 'bg-rose-500',
    description: 'الطلب خارج اختصاص أمانة الشباب أو غير مستوفٍ للشروط',
  },
};
