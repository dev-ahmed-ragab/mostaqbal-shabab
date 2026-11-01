import { Complaint, ComplaintTimeline, ComplaintStatus, STATUS_META } from '@/types/database';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { generateTrackingCode } from './generateCode';

// بيانات تجريبية أولية في حال عدم ربط Supabase بعد
const INITIAL_DEMO_COMPLAINTS: Complaint[] = [
  {
    id: 'c101-demo-uuid',
    tracking_code: 'SH-1030-01',
    citizen_name: 'أحمد محمود إبراهيم',
    national_id: '29510151234567',
    primary_phone: '01012345678',
    alt_contacts: [{ type: 'whatsapp', value: '01012345678' }],
    title: 'طلب دعم وتجهيز ملتقى توظيف شباب الخريجين',
    description: 'نرجو من أمانة الشباب بمركز بركة السبع التنسيق لتنظيم ملتقى توظيف مصغر بالتعاون مع شركات القطاع الخاص لتوفير فرص عمل لشباب الدائرة وتأهيلهم لسوق العمل.',
    status: 'under_review',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'مركز شباب بركة السبع - الصالة المغطاة',
    location_lat: 30.0444,
    location_lng: 31.2357,
    attachments: [],
    admin_notes: 'تم إحالة الموضوع للأمين المساعد للتنسيق مع الشركات الراعية.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'c102-demo-uuid',
    tracking_code: 'SH-1030-02',
    citizen_name: 'سارة عبد الرحمن يوسف',
    national_id: '29805201234568',
    primary_phone: '01123456789',
    alt_contacts: [
      { type: 'whatsapp', value: '01123456789' },
      { type: 'email', value: 'sara.youssef@example.com' }
    ],
    title: 'صيانة ملعب كرة القدم وتوفير إضاءة كاشفة',
    description: 'أعمدة الإنارة في الملعب الخماسي معطلة منذ أسبوع والشباب لا يستطيعون ممارسة الأنشطة الرياضية ليلاً، نرجو الصيانة العاجلة لتشجيع ممارسة الرياضة.',
    status: 'in_progress',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'ملعب قرية الأمل الرياضي',
    location_lat: 30.0512,
    location_lng: 31.2421,
    attachments: [],
    admin_notes: 'تم التواصل مع فني الكهرباء وتوفير الكشافات، جاري التركيب غداً.',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c103-demo-uuid',
    tracking_code: 'SH-1029-01',
    citizen_name: 'محمد السيد الشناوي',
    national_id: '29203101234569',
    primary_phone: '01234567890',
    alt_contacts: [{ type: 'phone', value: '01512345678' }],
    title: 'إنشاء دورة تدريبية مجانية في البرمجة والذكاء الاصطناعي',
    description: 'مقترح لإطلاق مبادرة لتأهيل 50 شاباً وفتاة في مهارات العمل الحر والبرمجة بالتعاون مع مدربين متطوعين لدعم الابتكار التقني.',
    status: 'resolved',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'مقر قاعة المؤتمرات',
    attachments: [],
    admin_notes: 'تمت الموافقة وتدشين الدورة التدريبية يوم السبت القادم بحضور 60 متدرباً.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c104-demo-uuid',
    tracking_code: 'SH-1028-03',
    citizen_name: 'خالد مصطفى علام',
    national_id: '29007081234570',
    primary_phone: '01098765432',
    alt_contacts: [],
    title: 'طلب توفير أدوات رياضية لفريق تنس الطاولة',
    description: 'فريق الناشئين حقق المركز الأول على مستوى المنطقة ويحتاج مضارب وكرات تدريبية إضافية للاستعداد للبطولة الجمهورية القادمة.',
    status: 'new',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'نادي شباب المستقبل',
    attachments: [],
    admin_notes: null,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

const INITIAL_DEMO_TIMELINE: ComplaintTimeline[] = [
  {
    id: 't1',
    complaint_id: 'c101-demo-uuid',
    status: 'new',
    note: 'تم استلام الشكوى إلكترونياً بنجاح وقيد الفحص الأولي.',
    actor_name: 'المنظومة الإلكترونية',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't2',
    complaint_id: 'c101-demo-uuid',
    status: 'under_review',
    note: 'تم إحالة الموضوع لمقرر أمانة الشباب للتنسيق مع الشركات الراعية.',
    actor_name: 'م. محمود الجزار (مسؤول أمانة الشباب)',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 't3',
    complaint_id: 'c102-demo-uuid',
    status: 'new',
    note: 'تم استلام الشكوى إلكترونياً.',
    actor_name: 'المنظومة الإلكترونية',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't4',
    complaint_id: 'c102-demo-uuid',
    status: 'in_progress',
    note: 'تم التواصل مع فني الكهرباء وتوفير الكشافات، جاري التركيب غداً.',
    actor_name: 'أ. محمد العزب (عضو أمانة الشباب)',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't5',
    complaint_id: 'c103-demo-uuid',
    status: 'resolved',
    note: 'تمت الموافقة وتدشين الدورة التدريبية بنجاح.',
    actor_name: 'أ. سامر التلاوي (رئيس أمانة الشباب)',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'mostaqbal_shabab_complaints_v1';
const LOCAL_STORAGE_TIMELINE_KEY = 'mostaqbal_shabab_timeline_v1';

function getLocalComplaints(): Complaint[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_COMPLAINTS;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
    return INITIAL_DEMO_COMPLAINTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_DEMO_COMPLAINTS;
  }
}

function saveLocalComplaints(complaints: Complaint[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(complaints));
  }
}

function getLocalTimeline(): ComplaintTimeline[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_TIMELINE;
  const stored = localStorage.getItem(LOCAL_STORAGE_TIMELINE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_TIMELINE_KEY, JSON.stringify(INITIAL_DEMO_TIMELINE));
    return INITIAL_DEMO_TIMELINE;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_DEMO_TIMELINE;
  }
}

function saveLocalTimeline(timeline: ComplaintTimeline[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_TIMELINE_KEY, JSON.stringify(timeline));
  }
}

