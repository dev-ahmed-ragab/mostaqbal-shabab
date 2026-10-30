import { Complaint, ComplaintStatus } from '@/types/database';

/**
 * تهيئة رقم الهاتف ليكون بالصيغة الدولية المتوافقة مع واتساب (مصر: +20)
 */
export function formatEgyptianPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('01')) {
    return `20${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('201')) {
    return cleaned;
  }
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return `20${cleaned}`;
  }
  return cleaned;
}

/**
 * إنشاء رابط واتساب فوري بنص مجهز مسبقاً بناءً على حالة الشكوى
 */
export function buildWhatsAppLink(
  complaint: Pick<Complaint, 'citizen_name' | 'tracking_code' | 'title' | 'status' | 'primary_phone'>,
  targetPhone?: string,
  customNote?: string
): string {
  const phone = targetPhone || complaint.primary_phone;
  const formattedPhone = formatEgyptianPhoneForWhatsApp(phone);

  let message = '';
  const greeting = `أهلاً بحضرتك أستاذ/ة ${complaint.citizen_name}،\nتحية طيبة من لجنة رعاية الشباب.\n\n`;
  const reference = `📌 بخصوص طلبكم رقم: *${complaint.tracking_code}*\n📝 الموضوع: "${complaint.title}"\n\n`;

  switch (complaint.status) {
    case 'new':
      message = `${greeting}${reference}نود إحاطتكم بأنه تم استلام طلبكم بنجاح ومدرج على جدول أعمال المراجعة الأولية. سنوافيكم بالتحديثات فوراً.`;
      break;
    case 'under_review':
      message = `${greeting}${reference}نفيدكم بأن الشكوى حالياً *قيد المراجعة والدراسة* من قبل مسؤولي اللجنة لتحديد الإجراء المناسب.`;
      break;
    case 'needs_info':
      message = `${greeting}${reference}نحيطكم علماً بأن الطلب *يحتاج إلى استكمال بعض البيانات أو المستندات*.\n${customNote ? `المطلوب: ${customNote}\n` : ''}يرجى موافاتنا بها لنتمكن من المتابعة.`;
      break;
    case 'in_progress':
      message = `${greeting}${reference}يسرنا إبلاغكم بأنه *جاري التنسيق والمتابعة الميدانية* مع الجهات المختصة لتنفيذ طلبكم وإزالة أسباب الشكوى.`;
      break;
    case 'resolved':
      message = `${greeting}${reference}🎉 يسعدنا إخطاركم بأنه *تم حل وإنجاز طلبكم بنجاح*. نشكر تواصلكم الدائم وثقتكم بلجنة رعاية الشباب.`;
      break;
    case 'rejected':
      message = `${greeting}${reference}نحيطكم علماً بأنه بعد الدراسة تعذر استكمال الطلب للأسباب الآتية:\n${customNote || 'الطلب خارج النطاق الجغرافي أو الاختصاص المحدد للجنة.'}`;
      break;
    default:
      message = `${greeting}${reference}نتواصل معكم بشأن استفساركم لمتابعة حالة الشكوى.`;
  }

  if (customNote && complaint.status !== 'needs_info' && complaint.status !== 'rejected') {
    message += `\n\nملاحظة من اللجنة: ${customNote}`;
  }

  message += `\n\nيمكنكم متابعة حالة الطلب إلكترونياً في أي وقت عبر الرابط: https://mostaqbal-shabab.vercel.app/track?code=${complaint.tracking_code}`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
