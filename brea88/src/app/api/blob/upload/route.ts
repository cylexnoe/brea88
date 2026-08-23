import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname,
        clientPayload,
        multipart
      ) => {
        let payload: {
          type?: 'property' | 'profile';
        } = {};

        if (clientPayload) {
          try {
            payload = JSON.parse(clientPayload);
          } catch {
            throw new Error('Invalid upload payload.');
          }
        }

        const uploadType = payload.type;

        if (
          uploadType !== 'property' &&
          uploadType !== 'profile'
        ) {
          throw new Error('Invalid upload type.');
        }

        const allowedExtensions = [
          '.jpg',
          '.jpeg',
          '.png',
          '.webp',
        ];

        const lowerPathname = pathname.toLowerCase();

        const validExtension = allowedExtensions.some(
          (extension) =>
            lowerPathname.endsWith(extension)
        );

        if (!validExtension) {
          throw new Error(
            'Only JPG, JPEG, PNG, and WebP images are allowed.'
          );
        }

        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
          ],

          maximumSizeInBytes: 5 * 1024 * 1024,

          addRandomSuffix: true,
        };
      },

      onUploadCompleted: async ({ blob }) => {
        console.log(
          'Image uploaded successfully:',
          blob.url
        );
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Blob upload error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Image upload failed.',
      },
      {
        status: 500,
      }
    );
  }
}