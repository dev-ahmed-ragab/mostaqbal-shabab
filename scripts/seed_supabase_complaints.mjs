import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SEED_COMPLAINTS = [
  {
    citizen_name: 'المهندس / محمد العزب',
    national_id: '29305141600123',
    primary_phone: '01012920967',
    alt_contacts: [{ type: 'whatsapp', value: '01004744265' }],
    title: 'مبادرة رعاية شباب بركة السبع وتأهيل 500 كادر شبابي ودعم مراكز الشباب',
    description: 'مبادرة شاملة مقدمة من أمانة الشباب بمركز بركة السبع برئاسة المهندس محمد العزب تتضمن: تنظيم ملتقى التوظيف السنوي مع كبرى شركات القطاع الخاص، إطلاق دورات تدريبية متقدمة في الذكاء الاصطناعي والتسويق الرقمي، دعم وتطوير ملاعب مراكز شباب طوخ طنبشا وهورين وشنتنا الحجر، ورعاية الموهوبين رياضياً وعلمياً.',
    status: 'in_progress',
    priority: 'urgent',
    category: 'توظيف وتأهيل لسوق العمل',
    location_address: 'مركز بركة السبع - مقر أمانة الحزب (بجوار كافيه كارليتوس)',
    location_lat: 30.6385,
    location_lng: 31.0855,
    admin_notes: 'تم اعتماد المبادرة بقرار هيئة مكتب أمانة الشباب وبدء التنسيق الميداني الفوري مع الغرفة التجارية ومراكز شباب المحافظة.',
    public_response: 'تم اعتماد المبادرة وجاري التنسيق لتنظيم الملتقى السنوي للتوظيف وتطوير الملاعب.',
    daysAgo: 2,
    hoursAgo: 4
  },
  {
    citizen_name: 'سارة عبد الرحمن يوسف',
    national_id: '29805201234568',
    primary_phone: '01004744265',
    alt_contacts: [{ type: 'whatsapp', value: '01004744265' }],
    title: 'صيانة ملعب كرة القدم وتوفير إضاءة كاشفة بمركز شباب هورين',
    description: 'أعمدة الإنارة في الملعب الخماسي بقرية هورين معطلة منذ أسبوع والشباب لا يستطيعون ممارسة الأنشطة الرياضية ليلاً، نرجو الصيانة العاجلة لتشجيع ممارسة الرياضة.',
    status: 'in_progress',
    priority: 'normal',
    category: 'صيانة وتجهيز مراكز الشباب',
    location_address: 'قرية هورين - مركز شباب هورين المطور',
    location_lat: 30.6012,
    location_lng: 31.1124,
    admin_notes: 'تم تسليم كشافات الإنارة الليد المعتمدة وجاري التركيب والصيانة بالتنسيق مع إدارة المركز.',
    public_response: 'تم توريد الكشافات البديلة وجاري التركيب بالتنسيق مع مجلس الإدارة.',
    daysAgo: 4,
    hoursAgo: 6
  },
  {
    citizen_name: 'محمد السيد الشناوي',
    national_id: '29203101234569',
    primary_phone: '01098765432',
    alt_contacts: [{ type: 'phone', value: '01223344556' }],
    title: 'طلب تسيير قافلة طبية مجانية لشباب وأهالي قرية طوخ طنبشا',
    description: 'نلتمس من أمانة الحزب التنسيق لتسيير قافلة طبية تضم تخصصات باطنة، رمد، وأطفال لتوقيع الكشف وصرف العلاج بالمجان لأهالينا بالقرية.',
    status: 'resolved',
    priority: 'urgent',
    category: 'مبادرات وطلبات عامة',
    location_address: 'قرية طوخ طنبشا - الوحدة الصحية والمركز الطبي',
    location_lat: 30.6521,
    location_lng: 31.0632,
    admin_notes: 'تمت الموافقة وتسيير القافلة الطبية بالوحدة الصحية وتم توقيع الكشف وصرف الأدوية بالمجان لـ 420 مواطناً بنجاح.',
    public_response: 'تم تنفيذ القافلة الطبية بنجاح وتوفير الأدوية لكافة الحالات المستحقة.',
    daysAgo: 8,
    hoursAgo: 2
  },
  {
    citizen_name: 'خالد مصطفى علام',
    national_id: '29007081234570',
    primary_phone: '01145678901',
    alt_contacts: [],
    title: 'طلب إقامة دورة تدريبية مجانية في الذكاء الاصطناعي والتسويق الرقمي',
    description: 'شباب الخريجين ببركة السبع بحاجة لاكتساب المهارات التكنولوجية الحديثة المطلوبة في سوق العمل والعمل الحر (الفرونت إند، كتابة المحتوى، وإدارة الحملات الإعلانية).',
    status: 'resolved',
    priority: 'normal',
    category: 'دورات تدريبية وتثقيفية',
    location_address: 'بركة السبع غرب - قاعة الحاسب الآلي بنادي المعلمين',
    location_lat: 30.6398,
    location_lng: 31.0821,
    admin_notes: 'تم التنسيق مع معهد تكنولوجيا المعلومات ITI وإطلاق الدورة بحضور 85 متدرباً من شباب المركز.',
    public_response: 'تم إطلاق المعسكر التدريبي بنجاح وتوزيع الشهادات على الخريجين.',
    daysAgo: 14,
    hoursAgo: 5
  },
  {
    citizen_name: 'محمود إبراهيم الشرقاوي',
    national_id: '29712051234571',
    primary_phone: '01234567890',
    alt_contacts: [],
    title: 'توفير أجهزة رياضية وأدوات تدريب بصالة الجيم بمركز شباب الروضة',
    description: 'صالة اللياقة البدنية بالمركز تحتاج إلى تجديد المشايات الكهربائية وأوزان حرة لتأهيل الشباب الممارسين لرياضات القوة وبناء الأجسام.',
    status: 'resolved',
    priority: 'normal',
    category: 'أنشطة وملاعب رياضية',
    location_address: 'قرية الروضة - مركز شباب الروضة',
    location_lat: 30.6150,
    location_lng: 31.0920,
    admin_notes: 'تم توفير الأجهزة الرياضية بدعم من أمانة الشباب وتسليمها لإدارة المركز رسمياً.',
    public_response: 'تم استلام وتجهيز صالة الجيم بأحدث الأدوات الرياضية لخدمة أبناء القرية.',
    daysAgo: 18,
    hoursAgo: 3
  },
  {
    citizen_name: 'أحمد سمير عبد العليم',
    national_id: '29604111234572',
    primary_phone: '01011223344',
    alt_contacts: [],
    title: 'صيانة إنارة مدخل قرية كفر هلال وكشافات الملعب',
    description: 'الطريق المؤدي لمركز الشباب والملعب مظلم ليلاً مما يشكل خطورة على حركة الشباب بعد انتهاء التدريبات.',
    status: 'resolved',
    priority: 'urgent',
    category: 'صيانة وتجهيز مراكز الشباب',
    location_address: 'قرية كفر هلال - طريق مركز الشباب',
    location_lat: 30.6280,
    location_lng: 31.0710,
    admin_notes: 'تم التنسيق الميداني مع شبكة كهرباء بركة السبع وتغيير 14 لمبة ليد وتركيب كشافين على المحول.',
    public_response: 'تمت صيانة وإنارة الطريق والملعب بالكامل.',
    daysAgo: 21,
    hoursAgo: 8
  },
  {
    citizen_name: 'يوسف محمود عثمان',
    national_id: '29408221234573',
    primary_phone: '01099881122',
    alt_contacts: [],
    title: 'تنظيم دوري خماسي كرة قدم لشباب قرى مركز بركة السبع',
    description: 'مقترح لتنظيم بطولة صيفية/تنشيطية تجمع فرق مراكز الشباب بقرى المركز لتعزيز الروابط الرياضية واكتشاف المواهب الشابة.',
    status: 'resolved',
    priority: 'normal',
    category: 'أنشطة وملاعب رياضية',
    location_address: 'بركة السبع شرق - ملعب النادي الرياضي',
    location_lat: 30.6410,
    location_lng: 31.0890,
    admin_notes: 'تمت إقامة البطولة بمشاركة 16 فريقاً وتوزيع الجوائز والكؤوس على الفرق الفائزة تحت رعاية الأمانة.',
    public_response: 'أقيمت البطولة بنجاح بمشاركة 16 فريقاً وتكريم المتميزين.',
    daysAgo: 25,
    hoursAgo: 4
  },
  {
    citizen_name: 'مريم أحمد الباز',
    national_id: '29909151234574',
    primary_phone: '01122334455',
    alt_contacts: [],
    title: 'توفير فرص عمل وتأهيل لشباب الخريجين في المنطقة الصناعية',
    description: 'نأمل التواصل مع إدارة مصانع المنطقة الصناعية بقويسنا وبركة السبع لتوفير فرص تدريب منتهي بالتوظيف لخريجي الدبلومات الفنية والمؤهلات العليا.',
    status: 'in_progress',
    priority: 'urgent',
    category: 'توظيف وتأهيل لسوق العمل',
    location_address: 'بركة السبع - مكتب خدمة المواطنين بالأمانة',
    location_lat: 30.6380,
    location_lng: 31.0850,
    admin_notes: 'تم حصر 45 سيرة ذاتية وجاري إجراء المقابلات مع مسؤولي الموارد البشرية بالمصانع الشريكة.',
    public_response: 'جاري التنسيق وتحديد مواعيد المقابلات الشخصية للمتقدمين.',
    daysAgo: 6,
    hoursAgo: 1
  },
  {
    citizen_name: 'مصطفى كامل الخولي',
    national_id: '29302191234575',
    primary_phone: '01288776655',
    alt_contacts: [],
    title: 'دعم النشاط الثقافي والمسرحي وتأهيل مكتبة مركز شباب جنزور',
    description: 'المكتبة بحاجة إلى كتب ومراجع حديثة وتجهيز مسرح مصغر لإقامة الفعاليات الثقافية واكتشاف مواهب الإلقاء والشعر.',
    status: 'under_review',
    priority: 'normal',
    category: 'دورات تدريبية وتثقيفية',
    location_address: 'قرية جنزور - مركز شباب جنزور',
    location_lat: 30.6215,
    location_lng: 31.0580,
    admin_notes: 'جاري حصر احتياجات المكتبة والتنسيق مع الهيئة العامة لقصور الثقافة لتوريد 200 كتاب.',
    public_response: 'الموضوع قيد المراجعة وإعداد خطة الدعم الثقافي.',
    daysAgo: 10,
    hoursAgo: 7
  },
  {
    citizen_name: 'طارق عبد الحميد حسان',
    national_id: '29506141234576',
    primary_phone: '01066554433',
    alt_contacts: [],
    title: 'صيانة مدرجات وأرضية ملعب شنتنا الحجر',
    description: 'النجيل الصناعي بالملعب تآكل في بعض المناطق ويحتاج إلى صيانة الحبيبات المطاطية لحماية اللاعبين من الإصابات.',
    status: 'under_review',
    priority: 'normal',
    category: 'صيانة وتجهيز مراكز الشباب',
    location_address: 'قرية شنتنا الحجر - مركز شباب القرية',
    location_lat: 30.6610,
    location_lng: 31.0950,
    admin_notes: 'تمت المعاينة الأولية مع مسؤول الصيانة بالأمانة وإعداد مقايسة الإصلاح لرفعها للمديرية.',
    public_response: 'تم إجراء المعاينة وجاري تدبير خامات الصيانة المطلوبة.',
    daysAgo: 3,
    hoursAgo: 5
  },
  {
    citizen_name: 'أحمد سعيد عبد الفتاح',
    national_id: '29701101234577',
    primary_phone: '01199887766',
    alt_contacts: [],
    title: 'إصلاح أعطال لوحة الكهرباء بالملعب المفتوح بقرية جنزور',
    description: 'انقطاع التيار المتكرر عن كشافات الملعب الترابي بقرية جنزور يمنع إقامة الأنشطة الرياضية للشباب.',
    status: 'needs_info',
    priority: 'normal',
    category: 'صيانة وتجهيز مراكز الشباب',
    location_address: 'قرية جنزور - الملعب المفتوح بالقرية',
    location_lat: 30.6200,
    location_lng: 31.0600,
    admin_notes: 'طلب وارد حديثاً، تم التواصل مع الشاكي لاستكمال صور اللوحة التالفة لمخاطبة قطاع الكهرباء.',
    public_response: 'يرجى إرسال صورة اللوحة المعطلة عبر الواتساب لاستكمال المعاينة الفنية.',
    daysAgo: 1,
    hoursAgo: 3
  },
  {
    citizen_name: 'كريم ممدوح شلبي',
    national_id: '29903151234578',
    primary_phone: '01055667788',
    alt_contacts: [],
    title: 'مقترح تنظيم ندوة توعوية لمناهضة الإدمان وحماية النشء والشباب',
    description: 'مبادرة بالتعاون مع صندوق مكافحة وعلاج الإدمان لعقد ندوة تثقيفية موسعة لشباب وطلاب المركز بمقر الأمانة.',
    status: 'new',
    priority: 'normal',
    category: 'دورات تدريبية وتثقيفية',
    location_address: 'بركة السبع - بجوار كافيه كارليتوس (مقر الأمانة)',
    location_lat: 30.6390,
    location_lng: 31.0870,
    admin_notes: 'قيد العرض على أمين الشباب لاعتماد الموعد وتوجيه الدعوات للمحاضرين.',
    public_response: null,
    daysAgo: 0,
    hoursAgo: 2
  },
  {
    citizen_name: 'ياسر فؤاد النجار',
    national_id: '29107121234579',
    primary_phone: '01099887766',
    alt_contacts: [],
    title: 'تطوير حديقة الطفل وصيانة مقاعد الانتظار بنادي بركة السبع الرياضي',
    description: 'أهالي وأطفال المركز يترددون يومياً على الحديقة، ونرجو صيانة الألعاب والمقاعد لتوفير بيئة ترفيهية آمنة.',
    status: 'new',
    priority: 'normal',
    category: 'مبادرات وطلبات عامة',
    location_address: 'بركة السبع شرق - نادي بركة السبع الرياضي',
    location_lat: 30.6370,
    location_lng: 31.0840,
    admin_notes: 'طلب مسجل حديثاً قيد المعاينة والتوجيه للأمانة المختصة.',
    public_response: null,
    daysAgo: 0,
    hoursAgo: 1
  }
];

