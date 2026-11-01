import { supabase, isSupabaseConfigured } from './supabase/client';
import { Attachment } from '@/types/database';
import { compressImageFile } from './compressImage';

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'complaint-media';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

/**
 * رفع ملف مرفق (صورة أو فيديو) إلى مخزن Supabase Storage.
 * ملاحظة: هذا تحقق على العميل فقط؛ يجب أن تُكرَّر نفس القيود على الخادم
 * عند إضافة مسار رفع خادمي في المستقبل.
 */
export async function uploadAttachment(file: File): Promise<Attachment> {
  if (!file || file.size === 0) {
    throw new Error('الملف فارغ أو غير صالح.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('حجم الملف يتجاوز الحد الأقصى (25 ميجابايت).');
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type) && !ALLOWED_VIDEO_TYPES.has(file.type)) {
    throw new Error('نوع الملف غير مدعوم. المسموح: صور JPG/PNG/WEBP/HEIC أو فيديو MP4/MOV/WEBM.');
  }

  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);
  const isImage = ALLOWED_IMAGE_TYPES.has(file.type);

  // 1. ضغط الصورة إذا كانت صورة لتقليل الحجم
  let processedFile = file;
  if (isImage) {
    processedFile = await compressImageFile(file);
  }

  if (
    !ALLOWED_IMAGE_TYPES.has(processedFile.type) &&
    !ALLOWED_VIDEO_TYPES.has(processedFile.type)
  ) {
    throw new Error('تعذّر معالجة الملف: الناتج ليس صورة أو فيديو مدعوماً.');
  }

  // 2. إذا كانت بيانات Supabase مهيأة، نرفع للـ Bucket
  if (isSupabaseConfigured && supabase) {
    try {
      const timestamp = Date.now();
      const randomPart =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, '')
          : Math.random().toString(36).slice(2, 12);
      const extension =
        EXTENSION_BY_TYPE[processedFile.type] ||
        EXTENSION_BY_TYPE[file.type] ||
        'bin';
      const filePath = `uploads/${timestamp}-${randomPart}.${extension}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: processedFile.type,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path);

        return {
          url: publicData.publicUrl,
          name: file.name,
          type: isVideo ? 'video' : 'image',
          size: processedFile.size,
        };
      } else {
        console.warn('Supabase storage upload warning:', error?.message);
      }
    } catch (err) {
      console.warn('Storage upload exception, falling back to local preview:', err);
    }
  }

  // 3. Fallback محلي في حال عدم وجود Bucket بعد أو في النمط التجريبي
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: (reader.result as string) || URL.createObjectURL(processedFile),
        name: file.name,
        type: isVideo ? 'video' : 'image',
        size: processedFile.size,
      });
    };
    reader.readAsDataURL(processedFile);
  });
}
