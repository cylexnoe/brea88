import crypto from 'crypto';

const MAX_JSON_BYTES = 256 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const SECURITY_LIMITS = {
  maxJsonBytes: MAX_JSON_BYTES,
  maxImageBytes: MAX_IMAGE_BYTES,
  maxImagesPerProperty: 10,
} as const;

export function hasValidContentLength(
  request: Request,
  maxBytes: number,
): boolean {
  const value = request.headers.get('content-length');

  if (!value) return true;

  const length = Number(value);

  return Number.isSafeInteger(length) && length >= 0 && length <= maxBytes;
}

export function safeTimingEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');

  if (left.length !== right.length) return false;

  return crypto.timingSafeEqual(left, right);
}

export function isSafeHttpUrl(value: string, maxLength = 2048): boolean {
  if (!value || value.length > maxLength) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && url.protocol === 'http:');
  } catch {
    return false;
  }
}

export function validateImageSignature(
  bytes: Uint8Array,
  declaredType: string,
): boolean {
  if (declaredType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (declaredType === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (declaredType === 'image/webp') {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}

export async function validateImageFile(file: File): Promise<{
  ok: true;
  extension: 'jpg' | 'png' | 'webp';
} | {
  ok: false;
  message: string;
}> {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  if (!allowedTypes.has(file.type)) {
    return { ok: false, message: 'Only JPG, PNG, and WebP images are allowed.' };
  }

  if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: 'Image must be larger than 0 bytes and 5MB or smaller.' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!validateImageSignature(bytes, file.type)) {
    return { ok: false, message: 'The uploaded file is not a valid image.' };
  }

  return {
    ok: true,
    extension: file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg',
  };
}