async function seed() {
  console.log(`Starting to seed ${SEED_COMPLAINTS.length} complaints to Supabase...`);

  let successCount = 0;
  for (const item of SEED_COMPLAINTS) {
    try {
      // 1. إدراج الشكوى عبر submit_complaint RPC
      const { data, error } = await supabase.rpc('submit_complaint', {
        p_citizen_name: item.citizen_name,
        p_national_id: item.national_id,
        p_primary_phone: item.primary_phone,
        p_title: item.title,
        p_description: item.description,
        p_alt_contacts: item.alt_contacts ?? [],
        p_committee_id: 'youth',
        p_committee_name: 'أمانة الشباب',
        p_is_confidential: false,
        p_location_lat: item.location_lat ?? null,
        p_location_lng: item.location_lng ?? null,
        p_location_address: item.location_address ?? null,
        p_attachments: []
      });

      if (error || !data) {
        console.warn(`Failed to insert "${item.title}":`, error?.message);
        continue;
      }

      const complaintId = data.id;
      const trackingCode = data.tracking_code;

      // 2. حساب التاريخ المتدرج (توزيع زمني لتشغيل الرسوم البيانية)
      const now = Date.now();
      const pastTime = now - (item.daysAgo * 24 * 3600 * 1000) - (item.hoursAgo * 3600 * 1000);
      const createdAtIso = new Date(pastTime).toISOString();
      const updatedAtIso = new Date(pastTime + 2 * 3600 * 1000).toISOString();

      // 3. تحديث الحالة والأولوية والتاريخ
      const { error: updateError } = await supabase
        .from('complaints')
        .update({
          status: item.status,
          priority: item.priority,
          category: item.category,
          admin_notes: item.admin_notes,
          public_response: item.public_response,
          created_at: createdAtIso,
          updated_at: updatedAtIso
        })
        .eq('id', complaintId);

      if (updateError) {
        console.warn(`Failed to update attributes for ${trackingCode}:`, updateError.message);
      } else {
        successCount++;
        console.log(`[OK] Inserted & updated: [${trackingCode}] - ${item.title.substring(0, 45)}... (${item.status})`);
      }
    } catch (err) {
      console.error(`Error processing complaint:`, err);
    }
  }

  console.log(`\nSuccessfully seeded ${successCount} of ${SEED_COMPLAINTS.length} complaints to Supabase!`);
}

seed();
