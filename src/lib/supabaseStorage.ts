import { supabase, isSupabaseConfigured } from './supabase/client';
import { Attachment } from '@/types/database';
import { compressImageFile } from './compressImage';

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'complaint-media';

/**
 * رفع ملف مرفق (صورة أو فيديو) إلى مخزن Supabase Storage
 */
export async function uploadAttachment(file: File): Promise<Attachment> {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  // 1. ضغط الصورة إذا كانت صورة لتقليل الحجم
  let processedFile = file;
  if (isImage) {
    processedFile = await compressImageFile(file);
  }

  // 2. إذا كانت بيانات Supabase مهيأة، نرفع للـ Bucket
  if (isSupabaseConfigured && supabase) {
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `uploads/${timestamp}-${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false,
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
