import { ActionResult } from '@/lib/action-result';
import { type ProductImage } from '@/features/product/domain/product.schema';

/**
 * Sube la foto vía multipart/form-data a un Route Handler (no una Server Action): las Server
 * Actions rompen con "Maximum array nesting exceeded" al recibir strings base64 grandes
 * (fotos de celular, varios MB) como argumento — es un límite del protocolo Flight, no del
 * tamaño de body. El Route Handler usa parsing HTTP normal y no tiene ese límite.
 */
export async function uploadProductPhoto(productId: string, file: File): Promise<ActionResult<ProductImage>> {
  try {
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('file', file);

    const res = await fetch('/api/product-photos', {
      method: 'POST',
      body: formData,
    });

    return await res.json();
  } catch (error) {
    console.error('Error in uploadProductPhoto:', error);
    return { success: false, error: 'No se pudo subir la foto del producto' };
  }
}
