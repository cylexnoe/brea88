import { upload } from '@vercel/blob/client';

export type ImageUploadType =
  | 'property'
  | 'profile';

export async function uploadImage(
  file: File,
  type: ImageUploadType
) {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      'Please select a JPG, PNG, or WebP image.'
    );
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error(
      'Image size must be less than 5MB.'
    );
  }

  const timestamp = Date.now();

  const safeName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .toLowerCase();

  const pathname =
    type === 'profile'
      ? `profiles/${timestamp}-${safeName}`
      : `properties/${timestamp}-${safeName}`;

  const blob = await upload(pathname, file, {
    access: 'public',

    handleUploadUrl:
      '/api/blob/upload',

    clientPayload: JSON.stringify({
      type,
    }),

    multipart: true,
  });

  return blob;
}