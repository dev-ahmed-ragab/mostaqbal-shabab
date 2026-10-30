import * as XLSX from 'xlsx';
import { Complaint, STATUS_META } from '@/types/database';

export function exportComplaintsToExcel(complaints: Complaint[], filename?: string): void {
  // تجهيز البيانات باللغة العربية
  const rows = complaints.map((c) => ({
    'كود الشكوى': c.tracking_code,
    'تاريخ التقديم': new Date(c.created_at).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    'اسم المواطن': c.citizen_name,
    'الرقم القومي': c.national_id,
    'رقم الهاتف': c.primary_phone,
    'وسائل تواصل أخرى': c.alt_contacts?.map((a) => `${a.type}: ${a.value}`).join(' | ') || 'لا يوجد',
    'عنوان الشكوى': c.title,
    'تفاصيل الشكوى': c.description,
    'الحالة': STATUS_META[c.status]?.label || c.status,
    'الموقع / العنوان': c.location_address || 'غير محدد',
    'ملاحظات اللجنة': c.admin_notes || 'لا توجد ملاحظات',
  }));

  // إنشاء ورقة العمل والمصنف
  const worksheet = XLSX.utils.json_to_sheet(rows);
  
  // ضبط اتجاه الورقة من اليمين لليسار (RTL)
  worksheet['!views'] = [{ rightToLeft: true }];

  // ضبط أبعاد الأعمدة
  worksheet['!cols'] = [
    { wch: 15 }, // كود الشكوى
    { wch: 22 }, // التاريخ
    { wch: 25 }, // الاسم
    { wch: 18 }, // الرقم القومي
    { wch: 15 }, // الهاتف
    { wch: 25 }, // وسائل تواصل أخرى
    { wch: 30 }, // عنوان الشكوى
    { wch: 45 }, // التفاصيل
    { wch: 18 }, // الحالة
    { wch: 25 }, // الموقع
    { wch: 30 }, // الملاحظات
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل الشكاوى');

  // اسم الملف مع تاريخ اليوم
  const today = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `كشف_شكاوى_لجنة_الشباب_${today}.xlsx`;

  XLSX.writeFile(workbook, finalFilename);
}
