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
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800',
    dotClass: 'bg-blue-500',
    description: 'تم استلام الشكوى وبانتظار بدء المراجعة الأولية',
  },
  under_review: {
    label: 'قيد المراجعة',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
    description: 'الشكوى معروضة على مسؤولي اللجنة لدراسة الموقف',
  },
  needs_info: {
    label: 'يحتاج استكمال بيانات',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-200 dark:border-orange-800',
    dotClass: 'bg-orange-500',
    description: 'يرجى مراجعة اللجنة أو تزويدنا بالمستندات المطلوبة',
  },
  in_progress: {
    label: 'جاري المتابعة والتنفيذ',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800',
    dotClass: 'bg-purple-500',
    description: 'تم تحويل الموضوع للجهات التنفيذية وجاري العمل على الحل',
  },
  resolved: {
    label: 'تم الحل بنجاح',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
    description: 'تم الانتهاء من الطلب وإزالة أسباب الشكوى بنجاح',
  },
  rejected: {
    label: 'مرفوض / غير مطابق',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800',
    dotClass: 'bg-rose-500',
    description: 'الطلب خارج اختصاص رعاية الشباب أو غير مستوفٍ للشروط',
  },
};
