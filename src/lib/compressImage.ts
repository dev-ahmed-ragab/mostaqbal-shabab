import imageCompression from 'browser-image-compression';

export async function compressImageFile(file: File): Promise<File> {
  // إذا لم يكن الملف صورة أو كان حجمه بالفعل أقل من 400 كيلوبايت، نعيده كما هو
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: 0.8, // حد أقصى 800 كيلوبايت
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn('تعذر ضغط الصورة، سيتم استخدام الملف الأصلي:', error);
    return file;
  }
}
