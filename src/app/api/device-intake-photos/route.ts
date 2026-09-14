import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deviceIntakePhotos } from '@/lib/db/schema';
import { cloudinaryService } from '@/lib/cloudinary';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Fotos del estado inicial del equipo (solo consulta interna, nunca se imprimen). Mismo patrón
 * que api/product-photos: multipart/form-data en un Route Handler, no una Server Action, para
 * evitar el límite de anidamiento del protocolo Flight con strings base64 grandes.
 */
export async function POST(request: Request) {
  try {
    await verifyAuthOrAdmin(false);

    const formData = await request.formData();
    const deviceIntakeId = formData.get('deviceIntakeId');
    const file = formData.get('file');

    if (typeof deviceIntakeId !== 'string' || !deviceIntakeId) {
      return NextResponse.json({ success: false, error: 'El ID de la recepción es obligatorio' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'La foto es obligatoria' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'El archivo debe ser una imagen' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: 'La foto no puede superar los 10MB' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    const { url, publicId } = await cloudinaryService.uploadImage(base64Image, deviceIntakeId);

    try {
      const [inserted] = await db
        .insert(deviceIntakePhotos)
        .values({
          deviceIntakeId,
          url,
          publicId,
        })
        .returning();

      return NextResponse.json({ success: true, data: inserted });
    } catch (dbError) {
      // La recepción pudo haber sido eliminada justo después de subir la imagen a Cloudinary.
      // Sin este cleanup, la imagen queda huérfana facturándose ahí.
      await cloudinaryService.deleteImage(publicId).catch((cleanupError) => {
        console.error('No se pudo limpiar la imagen huérfana de Cloudinary:', publicId, cleanupError);
      });
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error in POST /api/device-intake-photos:', error);
    const message = error instanceof Error && /autorizado|sesión|administr/i.test(error.message) ? error.message : 'No se pudo subir la foto de la recepción';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
