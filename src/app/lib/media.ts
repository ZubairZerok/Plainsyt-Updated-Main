import { supabase } from './supabase';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('ছবিটি পড়া যায়নি'));
    };
    img.src = url;
  });
}

/** Downscale large photos in the browser so uploads stay small. GIFs are uploaded untouched. */
async function shrink(blob: Blob, maxDim: number): Promise<Blob> {
  if (blob.type === 'image/gif') return blob;
  const img = await loadImage(blob);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  if (scale === 1 && blob.size < 1_500_000) return blob;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
  const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  return out ?? blob;
}

/** Upload an image to the public `media` bucket under the user's own folder and return its URL. */
export async function uploadImage(file: Blob, userId: string, maxDim = 1600): Promise<UploadResult> {
  if (!userId) return { ok: false, error: 'আপলোড করতে লগইন করুন।' };
  if (!ALLOWED.includes(file.type)) return { ok: false, error: 'শুধুমাত্র JPG, PNG, WebP বা GIF ছবি আপলোড করা যাবে।' };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'ছবির আকার ১০ MB এর বেশি হতে পারবে না।' };
  try {
    const body = await shrink(file, maxDim);
    const ext = body.type === 'image/png' ? 'png' : body.type === 'image/webp' ? 'webp' : body.type === 'image/gif' ? 'gif' : 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(path, body, { contentType: body.type, cacheControl: '31536000' });
    if (error) return { ok: false, error: 'ছবি আপলোড করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।' };
    return { ok: true, url: supabase.storage.from('media').getPublicUrl(path).data.publicUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'ছবি আপলোড করা যায়নি।' };
  }
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}
