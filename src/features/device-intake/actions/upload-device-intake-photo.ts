import { ActionResult } from '@/lib/action-result';
import { type DeviceIntakePhoto } from '@/features/device-intake/domain/device-intake-photo.types';

/**
 * Sube la foto vía multipart/form-data a un Route Handler (no una Server Action) — mismo motivo
 * que uploadProductPhoto: evitar el límite de anidamiento del protocolo Flight con strings
 * base64 grandes (fotos de celular).
 */
export async function uploadDeviceIntakePhoto(deviceIntakeId: string, file: File): Promise<ActionResult<DeviceIntakePhoto>> {
  try {
    const formData = new FormData();
    formData.append('deviceIntakeId', deviceIntakeId);
    formData.append('file', file);

    const res = await fetch('/api/device-intake-photos', {
      method: 'POST',
      body: formData,
    });

    return await res.json();
  } catch (error) {
    console.error('Error in uploadDeviceIntakePhoto:', error);
    return { success: false, error: 'No se pudo subir la foto de la recepción' };
  }
}
