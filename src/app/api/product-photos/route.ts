import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { cloudinaryService } from '@/lib/cloudinary';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Recibe la foto como multipart/form-data (no como argumento de Server Action) para evitar
 * el límite de anidamiento del protocolo Flight con strings base64 grandes (fotos de celular).
 */
export async function POST(request: Request) {
  try {
    await verifyAuthOrAdmin(false);

    const formData = await request.formData();
    const productId = formData.get('productId');
    const file = formData.get('file');

    if (typeof productId !== 'string' || !productId) {
      return NextResponse.json({ success: false, error: 'El ID del producto es obligatorio' }, { status: 400 });
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

    const { url, publicId } = await cloudinaryService.uploadImage(base64Image, productId);

    try {
      const [inserted] = await db
        .insert(productImages)
        .values({
          productId,
          url,
          publicId,
        })
        .returning();

      return NextResponse.json({ success: true, data: inserted });
    } catch (dbError) {
      // El producto pudo haber sido eliminado (u otro error transitorio) justo después de subir
      // la imagen a Cloudinary. Sin este cleanup, la imagen queda huérfana y facturándose ahí.
      await cloudinaryService.deleteImage(publicId).catch((cleanupError) => {
        console.error('No se pudo limpiar la imagen huérfana de Cloudinary:', publicId, cleanupError);
      });
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error in POST /api/product-photos:', error);
    const message = error instanceof Error && /autorizado|sesión|administr/i.test(error.message) ? error.message : 'No se pudo subir la foto del producto';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
