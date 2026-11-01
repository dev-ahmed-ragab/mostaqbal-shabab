import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Complaint, STATUS_META } from '@/types/database';
import { LOGO_BASE64 } from '@/lib/logoBase64';

/**
 * توليد وتنزيل استمارة وقرار الشكوى الفردية بصيغة PDF مباشرة بدون الحاجة لفتح نافذة الطباعة
 */
export async function generateSingleComplaintPdf(complaint: Complaint): Promise<void> {
  const statusLabel = STATUS_META[complaint.status]?.label || complaint.status;
  const todayStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="width: 780px; padding: 26px 30px; background: #ffffff; color: #0f172a; direction: rtl; font-family: 'IBM Plex Sans Arabic', Arial, Tahoma, sans-serif; box-sizing: border-box;">
      
      <!-- شريط علوي بلون الهوية -->
      <div style="height: 5px; background: linear-gradient(to left, #133063, #00a3e0); border-radius: 4px; margin-bottom: 14px;"></div>

      <!-- الترويسة الرسمية -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #133063; padding-bottom: 12px; margin-bottom: 14px;">
        <div style="text-align: right;">
          <h4 style="font-size: 10px; color: #475569; margin: 0 0 2px 0; font-weight: bold;">جمهورية مصر العربية</h4>
          <span style="font-size: 12px; font-weight: bold; color: #00a3e0; display: block;">حزب مستقبل وطن • أمانة مركز بركة السبع</span>
          <h1 style="font-size: 18px; font-weight: 800; color: #133063; margin: 2px 0;">أمانة رعاية الشباب</h1>
          <p style="font-size: 10px; color: #64748b; margin: 0;">منظومة خدمة المواطنين واستقبال الطلبات الميدانية</p>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center;">
          <img src="${LOGO_BASE64}" alt="شعار حزب مستقبل وطن" style="width: 52px; height: 52px; object-fit: contain; margin-bottom: 4px;" />
          <span style="font-size: 9px; font-weight: bold; color: #133063;">استمارة فحص رسمية معتمدة</span>
        </div>

        <div style="text-align: left;">
          <div style="display: inline-block; padding: 3px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 10px; font-weight: bold; color: #133063;">
            إشعار رسمي معتمد
          </div>
          <p style="font-size: 9px; color: #64748b; margin: 4px 0 0 0;">تاريخ الإصدار: ${todayStr}</p>
        </div>
      </div>

      <!-- كود التتبع والحالة -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px;">
        <div>
          <span style="font-size: 9px; color: #64748b; display: block; font-weight: bold;">كود الشكوى الرسمي:</span>
          <strong style="font-size: 16px; color: #133063; font-family: monospace; letter-spacing: 1px;">${complaint.tracking_code}</strong>
        </div>
        <div style="text-align: left;">
          <span style="font-size: 9px; color: #64748b; display: block; font-weight: bold;">حالة الطلب:</span>
          <strong style="font-size: 12px; color: #00a3e0;">${statusLabel}</strong>
        </div>
      </div>

      <!-- بيانات المواطن -->
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #133063; margin: 0 0 8px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          بيانات مقدم الطلب:
        </h3>
        <table style="width: 100%; font-size: 10px; border-collapse: collapse; text-align: right;">
          <tr>
            <td style="padding: 3px 0; color: #64748b; width: 22%;">اسم المواطن:</td>
            <td style="padding: 3px 0; font-weight: bold; color: #0f172a; width: 28%;">${complaint.citizen_name}</td>
            <td style="padding: 3px 0; color: #64748b; width: 22%;">الرقم القومي:</td>
            <td style="padding: 3px 0; font-family: monospace; font-weight: bold; color: #0f172a; width: 28%;">${complaint.national_id}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: #64748b;">رقم الهاتف:</td>
            <td style="padding: 3px 0; font-family: monospace; font-weight: bold; color: #0f172a;" dir="ltr">${complaint.primary_phone}</td>
            <td style="padding: 3px 0; color: #64748b;">العنوان / المركز:</td>
            <td style="padding: 3px 0; font-weight: bold; color: #0f172a;">${complaint.location_address || 'مركز بركة السبع - محافظة المنوفية'}</td>
          </tr>
        </table>
      </div>

      <!-- تفاصيل الموضوع -->
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #133063; margin: 0 0 6px 0;">
          موضوع الشكوى / المقترح:
        </h3>
        <p style="font-size: 11px; font-weight: bold; color: #133063; margin: 0 0 6px 0; background: #eff6ff; padding: 6px 10px; border-radius: 6px;">
          ${complaint.title}
        </p>

        <h4 style="font-size: 10px; font-weight: bold; color: #475569; margin: 8px 0 3px 0;">
          التفاصيل والشرح:
        </h4>
        <p style="font-size: 10px; color: #334155; line-height: 1.5; margin: 0; background: #ffffff; padding: 6px; border: 1px solid #f1f5f9; border-radius: 6px;">
          ${complaint.description}
        </p>
      </div>

      <!-- التأشيرة والقرار الرسمي -->
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 10px; padding: 12px 14px; margin-bottom: 18px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #133063; margin: 0 0 5px 0;">
          التأشيرة والقرار التنفيذي لأمانة الشباب:
        </h3>
        <p style="font-size: 10px; color: #0f172a; font-weight: 600; line-height: 1.5; margin: 0;">
          ${complaint.admin_notes || 'جاري الفحص والمتابعة الميدانية مع الأجهزة التنفيذية ومراكز الشباب بالمحافظة.'}
        </p>
      </div>

      <!-- خانات التوقيعات والاعتماد الرسمي -->
      <div style="border-top: 2px solid #133063; padding-top: 12px; display: flex; justify-content: space-between; text-align: center; font-size: 9px; font-weight: bold;">
        <div style="flex: 1;">
          <span style="color: #133063; display: block; margin-bottom: 22px;">أمين مساعد تنفيذي</span>
          <span style="color: #475569; font-weight: normal;">( م. محمود الجزار )</span>
        </div>
        <div style="flex: 1;">
          <span style="color: #133063; display: block; margin-bottom: 4px;">خاتم الاعتماد الرسمي</span>
          <div style="width: 44px; height: 44px; border: 1px dashed #94a3b8; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 7px; color: #94a3b8;">
            خاتم الأمانة
          </div>
        </div>
        <div style="flex: 1;">
          <span style="color: #133063; display: block; margin-bottom: 22px;">أمين رعاية الشباب ببركة السبع</span>
          <span style="color: #475569; font-weight: normal;">( أ. سامر التلاوي )</span>
        </div>
        <div style="flex: 1;">
          <span style="color: #133063; display: block; margin-bottom: 22px;">أمين التنظيم بالمحافظة</span>
          <span style="color: #475569; font-weight: normal;">( المحاسب / محمد بط )</span>
        </div>
      </div>

    </div>
  `;

  const container = document.createElement('div');
  container.id = 'single-complaint-pdf-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '780px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-99999';
  container.style.opacity = '0.005';
  container.style.pointerEvents = 'none';

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      x: 0,
      y: 0,
      width: 780,
      height: container.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const scaleX = usableWidth / canvas.width;
    const scaleY = usableHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY);

    const renderWidth = canvas.width * scale;
    const renderHeight = canvas.height * scale;

    const posX = margin + (usableWidth - renderWidth) / 2;
    const posY = margin + (usableHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);
    pdf.save(`إشعار_شكوى_${complaint.tracking_code}.pdf`);
  } catch (err) {
    console.error('خطأ أثناء توليد ملف الـ PDF للشكوى:', err);
    throw err;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