// --------------------------------------------------------------------------
// واجهة التعامل مع الشكاوى الموحدة
// --------------------------------------------------------------------------

export const complaintsService = {
  /**
   * جلب الشكاوى المسموح بها للمستخدم الحالي.
   * سياسات RLS تحدد النطاق: المشرف العام يرى الكل،
   * والمواطن يرى طلباته فقط.
   */
  async getAll(): Promise<Complaint[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // فشل مغلق: لا نعود إلى بيانات محلية قد تسرب معلومات.
        console.error('Supabase fetch failed:', error.message);
        return [];
      }

      return (data || []) as Complaint[];
    }
    return getLocalComplaints();
  },

  /**
   * جلب شكوى بالمعرف الداخلي (للمشرفين/الطباعة فقط، وفق RLS).
   */
  async getById(id: string): Promise<Complaint | null> {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (error || !data) return null;
      return data as Complaint;
    }

    const all = getLocalComplaints();
    return (
      all.find(
        (c) =>
          c.id === cleanId ||
          c.tracking_code.toUpperCase() === cleanId.toUpperCase()
      ) || null
    );
  },

  /**
   * استعلام عام آمن: يتطلب رقم الهاتف دائماً + كود التتبع أو الرقم القومي.
   * جدول الشكاوى غير قابل للقراءة العامة، لذا يتم الاستعلام عبر RPC آمن.
   */
  async track(query: {
    code?: string;
    phone: string;
    nationalId?: string;
  }): Promise<Complaint[]> {
    const code = query.code?.trim().toUpperCase() || null;
    const phone = query.phone?.trim() || '';
    const nationalId = query.nationalId?.trim() || null;

    if (!phone || (!code && !nationalId)) return [];

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('track_complaints', {
        p_code: code,
        p_phone: phone,
        p_national_id: nationalId,
      });

      if (error) {
        console.error('Tracking lookup failed:', error.message);
        return [];
      }

      // القيمة الراجعة JSONB محجوبة الحقول الحساسة (admin_notes / citizen_id).
      return (data || []) as unknown as Complaint[];
    }

    const all = getLocalComplaints();
    return all.filter((c) => {
      if (c.primary_phone !== phone) return false;
      if (code && c.tracking_code.toUpperCase() === code) return true;
      if (nationalId && c.national_id === nationalId) return true;
      return false;
    });
  },

  /**
   * البحث عن شكوى بكود التتبع (لفريق العمل فقط ضمن RLS).
   * لا يُستخدم للاستعلام العام؛ استخدم track() مع الهاتف.
   */
  async getByTrackingCode(code: string): Promise<Complaint | null> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .ilike('tracking_code', cleanCode)
        .maybeSingle();

      if (error || !data) return null;
      return data as Complaint;
    }

    const all = getLocalComplaints();
    return all.find((c) => c.tracking_code.toUpperCase() === cleanCode) || null;
  },

  /**
   * إنشاء شكوى جديدة.
   *
   * في وضع Supabase يتم التقديم عبر RPC `submit_complaint` (SECURITY DEFINER):
   * - يضبط citizen_id من الجلسة (لا يمكن انتحال حساب مواطن آخر).
   * - يفرض status='new' و admin_notes/public_response = NULL.
   * - يولّد كود التتبع على الخادم من تسلسل مضمون عدم التكرار.
   * - يعيد الصف كاملاً رغم عدم وجود سياسة قراءة عامة على الجدول.
   */
  async create(payload: Omit<Complaint, 'id' | 'tracking_code' | 'created_at' | 'updated_at'>): Promise<Complaint> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('submit_complaint', {
        p_citizen_name: payload.citizen_name,
        p_national_id: payload.national_id,
        p_primary_phone: payload.primary_phone,
        p_title: payload.title,
        p_description: payload.description,
        p_alt_contacts: payload.alt_contacts ?? [],
        p_committee_id: payload.committee_id ?? 'youth',
        p_committee_name: payload.committee_name ?? 'أمانة الشباب',
        p_is_confidential: Boolean(payload.is_confidential),
        p_location_lat: payload.location_lat ?? null,
        p_location_lng: payload.location_lng ?? null,
        p_location_address: payload.location_address ?? null,
        p_attachments: payload.attachments ?? [],
      });

      if (error || !data) {
        // لا نحفظ محلياً عندما يكون Supabase مهيأً: قد يؤدي ذلك إلى إيهام
        // المواطن بأن الطلب مسجل بينما لم يصل للمنظومة.
        throw new Error(
          error?.message ||
            'تعذر حفظ الطلب في قاعدة البيانات. يرجى المحاولة مرة أخرى.'
        );
      }

      // السجل الزمني الأولي يُضاف تلقائياً بواسطة trigger في قاعدة البيانات.
      return data as Complaint;
    }

    const all = getLocalComplaints();
    const todaySequence = all.filter((c) => {
      const todayStr = new Date().toISOString().split('T')[0];
      return c.created_at.startsWith(todayStr);
    }).length + 1;

    const trackingCode = generateTrackingCode(todaySequence);
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cmp-${Date.now()}`;
    const now = new Date().toISOString();

    const newComplaint: Complaint = {
      committee_id: 'youth',
      committee_name: 'أمانة الشباب',
      ...payload,
      id: newId,
      tracking_code: trackingCode,
      created_at: now,
      updated_at: now,
    };

    // حفظ محلي
    const updated = [newComplaint, ...all];
    saveLocalComplaints(updated);

    // إضافة حدث السجل الزمني محلياً
    const timeline = getLocalTimeline();
    timeline.push({
      id: `t-${Date.now()}`,
      complaint_id: newId,
      status: 'new',
      note: 'تم تقديم الشكوى بنجاح عبر المنظومة الإلكترونية.',
      actor_name: 'المنظومة الإلكترونية',
      created_at: now,
    });
    saveLocalTimeline(timeline);

    return newComplaint;
  },

  /**
   * تحديث حالة الشكوى وإضافة ملاحظة للسجل الزمني.
   *
   * `note` ملاحظة داخلية لا تظهر للمواطن. لنشر رد رسمي للمواطن يجب تمرير
   * `publicResponse` صراحةً وبموافقة الموظف (خانة "نشر الرد للمواطن").
   */
  async updateStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    note?: string,
    actorName: string = 'مسؤول أمانة الشباب',
    publicResponse?: string
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const publishedResponse = publicResponse?.trim() || undefined;
    const timelineNote =
      publishedResponse ||
      `تم تحديث حالة الطلب إلى: ${STATUS_META[newStatus]?.label || newStatus}`;

    if (isSupabaseConfigured && supabase) {
      const { error: updateError } = await supabase
        .from('complaints')
        .update({
          status: newStatus,
          admin_notes: note || undefined,
          public_response: publishedResponse,
          updated_at: now,
        })
        .eq('id', complaintId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // السجل الزمني عام: لا نكتب فيه الملاحظات الداخلية إطلاقاً.
      await supabase.from('complaint_timeline').insert([{
        complaint_id: complaintId,
        status: newStatus,
        note: timelineNote,
        actor_name: actorName,
        is_public: true,
      }]);
      return true;
    }

    // تحديث محلي
    const all = getLocalComplaints();
    const index = all.findIndex((c) => c.id === complaintId);
    if (index !== -1) {
      all[index].status = newStatus;
      if (note) all[index].admin_notes = note;
      if (publishedResponse) all[index].public_response = publishedResponse;
      all[index].updated_at = now;
      saveLocalComplaints(all);

      const timeline = getLocalTimeline();
      timeline.push({
        id: `t-${Date.now()}`,
        complaint_id: complaintId,
        status: newStatus,
        note: timelineNote,
        actor_name: actorName,
        created_at: now,
      });
      saveLocalTimeline(timeline);
      return true;
    }

    return false;
  },

  /**
   * جلب السجل الزمني لشكوى معينة.
   * للاستعلام العام يجب تمرير رقم الهاتف ليتم التحقق منه داخل RPC آمن.
   * لفريق العمل/صاحب الطلب المسجل يمكن الاستعلام مباشرة وفق RLS.
   */
  async getTimeline(
    complaintId: string,
    phone?: string
  ): Promise<ComplaintTimeline[]> {
    if (isSupabaseConfigured && supabase) {
      if (phone) {
        const { data, error } = await supabase.rpc('track_complaint_timeline', {
          p_complaint_id: complaintId,
          p_phone: phone.trim(),
        });

        if (error) {
          console.error('Timeline lookup failed:', error.message);
          return [];
        }
        return (data || []) as ComplaintTimeline[];
      }

      const { data, error } = await supabase
        .from('complaint_timeline')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      if (error) return [];
      return (data || []) as ComplaintTimeline[];
    }

    const timeline = getLocalTimeline();
    return timeline
      .filter((t) => t.complaint_id === complaintId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
};
