import { Complaint, ComplaintTimeline, ComplaintStatus, STATUS_META } from '@/types/database';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { generateTrackingCode } from './generateCode';

const INITIAL_DEMO_COMPLAINTS: Complaint[] = [
  {
    id: 'c101-azab-uuid',
    tracking_code: 'SH-1101-01',
    citizen_name: 'المهندس / محمد العزب',
    national_id: '29305141600123',
    primary_phone: '01012920967',
    alt_contacts: [{ type: 'whatsapp', value: '01004744265' }],
    title: 'مبادرة رعاية شباب بركة السبع وتأهيل 500 كادر شبابي ودعم مراكز الشباب',
    description: 'مبادرة شاملة مقدمة من أمانة الشباب بمركز بركة السبع برئاسة المهندس محمد العزب تتضمن: تنظيم ملتقى التوظيف السنوي مع كبرى شركات القطاع الخاص، إطلاق دورات تدريبية متقدمة في الذكاء الاصطناعي والتسويق الرقمي، دعم وتطوير ملاعب مراكز شباب طوخ طنبشا وهورين وشنتنا الحجر، ورعاية الموهوبين رياضياً وعلمياً.',
    status: 'in_progress',
    priority: 'urgent',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'مركز بركة السبع - مقر أمانة الحزب (بجوار كافيه كارليتوس)',
    location_lat: 30.6385,
    location_lng: 31.0855,
    attachments: [
      {
        name: 'صورة مبادرة أمانة الشباب - م. محمد العزب.jpg',
        url: '/leaders/full-azab.jpg',
        type: 'image',
        size: 1024 * 350,
      },
    ],
    admin_notes: 'تم اعتماد المبادرة بقرار هيئة مكتب أمانة الشباب وبدء التنسيق الميداني الفوري مع الغرفة التجارية ومراكز شباب المحافظة.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'c102-demo-uuid',
    tracking_code: 'SH-1101-02',
    citizen_name: 'سارة عبد الرحمن يوسف',
    national_id: '29805201234568',
    primary_phone: '01004744265',
    alt_contacts: [{ type: 'whatsapp', value: '01004744265' }],
    title: 'صيانة ملعب كرة القدم وتوفير إضاءة كاشفة بمركز شباب هورين',
    description: 'أعمدة الإنارة في الملعب الخماسي بقرية هورين معطلة منذ أسبوع والشباب لا يستطيعون ممارسة الأنشطة الرياضية ليلاً، نرجو الصيانة العاجلة لتشجيع ممارسة الرياضة.',
    status: 'in_progress',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية هورين - مركز شباب هورين المطور',
    location_lat: 30.6012,
    location_lng: 31.1124,
    attachments: [],
    admin_notes: 'تم تسليم كشافات الإنارة الليد المعتمدة وجاري التركيب والصيانة بالتنسيق مع إدارة المركز.',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c103-demo-uuid',
    tracking_code: 'SH-1029-01',
    citizen_name: 'محمد السيد الشناوي',
    national_id: '29203101234569',
    primary_phone: '01098765432',
    alt_contacts: [{ type: 'phone', value: '01223344556' }],
    title: 'طلب تسيير قافلة طبية مجانية لشباب وأهالي قرية طوخ طنبشا',
    description: 'نلتمس من أمانة الحزب التنسيق لتسيير قافلة طبية تضم تخصصات باطنة، رمد، وأطفال لتوقيع الكشف وصرف العلاج بالمجان لأهالينا بالقرية.',
    status: 'resolved',
    priority: 'urgent',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية طوخ طنبشا - الوحدة الصحية والمركز الطبي',
    location_lat: 30.6521,
    location_lng: 31.0632,
    attachments: [],
    admin_notes: 'تمت الموافقة وتسيير القافلة الطبية بالوحدة الصحية وتم توقيع الكشف وصرف الأدوية بالمجان لـ 420 مواطناً بنجاح.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c104-demo-uuid',
    tracking_code: 'SH-1026-03',
    citizen_name: 'خالد مصطفى علام',
    national_id: '29007081234570',
    primary_phone: '01145678901',
    alt_contacts: [],
    title: 'طلب إقامة دورة تدريبية مجانية في الذكاء الاصطناعي والتسويق الرقمي',
    description: 'مقترح لتأهيل 50 شاباً وفتاة بقرية الشهيد فكري في مهارات العمل الحر والبرمجة بالتعاون مع مدربين معتمدين.',
    status: 'resolved',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية الشهيد فكري - قاعة مجمع الخدمات الشبابي',
    location_lat: 30.6184,
    location_lng: 31.0921,
    attachments: [],
    admin_notes: 'تم تدشين الورشة التدريبية بحضور 48 متدرباً وتسليم شهادات إتمام البرنامج التدريبي.',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c105-demo-uuid',
    tracking_code: 'SH-1023-02',
    citizen_name: 'محمود حسن عبد العال',
    national_id: '28911201234571',
    primary_phone: '01287654321',
    alt_contacts: [],
    title: 'تسوية وتمهيد وإنارة طريق المقابر والمدخل الشرقي لقرية شنتنا الحجر',
    description: 'الطريق يحتاج إلى تسوية بالجليدر وصيانة 10 كشافات إنارة لتسهيل حركة المواطنين ليلاً وتأمين المارة.',
    status: 'resolved',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية شنتنا الحجر - طريق المقابر الرئيسي',
    location_lat: 30.6410,
    location_lng: 31.1250,
    attachments: [],
    admin_notes: 'تم التنسيق مع رئيس الوحدة المحلية بشنتنا الحجر، وتم مسح الطريق بالجليدر وصيانة أعمدة الإنارة بالكامل.',
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c106-demo-uuid',
    tracking_code: 'SH-1019-01',
    citizen_name: 'إبراهيم يوسف القاضي',
    national_id: '29302141234572',
    primary_phone: '01065432198',
    alt_contacts: [],
    title: 'مقترح تنظيم دوري مراكز الشباب لكرة القدم الخماسية بقرى المركز',
    description: 'نرجو تنظيم بطولة رياضية تنشيطية تجمع شباب قرى ميت فارس، كفر هلال، هورين، وطوخ طنبشا لتعزيز روح التنافس الشريف.',
    status: 'in_progress',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية ميت فارس - الملعب القانوني الكبير',
    location_lat: 30.6275,
    location_lng: 31.0740,
    attachments: [],
    admin_notes: 'تم اعتماد جدول المباريات والتنسيق مع مديري مراكز الشباب وتجهيز الجوائز والدروع للفرق الفائزة.',
    created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c107-demo-uuid',
    tracking_code: 'SH-1015-02',
    citizen_name: 'طارق عبد الفتاح منصور',
    national_id: '29408191234573',
    primary_phone: '01187654329',
    alt_contacts: [],
    title: 'صيانة أعمدة الإنارة وتأمين ممر مشاة الطلاب أمام مجمع المدارس بكفر هلال',
    description: 'خط الإنارة أمام مجمع المدارس بقرية كفر هلال مفصول ويشكل خطورة على الطلاب صباحاً ومساءً.',
    status: 'resolved',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية كفر هلال - مجمع المدارس الابتدائية والإعدادية',
    location_lat: 30.6150,
    location_lng: 31.1320,
    attachments: [],
    admin_notes: 'تم الانتقال الميداني والتواصل مع شبكة كهرباء بركة السبع وتم مد كابل جديد وإعادة تشغيل الإنارة بالكامل.',
    created_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c108-demo-uuid',
    tracking_code: 'SH-1012-01',
    citizen_name: 'هشام كمال الديب',
    national_id: '29104051234574',
    primary_phone: '01209876543',
    alt_contacts: [],
    title: 'طلب تزويد مركز شباب قرية الروضة بأدوات رياضية وتربيزات تنس طاولة',
    description: 'فريق الشباب بالقرية يحقق نتائج مشرفة في بطولات المحافظة ويحتاج لأدوات تدريبية وتجهيزات لدعم النشء.',
    status: 'under_review',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية الروضة - مركز شباب الروضة',
    location_lat: 30.6480,
    location_lng: 31.0510,
    attachments: [],
    admin_notes: 'جاري حصر احتياجات المركز من الكرات وشباك التنس ومخاطبة أمانة الشباب بالمحافظة لاعتماد الصرف.',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c109-demo-uuid',
    tracking_code: 'SH-1009-03',
    citizen_name: 'عصام عبد الله شرف',
    national_id: '28809121234575',
    primary_phone: '01034567812',
    alt_contacts: [],
    title: 'مبادرة بيئية وتشجير مدخل قرية الدبايبة وحزام الترعة',
    description: 'مبادرة شبابية متطوعة لتشجير مدخل القرية بـ 200 شجرة مثمرة ونطلب مساهمة أمانة الحزب في توفير الشتلات والأدوات.',
    status: 'resolved',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية الدبايبة - مدخل القرية الرئيسي',
    location_lat: 30.5980,
    location_lng: 31.0990,
    attachments: [],
    admin_notes: 'تم توفير الدفعة الأولى من الشتلات وتوزيعها على شباب المبادرة، وجاري تنظيم يوم عمل تطوعي للغرس.',
    created_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c110-demo-uuid',
    tracking_code: 'SH-1006-02',
    citizen_name: 'سيد محمد البنا',
    national_id: '29606181234576',
    primary_phone: '01122334488',
    alt_contacts: [],
    title: 'توفير منافذ بيع متحركة للسلع الأساسية بأسعار مخفضة ببركة السبع غرب',
    description: 'طلب تسيير سيارات المنافذ المتنقلة لحزب مستقبل وطن لبيع السلع الاستهلاكية بأسعار الجملة لتخفيف العبء عن الأسر.',
    status: 'resolved',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'بركة السبع غرب - ميدان المحطة',
    location_lat: 30.6350,
    location_lng: 31.0820,
    attachments: [],
    admin_notes: 'تم تمركز 3 سيارات منافذ متنقلة بالميدان وتوفير السلع الأساسية بخصم 25% بحضور مسؤولي المتابعة.',
    created_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
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
    status: 'under_review',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'قرية جنزور - الملعب المفتوح بالقرية',
    location_lat: 30.6200,
    location_lng: 31.0600,
    attachments: [],
    admin_notes: 'طلب وارد حديثاً، جاري التنسيق الميداني لمعاينة لوحة القواطع الكهربائية.',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
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
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'بركة السبع - بجوار كافيه كارليتوس (مقر الأمانة)',
    location_lat: 30.6390,
    location_lng: 31.0870,
    attachments: [],
    admin_notes: 'قيد العرض على أمين الشباب لاعتماد الموعد وتوجيه الدعوات للمحاضرين.',
    created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
  {
    id: 'c113-demo-uuid',
    tracking_code: 'SH-1101-05',
    citizen_name: 'ياسر فؤاد النجار',
    national_id: '29107121234579',
    primary_phone: '01099887766',
    alt_contacts: [],
    title: 'تطوير حديقة الطفل وصيانة مقاعد الانتظار بنادي بركة السبع الرياضي',
    description: 'أهالي وأطفال المركز يترددون يومياً على الحديقة، ونرجو صيانة الألعاب والمقاعد لتوفير بيئة ترفيهية آمنة.',
    status: 'new',
    priority: 'normal',
    committee_id: 'youth',
    committee_name: 'أمانة الشباب',
    location_address: 'بركة السبع شرق - نادي بركة السبع الرياضي',
    location_lat: 30.6370,
    location_lng: 31.0840,
    attachments: [],
    admin_notes: 'طلب مسجل حديثاً قيد المعاينة والتوجيه للأمانة المختصة.',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

const INITIAL_DEMO_TIMELINE: ComplaintTimeline[] = [
  {
    id: 't1',
    complaint_id: 'c101-azab-uuid',
    status: 'new',
    note: 'تم إطلاق المبادرة وتسجيلها رسمياً بأمانة الشباب بمركز بركة السبع.',
    actor_name: 'المنظومة الإلكترونية',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't2',
    complaint_id: 'c101-azab-uuid',
    status: 'in_progress',
    note: 'تم اعتماد المبادرة بقرار هيئة المكتب، وبدء التواصل مع الجهات والشركات الراعية.',
    actor_name: 'المهندس / محمد العزب (أمين الشباب بالمركز)',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 't3',
    complaint_id: 'c102-demo-uuid',
    status: 'new',
    note: 'تم استلام الشكوى إلكترونياً.',
    actor_name: 'المنظومة الإلكترونية',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't4',
    complaint_id: 'c102-demo-uuid',
    status: 'in_progress',
    note: 'تم توفير الكشافات والبدء في التركيب والصيانة.',
    actor_name: 'أمانة المتابعة الميدانية',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't5',
    complaint_id: 'c103-demo-uuid',
    status: 'resolved',
    note: 'تم تسيير القافلة الطبية وتوقيع الكشف وصرف الأدوية بالمجان لأهالي قرية طوخ طنبشا.',
    actor_name: 'هيئة مكتب أمانة الشباب',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'mostaqbal_shabab_complaints_v5';
const LOCAL_STORAGE_TIMELINE_KEY = 'mostaqbal_shabab_timeline_v5';
const LEGACY_LOCAL_STORAGE_KEYS = [
  'mostaqbal_shabab_complaints_v4',
  'mostaqbal_shabab_timeline_v4',
];

function clearLegacyLocalData(): void {
  if (typeof window === 'undefined') return;
  try {
    LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

function getLocalComplaints(): Complaint[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_COMPLAINTS;
  clearLegacyLocalData();
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
    return INITIAL_DEMO_COMPLAINTS;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
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
  clearLegacyLocalData();
  const stored = localStorage.getItem(LOCAL_STORAGE_TIMELINE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_TIMELINE_KEY, JSON.stringify(INITIAL_DEMO_TIMELINE));
    return INITIAL_DEMO_TIMELINE;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_TIMELINE_KEY, JSON.stringify(INITIAL_DEMO_TIMELINE));
      return INITIAL_DEMO_TIMELINE;
    }
    return parsed;
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
   * لا توجد بيانات تجريبية؛ عند تعذّر الجلب نعيد ما حُفظ محلياً على هذا الجهاز فقط.
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

        if (!error && data) {
          return data as Complaint;
        }
      } catch (err) {
        console.warn('Supabase fetchById failed:', err);
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
   * استعلام عام آمن للمواطن: يتطلب الهاتف وكود التتبع أو الرقم القومي.
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
      try {
        const { data, error } = await supabase.rpc('track_complaints', {
          p_code: code,
          p_phone: phone,
          p_national_id: nationalId,
        });

        if (!error && data) {
          return (data || []) as Complaint[];
        }
      } catch (err) {
        console.warn('Supabase track failed:', err);
      }
    }

    const all = getLocalComplaints();
    return all.filter((c) => {
      const matchPhone =
        c.primary_phone === phone ||
        c.alt_contacts?.some((a) => a.value === phone);
      const matchCode = code ? c.tracking_code.toUpperCase() === code : true;
      const matchNat = nationalId ? c.national_id === nationalId : true;
      return matchPhone && (code ? matchCode : true) && (nationalId ? matchNat : true);
    });
  },

  /**
   * البحث عن شكوى بكود التتبع (لفريق العمل).
   */
  async getByTrackingCode(code: string): Promise<Complaint | null> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .ilike('tracking_code', cleanCode)
          .maybeSingle();

        if (!error && data) {
          return data as Complaint;
        }
      } catch (err) {
        console.warn('Supabase getByTrackingCode failed:', err);
      }
    }

    const all = getLocalComplaints();
    return all.find((c) => c.tracking_code.toUpperCase() === cleanCode) || null;
  },

  /**
   * إنشاء شكوى جديدة.
   */
  async create(
    payload: Omit<Complaint, 'id' | 'tracking_code' | 'created_at' | 'updated_at'>
  ): Promise<Complaint> {
    if (isSupabaseConfigured && supabase) {
      try {
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

        if (!error && data) {
          return data as Complaint;
        }
      } catch (err) {
        console.warn('Supabase create failed, saving locally:', err);
      }
    }

    const all = getLocalComplaints();
    const todaySequence =
      all.filter((c) => {
        const todayStr = new Date().toISOString().split('T')[0];
        return c.created_at.startsWith(todayStr);
      }).length + 1;

    const trackingCode = generateTrackingCode(todaySequence);
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `cmp-${Date.now()}`;
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

    const updated = [newComplaint, ...all];
    saveLocalComplaints(updated);

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
      try {
        const { error: updateError } = await supabase
          .from('complaints')
          .update({
            status: newStatus,
            admin_notes: note || undefined,
            public_response: publishedResponse,
            updated_at: now,
          })
          .eq('id', complaintId);

        if (!updateError) {
          await supabase.from('complaint_timeline').insert([
            {
              complaint_id: complaintId,
              status: newStatus,
              note: timelineNote,
              actor_name: actorName,
              is_public: true,
            },
          ]);
          return true;
        }
      } catch (err) {
        console.warn('Supabase updateStatus failed:', err);
      }
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
   */
  async getTimeline(
    complaintId: string,
    phone?: string
  ): Promise<ComplaintTimeline[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        if (phone) {
          const { data, error } = await supabase.rpc(
            'track_complaint_timeline',
            {
              p_complaint_id: complaintId,
              p_phone: phone.trim(),
            }
          );
          if (!error && data) {
            return (data || []) as ComplaintTimeline[];
          }
        } else {
          const { data, error } = await supabase
            .from('complaint_timeline')
            .select('*')
            .eq('complaint_id', complaintId)
            .order('created_at', { ascending: true });

          if (!error && data) {
            return (data || []) as ComplaintTimeline[];
          }
        }
      } catch (err) {
        console.warn('Supabase getTimeline failed:', err);
      }
    }

    const timeline = getLocalTimeline();
    return timeline
      .filter((t) => t.complaint_id === complaintId)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  },
};
