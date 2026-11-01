import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Complaint, STATUS_META } from '@/types/database';

export interface BulkPdfOptions {
  title?: string;
  committeeName?: string;
  printedBy?: string;
}

/**
 * تجهيز محتوى HTML للكشف المجمع
 */
function buildBulkHtml(
  complaints: Complaint[],
  titleOrOptions: string | BulkPdfOptions = 'كشف شكاوى ومتابعات حزب مستقبل وطن'
): { title: string; html: string; todayStr: string } {
  const title = typeof titleOrOptions === 'string'
    ? titleOrOptions
    : titleOrOptions.title || (titleOrOptions.committeeName ? `كشف طلبات ${titleOrOptions.committeeName}` : 'كشف شكاوى ومتابعات حزب مستقبل وطن');

  const todayStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
  const underReview = complaints.filter((c) => c.status === 'under_review').length;
  const newCount = complaints.filter((c) => c.status === 'new').length;

  const html = `
    <div style="border-bottom: 3px solid #133063; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; direction: rtl;">
      <div style="text-align: right;">
        <span style="font-size: 13px; font-weight: bold; color: #00a3e0; display: block;">جمهورية مصر العربية • حزب مستقبل وطن</span>
        <h1 style="font-size: 20px; font-weight: 800; color: #133063; margin: 4px 0;">${title}</h1>
        <p style="font-size: 11px; color: #64748b; margin: 0;">منظومة خدمة المواطنين المركزية • حزب مستقبل وطن - أمانة مركز بركة السبع</p>
      </div>
      <div style="text-align: left;">
        <span style="font-size: 10px; color: #64748b; display: block;">تاريخ استخراج التقرير:</span>
        <span style="font-size: 12px; font-weight: bold; color: #133063;">${todayStr}</span>
        <span style="display: block; font-size: 10px; color: #00a3e0; font-weight: bold; margin-top: 2px;">مستند رسمي معتمد</span>
      </div>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 18px; direction: rtl;">
      <div style="flex: 1; padding: 10px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;">
        <span style="font-size: 10px; color: #64748b; display: block;">إجمالي الطلبات</span>
        <strong style="font-size: 16px; color: #133063;">${total}</strong>
      </div>
      <div style="flex: 1; padding: 10px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; text-align: center;">
        <span style="font-size: 10px; color: #1d4ed8; display: block;">جديد</span>
        <strong style="font-size: 16px; color: #1e40af;">${newCount}</strong>
      </div>
      <div style="flex: 1; padding: 10px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; text-align: center;">
        <span style="font-size: 10px; color: #b45309; display: block;">قيد المراجعة</span>
        <strong style="font-size: 16px; color: #92400e;">${underReview}</strong>
      </div>
      <div style="flex: 1; padding: 10px; background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; text-align: center;">
        <span style="font-size: 10px; color: #7e22ce; display: block;">جاري التنفيذ</span>
        <strong style="font-size: 16px; color: #6b21a8;">${inProgress}</strong>
      </div>
      <div style="flex: 1; padding: 10px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center;">
        <span style="font-size: 10px; color: #15803d; display: block;">تم الحل بنجاح</span>
        <strong style="font-size: 16px; color: #166534;">${resolved}</strong>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: right; border: 1px solid #cbd5e1; direction: rtl;">
      <thead>
        <tr style="background-color: #133063; color: #ffffff;">
          <th style="padding: 8px 6px; border: 1px solid #cbd5e1; width: 30px; text-align: center;">#</th>
          <th style="padding: 8px 6px; border: 1px solid #cbd5e1; width: 100px;">كود الشكوى</th>
          <th style="padding: 8px 6px; border: 1px solid #cbd5e1; width: 140px;">اسم المواطن</th>
          <th style="padding: 8px 6px; border: 1px solid #cbd5e1; width: 100px;">رقم الهاتف</th>
          <th style="padding: 8px 6px; border: 1px solid #cbd5e1; width: 130px;">الأمانة المختصة</th>
          <th style="padding: 8px 6px; border: 1px solid #cbd5e1;">موضوع الطلب والتفاصيل</th>
          <th style="padding: 8px 6px; border: 1px solid #cbd5e1; width: 90px; text-align: center;">الحالة</th>
          <th style="padding: 8px 6px; border: 1px solid #cbd5e1; width: 80px; text-align: center;">تاريخ الورود</th>
        </tr>
      </thead>
      <tbody>
        ${complaints
          .map((c, index) => {
            const statusLabel = STATUS_META[c.status]?.label || c.status;
            const committeeLabel = c.committee_name || 'أمانة الشباب';
            const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
            return `
            <tr style="background-color: ${rowBg};">
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${index + 1}</td>
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #133063;">${c.tracking_code}</td>
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: bold;">${c.citizen_name}</td>
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-family: monospace;" dir="ltr">${c.primary_phone}</td>
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-size: 9px; color: #00a3e0; font-weight: bold;">${committeeLabel}</td>
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1;">${c.title}</td>
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${statusLabel}</td>
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 9px; font-family: monospace;">
                ${new Date(c.created_at).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' })}
              </td>
            </tr>
          `;
          })
          .join('')}
      </tbody>
    </table>

    <div style="margin-top: 25px; padding-top: 12px; border-top: 2px solid #133063; display: flex; justify-content: space-between; text-align: center; font-size: 11px; font-weight: bold; direction: rtl;">
      <div style="flex: 1;">
        <span style="color: #133063;">أمين مساعد تنفيذي</span>
        <p style="margin-top: 24px; color: #475569; font-weight: normal;">( م. محمود الجزار )</p>
      </div>
      <div style="flex: 1;">
        <span style="color: #133063;">خاتم الاعتماد الرسمي</span>
        <div style="width: 55px; height: 55px; border: 2px dashed #94a3b8; border-radius: 50%; margin: 6px auto; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8;">
          خاتم الحزب
        </div>
      </div>
      <div style="flex: 1;">
        <span style="color: #133063;">أمين الشباب ببركة السبع</span>
        <p style="margin-top: 24px; color: #475569; font-weight: normal;">( أ. سامر التلاوي )</p>
      </div>
      <div style="flex: 1;">
        <span style="color: #133063;">أمين التنظيم بالمحافظة</span>
        <p style="margin-top: 24px; color: #475569; font-weight: normal;">( المحاسب / محمد بط )</p>
      </div>
    </div>
  `;

  return { title, html, todayStr };
}

/**
 * فتح نافذة الطباعة المباشرة للكشف (vector-sharp native browser print dialog)
 */
export function printBulkComplaintsWindow(
  complaints: Complaint[],
  titleOrOptions: string | BulkPdfOptions = 'كشف شكاوى ومتابعات حزب مستقبل وطن'
): void {
  if (!complaints || complaints.length === 0) {
    alert('لا توجد شكاوى محددة للطباعة.');
    return;
  }

  const { title, html } = buildBulkHtml(complaints, titleOrOptions);

  const printWindow = window.open('', '_blank', 'width=1150,height=850');
  if (!printWindow) {
    // إذا حظر المتصفح النوافذ المنبثقة، نلجأ إلى توليد PDF
    generateBulkComplaintsPdf(complaints, titleOrOptions);
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: 'IBM Plex Sans Arabic', Arial, Tahoma, sans-serif;
          margin: 0;
          padding: 15px;
          color: #0f172a;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          .no-print-bar { display: none !important; }
          body { padding: 0 !important; }
        }
        .no-print-bar {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 10px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-print {
          background: #133063;
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
        }
        .btn-close {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <span style="font-size: 13px; font-weight: bold; color: #133063;">معاينة كشف الطباعة الرسمي (A4 بالعرض)</span>
        <div style="display: flex; gap: 8px;">
          <button class="btn-print" onclick="window.print()">🖨️ طباعة الآن (Ctrl + P)</button>
          <button class="btn-close" onclick="window.close()">إغلاق النافذة</button>
        </div>
      </div>
      ${html}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * توليد وتنزيل كشف تقرير مجمع للشكاوى بصيغة PDF باللغة العربية
 */
export async function generateBulkComplaintsPdf(
  complaints: Complaint[],
  titleOrOptions: string | BulkPdfOptions = 'كشف شكاوى ومتابعات حزب مستقبل وطن'
): Promise<void> {
  if (!complaints || complaints.length === 0) {
    alert('لا توجد شكاوى محددة للتصدير.');
    return;
  }

  const { title, html } = buildBulkHtml(complaints, titleOrOptions);

  // إنشاء حاوية خارج الشاشة أفقياً بدون zIndex سالب لضمان رسم المتصفح
  const container = document.createElement('div');
  container.id = 'bulk-pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-10000px';
  container.style.width = '1120px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.padding = '25px';
  container.style.direction = 'rtl';
  container.style.zIndex = '9999';
  container.style.opacity = '1';
  container.style.visibility = 'visible';
  container.style.pointerEvents = 'none';
  container.style.fontFamily = "'IBM Plex Sans Arabic', Arial, sans-serif";

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1200,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    if (imgHeight <= usableHeight) {
      pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight);
        heightLeft -= usableHeight;
      }
    }

    const todayFile = new Date().toISOString().split('T')[0];
    pdf.save(`كشف_شكاوى_مستقبل_وطن_${todayFile}.pdf`);
  } catch (err) {
    console.error('فشل تصدير كشف الـ PDF:', err);
    // إذا فشل html2canvas في المتصفح، تفتح نافذة الطباعة المباشرة تلقائياً كبديل فوري
    printBulkComplaintsWindow(complaints, titleOrOptions);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
