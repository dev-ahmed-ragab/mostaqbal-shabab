-- ==============================================================================
-- منظومة خدمة المواطنين ولجنة رعاية الشباب
-- سكريبت إنشاء الجداول والفهارس وسياسات الأمان (Supabase PostgreSQL Schema)
-- ==============================================================================

-- 1. تفعيل ملحق توليد المعرفات الفريدة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. جدول الشكاوى والطلبات الرئيسي
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT NOT NULL UNIQUE, -- مثال: SH-1030-01
  citizen_name TEXT NOT NULL,
  national_id TEXT NOT NULL,
  primary_phone TEXT NOT NULL,
  alt_contacts JSONB DEFAULT '[]'::jsonb, -- وسائل تواصل بديلة: [{type: 'whatsapp'|'phone'|'email', value: '...'}]
  
  -- محتوى الشكوى
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'under_review', 'needs_info', 'in_progress', 'resolved', 'rejected')
  ),
  
  -- الموقع الجغرافي الاختياري
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  
  -- المرفقات (روابط الصور والفيديوهات من Storage)
  attachments JSONB DEFAULT '[]'::jsonb, -- [{url: '...', name: '...', type: 'image'|'video', size: 1024}]
  
  -- الملاحظات الإدارية الداخلية
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. جدول السجل الزمني للحركات (Timeline History)
CREATE TABLE IF NOT EXISTS complaint_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  actor_name TEXT DEFAULT 'لجنة رعاية الشباب',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. فهارس تسريع الاستعلام والبحث
CREATE INDEX IF NOT EXISTS idx_complaints_tracking_code ON complaints(tracking_code);
CREATE INDEX IF NOT EXISTS idx_complaints_primary_phone ON complaints(primary_phone);
CREATE INDEX IF NOT EXISTS idx_complaints_national_id ON complaints(national_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_complaint_id ON complaint_timeline(complaint_id);

-- 5. دالة وتريجر التحديث التلقائي لـ updated_at
CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_complaints_timestamp ON complaints;
CREATE TRIGGER trigger_update_complaints_timestamp
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_complaints_updated_at();

-- 6. سياسات الأمان على مستوى الصفوف (Row Level Security - RLS)
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_timeline ENABLE ROW LEVEL SECURITY;

-- سياسة 1: السماح لأي زائر بتقديم شكوى جديدة
CREATE POLICY "Allow public insert to complaints"
  ON complaints FOR INSERT
  WITH CHECK (true);

-- سياسة 2: السماح بالاستعلام العام عن الشكوى (للمواطن لمعرفة حالتها)
CREATE POLICY "Allow public select on complaints"
  ON complaints FOR SELECT
  USING (true);

-- سياسة 3: السماح للمشرفين بتعديل وحذف الشكاوى
CREATE POLICY "Allow authenticated update to complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (true);

-- سياسات السجل الزمني
CREATE POLICY "Allow public select on timeline"
  ON complaint_timeline FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert on timeline"
  ON complaint_timeline FOR INSERT
  WITH CHECK (true);

-- ==============================================================================
-- 7. إنشاء مخزن المرفقات (Supabase Storage Bucket: complaint-media)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-media',
  'complaint-media',
  true,
  26214400, -- 25MB أقصى حد
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- سياسات الأمان للمرفقات (السماح بالرفع المباشر والقراءة العامة)
DROP POLICY IF EXISTS "Public Upload To complaint-media" ON storage.objects;
CREATE POLICY "Public Upload To complaint-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'complaint-media');

DROP POLICY IF EXISTS "Public Read complaint-media" ON storage.objects;
CREATE POLICY "Public Read complaint-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'complaint-media');

-- ==============================================================================
-- 8. بيانات تجريبية أولية (Seed Data) لاختبار لوحة التحكم فوراً
-- ==============================================================================
INSERT INTO complaints (
  tracking_code,
  citizen_name,
  national_id,
  primary_phone,
  alt_contacts,
  title,
  description,
  status,
  location_address,
  admin_notes,
  created_at
) VALUES 
(
  'SH-1030-01',
  'أحمد محمود إبراهيم',
  '29510151234567',
  '01012345678',
  '[{"type": "whatsapp", "value": "01012345678"}]'::jsonb,
  'طلب دعم وتجهيز ملتقى توظيف شباب الخريجين',
  'نرجو من لجنة رعاية الشباب الموقرة التنسيق لتنظيم ملتقى توظيف مصغر بالتعاون مع شركات القطاع الخاص لتوفير فرص عمل لشباب الدائرة.',
  'under_review',
  'مركز شباب المدينة - الصالة المغطاة',
  'تم إحالة الموضوع لمقرر اللجنة للتنسيق مع الشركات الراعية.',
  NOW() - INTERVAL '2 hours'
),
(
  'SH-1030-02',
  'سارة عبد الرحمن يوسف',
  '29805201234568',
  '01123456789',
  '[{"type": "whatsapp", "value": "01123456789"}, {"type": "email", "value": "sara.youssef@example.com"}]'::jsonb,
  'صيانة ملعب كرة القدم وتوفير إضاءة كاشفة',
  'أعمدة الإنارة في الملعب الخماسي معطلة منذ أسبوع والشباب لا يستطيعون ممارسة الأنشطة الرياضية ليلاً، نرجو الصيانة العاجلة.',
  'in_progress',
  'ملعب قرية الأمل الرياضي',
  'تم التواصل مع فني الكهرباء وتوفير الكشافات، جاري التركيب غداً.',
  NOW() - INTERVAL '5 hours'
),
(
  'SH-1029-01',
  'محمد السيد الشناوي',
  '29203101234569',
  '01234567890',
  '[{"type": "phone", "value": "01512345678"}]'::jsonb,
  'إنشاء دورة تدريبية مجانية في البرمجة والذكاء الاصطناعي',
  'مقترح لإطلاق مبادرة لتأهيل 50 شاباً وفتاة في مهارات العمل الحر والبرمجة بالتعاون مع مدربين متطوعين.',
  'resolved',
  'مقر قاعة المؤتمرات',
  'تمت الموافقة وتدشين الدورة التدريبية يوم السبت القادم بحضور 60 متدرباً.',
  NOW() - INTERVAL '1 day'
),
(
  'SH-1028-03',
  'خالد مصطفى علام',
  '29007081234570',
  '01098765432',
  '[]'::jsonb,
  'طلب توفير أدوات رياضية لفريق تنس الطاولة',
  'فريق الناشئين حقق المركز الأول على مستوى المنطقة ويحتاج مضارب وكرات تدريبية إضافية للاستعداد للبطولة القادمة.',
  'new',
  'نادي شباب المستقبل',
  NULL,
  NOW() - INTERVAL '2 days'
);

-- إدراج سجل زمني مبدئي
INSERT INTO complaint_timeline (complaint_id, status, note, actor_name, created_at)
SELECT id, 'new', 'تم استلام الشكوى إلكترونياً بنجاح وقيد الفحص الأولي.', 'المنظومة الإلكترونية', created_at
FROM complaints;

INSERT INTO complaint_timeline (complaint_id, status, note, actor_name, created_at)
SELECT id, 'under_review', 'تم فحص أوراق الطلب وتحويله للجنة المختصة للدراسة.', 'م. محمود الجزار (مسؤول اللجنة)', created_at + INTERVAL '30 minutes'
FROM complaints WHERE status IN ('under_review', 'in_progress', 'resolved');

INSERT INTO complaint_timeline (complaint_id, status, note, actor_name, created_at)
SELECT id, 'in_progress', 'جاري التنسيق الميداني والبدء في تنفيذ الحل.', 'أ. محمد العزب (عضو اللجنة)', created_at + INTERVAL '1 hour'
FROM complaints WHERE status IN ('in_progress', 'resolved');

INSERT INTO complaint_timeline (complaint_id, status, note, actor_name, created_at)
SELECT id, 'resolved', 'تم إنجاز الطلب بالكامل والتأكد من إزالة أسباب الشكوى.', 'أ. سامر التلاوي (رئيس اللجنة)', created_at + INTERVAL '3 hours'
FROM complaints WHERE status = 'resolved';
