import { Complaint, ComplaintTimeline, ComplaintStatus, STATUS_META } from '@/types/database';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { generateTrackingCode } from './generateCode';

// بيانات تجريبية أولية واقعية وشاملة لمركز بركة السبع وقراها
const INITIAL_DEMO_COMPLAINTS: Complaint[] = [
  {
    id: 'c101-demo-uuid',
    tracking_code: 'SH-1101-01',
    citizen_name: 'أحمد محمود إبراهيم',
    national_id: '29510151234567',
    primary_phone: '01012920967',
    alt_contacts: [{ type: 'whatsapp', value: '01012920967' }],
    title: 'طلب دعم وتجهيز ملتقى توظيف شباب الخريجين ببركة السبع',
    description: 'نرجو من أمانة الشباب بمركز بركة السبع التنسيق لتنظيم ملتقى توظيف مصغر بالتعاون مع شركات القطاع الخاص لتوفير فرص عمل لشباب الدائرة وتأهيلهم لسوق العمل.',
    status: 'under_review',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'بركة السبع شرق - الصالة المغطاة بنادي الشباب',
    location_lat: 30.6385,
    location_lng: 31.0855,
    attachments: [],
    admin_notes: 'تم إحالة الموضوع للأمين المساعد للتنسيق مع الغرفة التجارية لتوفير 150 فرصة عمل حقيقية.',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'c102-demo-uuid',
    tracking_code: 'SH-1101-02',
    citizen_name: 'سارة عبد الرحمن يوسف',
    national_id: '29805201234568',
    primary_phone: '01004744265',
    alt_contacts: [
      { type: 'whatsapp', value: '01004744265' }
    ],
    title: 'صيانة ملعب كرة القدم وتوفير إضاءة كاشفة بمركز شباب هورين',
    description: 'أعمدة الإنارة في الملعب الخماسي بقرية هورين معطلة منذ أسبوع والشباب لا يستطيعون ممارسة الأنشطة الرياضية ليلاً، نرجو الصيانة العاجلة لتشجيع ممارسة الرياضة.',
    status: 'in_progress',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية هورين - مركز شباب هورين المطور',
    location_lat: 30.6012,
    location_lng: 31.1124,
    attachments: [],
    admin_notes: 'تم تسليم كشافات الإنارة الليد المعتمدة وجاري التركيب والصيانة اليوم بالتنسيق مع إدارة المركز.',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c103-demo-uuid',
    tracking_code: 'SH-1031-01',
    citizen_name: 'محمد السيد الشناوي',
    national_id: '29203101234569',
    primary_phone: '01098765432',
    alt_contacts: [{ type: 'phone', value: '01223344556' }],
    title: 'طلب تسيير قافلة طبية مجانية لشباب وأهالي قرية طوخ طنبشا',
    description: 'نلتمس من أمانة الحزب التنسيق لتسيير قافلة طبية تضم تخصصات باطنة، رمد، وأطفال لتوقيع الكشف وصرف العلاج بالمجان لأهالينا بالقرية.',
    status: 'resolved',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية طوخ طنبشا - الوحدة الصحية والمركز الطبي',
    location_lat: 30.6521,
    location_lng: 31.0632,
    attachments: [],
    admin_notes: 'تمت الموافقة وتسيير القافلة الطبية بالوحدة الصحية وتم توقيع الكشف وصرف الأدوية بالمجان لـ 420 مواطناً بنجاح.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c104-demo-uuid',
    tracking_code: 'SH-1030-03',
    citizen_name: 'خالد مصطفى علام',
    national_id: '29007081234570',
    primary_phone: '01145678901',
    alt_contacts: [],
    title: 'طلب إقامة دورة تدريبية مجانية في الذكاء الاصطناعي والتسويق الرقمي',
    description: 'مقترح لتأهيل 50 شاباً وفتاة بقرية الشهيد فكري في مهارات العمل الحر والبرمجة بالتعاون مع مدربين معتمدين.',
    status: 'resolved',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية الشهيد فكري - قاعة مجمع الخدمات الشبابي',
    location_lat: 30.6184,
    location_lng: 31.0921,
    attachments: [],
    admin_notes: 'تم تدشين الورشة التدريبية بحضور 48 متدرباً وتسليم شهادات إتمام البرنامج التدريبي.',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c105-demo-uuid',
    tracking_code: 'SH-1029-02',
    citizen_name: 'محمود حسن عبد العال',
    national_id: '28911201234571',
    primary_phone: '01287654321',
    alt_contacts: [],
    title: 'تسوية وتمهيد وإنارة طريق المقابر والمدخل الشرقي لقرية شنتنا الحجر',
    description: 'الطريق يحتاج إلى تسوية بالجليدر وصيانة 10 كشافات إنارة لتسهيل حركة المواطنين ليلاً وتأمين المارة.',
    status: 'resolved',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية شنتنا الحجر - طريق المقابر الرئيسي',
    location_lat: 30.6410,
    location_lng: 31.1250,
    attachments: [],
    admin_notes: 'تم التنسيق مع رئيس الوحدة المحلية بشنتنا الحجر، وتم مسح الطريق بالجليدر وصيانة أعمدة الإنارة بالكامل.',
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c106-demo-uuid',
    tracking_code: 'SH-1028-01',
    citizen_name: 'إبراهيم يوسف القاضي',
    national_id: '29302141234572',
    primary_phone: '01065432198',
    alt_contacts: [],
    title: 'مقترح تنظيم دوري مراكز الشباب لكرة القدم الخماسية بقرى المركز',
    description: 'نرجو تنظيم بطولة رياضية تنشيطية تجمع شباب قرى ميت فارس، كفر هلال، هورين، وطوخ طنبشا لتعزيز روح التنافس الشريف.',
    status: 'in_progress',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية ميت فارس - الملعب القانوني الكبير',
    location_lat: 30.6275,
    location_lng: 31.0740,
    attachments: [],
    admin_notes: 'تم اعتماد جدول المباريات والتنسيق مع مديري مراكز الشباب وتجهيز الجوائز والدروع للفرق الفائزة.',
    created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c107-demo-uuid',
    tracking_code: 'SH-1027-02',
    citizen_name: 'طارق عبد الفتاح منصور',
    national_id: '29408191234573',
    primary_phone: '01187654329',
    alt_contacts: [],
    title: 'صيانة أعمدة الإنارة وتأمين ممر مشاة الطلاب أمام مجمع المدارس بكفر هلال',
    description: 'خط الإنارة أمام مجمع المدارس بقرية كفر هلال مفصول ويشكل خطورة على الطلاب صباحاً ومساءً.',
    status: 'resolved',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية كفر هلال - مجمع المدارس الابتدائية والإعدادية',
    location_lat: 30.6150,
    location_lng: 31.1320,
    attachments: [],
    admin_notes: 'تم الانتقال الميداني والتواصل مع شبكة كهرباء بركة السبع وتم مد كابل جديد وإعادة تشغيل الإنارة بالكامل.',
    created_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c108-demo-uuid',
    tracking_code: 'SH-1026-01',
    citizen_name: 'هشام كمال الديب',
    national_id: '29104051234574',
    primary_phone: '01209876543',
    alt_contacts: [],
    title: 'طلب تزويد مركز شباب قرية الروضة بأدوات رياضية وتربيزات تنس طاولة',
    description: 'فريق الشباب بالقرية يحقق نتائج مشرفة في بطولات المحافظة ويحتاج لأدوات تدريبية وتجهيزات لدعم النشء.',
    status: 'under_review',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية الروضة - مركز شباب الروضة',
    location_lat: 30.6480,
    location_lng: 31.0510,
    attachments: [],
    admin_notes: 'جاري حصر احتياجات المركز من الكرات وشباك التنس ومخاطبة أمانة الشباب بالمحافظة لاعتماد الصرف.',
    created_at: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c109-demo-uuid',
    tracking_code: 'SH-1025-03',
    citizen_name: 'عصام عبد الله شرف',
    national_id: '28809121234575',
    primary_phone: '01034567812',
    alt_contacts: [],
    title: 'مبادرة بيئية وتشجير مدخل قرية الدبايبة وحزام الترعة',
    description: 'مبادرة شبابية متطوعة لتشجير مدخل القرية بـ 200 شجرة مثمرة ونطلب مساهمة أمانة الحزب في توفير الشتلات والأدوات.',
    status: 'in_progress',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية الدبايبة - مدخل القرية الرئيسي',
    location_lat: 30.5980,
    location_lng: 31.0990,
    attachments: [],
    admin_notes: 'تم توفير الدفعة الأولى من الشتلات وتوزيعها على شباب المبادرة، وجاري تنظيم يوم عمل تطوعي للغرس.',
    created_at: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c110-demo-uuid',
    tracking_code: 'SH-1024-02',
    citizen_name: 'سيد محمد البنا',
    national_id: '29606181234576',
    primary_phone: '01122334488',
    alt_contacts: [],
    title: 'توفير منافذ بيع متحركة للسلع الأساسية بأسعار مخفضة ببركة السبع غرب',
    description: 'طلب تسيير سيارات المنافذ المتنقلة لحزب مستقبل وطن لبيع السلع الاستهلاكية بأسعار الجملة لتخفيف العبء عن الأسر.',
    status: 'resolved',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'بركة السبع غرب - ميدان المحطة',
    location_lat: 30.6350,
    location_lng: 31.0820,
    attachments: [],
    admin_notes: 'تم تمركز 3 سيارات منافذ متنقلة بالميدان وتوفير السلع الأساسية بخصم 25% بحضور مسؤولي المتابعة.',
    created_at: new Date(Date.now() - 192 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c111-demo-uuid',
    tracking_code: 'SH-1101-03',
    citizen_name: 'رامي فتحي الصاوي',
    national_id: '29712011234577',
    primary_phone: '01211223344',
    alt_contacts: [],
    title: 'صيانة كابل الكهرباء المغذي للملعب المفتوح وتغيير القواطع بقرية جنزور',
    description: 'انقطاع التيار المتكرر عن كشافات الملعب الترابي بقرية جنزور يمنع إقامة الأنشطة الرياضية للشباب.',
    status: 'new',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية جنزور - الملعب المفتوح',
    location_lat: 30.6200,
    location_lng: 31.0600,
    attachments: [],
    admin_notes: 'طلب وارد حديثاً، جاري التنسيق الميداني لمعاينة لوحة القواطع الكهربائية.',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c112-demo-uuid',
    tracking_code: 'SH-1101-04',
    citizen_name: 'كريم ممدوح شلبي',
    national_id: '29903151234578',
    primary_phone: '01055667788',
    alt_contacts: [],
    title: 'مقترح تنظيم ندوة توعوية لمناهضة الإدمان وحماية النشء والشباب',
    description: 'مبادرة بالتعاون مع صندوق مكافحة وعلاج الإدمان لعقد ندوة تثقيفية موسعة لشباب وطلاب المركز بمقر الأمانة.',
    status: 'new',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'بركة السبع - بجوار كافيه كارليتوس (مقر الأمانة)',
    location_lat: 30.6390,
    location_lng: 31.0870,
    attachments: [],
    admin_notes: 'قيد العرض على أمين الشباب لاعتماد الموعد وتوجيه الدعوات للمحاضرين.',
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
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
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length < INITIAL_DEMO_COMPLAINTS.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
      return INITIAL_DEMO_COMPLAINTS;
    }
    return parsed;
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
   * في حال عدم توفر بيانات عن بُعد، يتم تقديم البيانات النموذجية الشاملة لمركز بركة السبع.
   */
  async getAll(): Promise<Complaint[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as Complaint[];
        }
      } catch (err) {
        console.warn('Supabase fetch failed:', err);
      }
    }
    return getLocalComplaints();
  },

  /**
   * جلب شكوى بالمعرف الداخلي (للمشرفين/الطباعة فقط).
   */
  async getById(id: string): Promise<Complaint | null> {
    const cleanId = (id || '').trim();
    if (!cleanId) return null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .eq('id', cleanId)
          .maybeSingle();

        if (!error && data) return data as Complaint;
      } catch (err) {
        console.warn('Supabase getById failed:', err);
      }
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
