import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratePdfOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  fitToSinglePage?: boolean;
}

/**
 * توليد وتنزيل ملف PDF عالي الدقة في صفحة واحدة مع الحفاظ الكامل على الخطوط واللغة العربية
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions = {}
): Promise<void> {
  const {
    filename = 'إيصال_شكوى_مستقبل_وطن.pdf',
    orientation = 'portrait',
    fitToSinglePage = true,
  } = options;

  try {
    // التقاط العنصر بـ html2canvas بدون taint لضمان تصدير toDataURL
    const canvas = await html2canvas(element, {
      scale: 2, // دقة ممتازة وخفيفة وسريعة
      useCORS: true,
      allowTaint: false, // يجب أن تكون false لمنع SecurityError في toDataURL
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = orientation === 'portrait' ? 210 : 297;
    const pageHeight = orientation === 'portrait' ? 297 : 210;

    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    if (fitToSinglePage) {
      // ملاءمة المستند بالكامل ليظهر في صفحة A4 واحدة فقط بدون أي صفحة ثانية
      const scaleX = usableWidth / canvasWidth;
      const scaleY = usableHeight / canvasHeight;
      const scale = Math.min(scaleX, scaleY);

      const renderWidth = canvasWidth * scale;
      const renderHeight = canvasHeight * scale;

      // توسيط المحتوى أفقياً ورأسياً
      const posX = margin + (usableWidth - renderWidth) / 2;
      const posY = margin + (usableHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);
    } else {
      const renderHeight = (canvasHeight * usableWidth) / canvasWidth;
      if (renderHeight <= usableHeight) {
        pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, renderHeight);
      } else {
        let heightLeft = renderHeight;
        let position = margin;

        pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, renderHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - renderHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, renderHeight);
          heightLeft -= pageHeight;
        }
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error('فشل توليد ملف الـ PDF:', error);
    // إتاحة خيار الطباعة المباشرة كبديل فوري في حال قيود المتصفح
    if (confirm('حدث خطأ أثناء تنزيل الـ PDF، هل تود استخدام نافذة الطباعة/الحفظ كـ PDF مباشرة؟')) {
      window.print();
    }
  }
}
