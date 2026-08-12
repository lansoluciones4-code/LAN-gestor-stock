import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { cloudinaryService } from '@/lib/cloudinary';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    const { url, publicId } = await cloudinaryService.uploadImage(base64Image, productId);

    const [inserted] = await db
      .insert(productImages)
      .values({
        productId,
        url,
        publicId,
      })
      .returning();

    return NextResponse.json({ success: true, data: inserted });
  } catch (error: any) {
    console.error('Error in POST /api/product-photos:', error);
    const message = error instanceof Error && /autorizado|sesión|administr/i.test(error.message) ? error.message : 'No se pudo subir la foto del producto';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
