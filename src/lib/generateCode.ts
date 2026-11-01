/**
 * توليد كود تتبع شكوى سهل التذكر والنطق
 * الصيغة: SH-MMDD-XX (مثال: SH-1030-01)
 * SH: اختصار أمانة الشباب
 * MMDD: الشهر واليوم لسهولة استرجاعها هاتفياً حتى لو نسي المواطن الكود
 * XX: رقم تسلسلي للطلب
 */
export function generateTrackingCode(sequenceNumber: number = 1): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // إذا لم يُمرر رقم تسلسلي محدد، نولد رقماً عشوائياً أنيقاً من رقمين إلى ثلاثة
  const seq = sequenceNumber > 0 
    ? String(sequenceNumber).padStart(2, '0')
    : String(Math.floor(10 + Math.random() * 90));

  return `SH-${month}${day}-${seq}`;
}
