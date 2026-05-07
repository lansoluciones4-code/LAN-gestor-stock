'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Camera, Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';
import { getProductPhotos } from '@/features/product/actions/get-product-photos';
import { uploadProductPhoto } from '@/features/product/actions/upload-product-photo';
import { deleteProductPhoto } from '@/features/product/actions/delete-product-photo';
import { type ProductDef, type ProductImage } from '@/features/product/domain/product.schema';

interface ProductPhotosManagerProps {
  product: ProductDef | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductPhotosManager({ product, isOpen, onClose }: ProductPhotosManagerProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'upload'>('view');
  const [photos, setPhotos] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && product?.id) {
      setActiveTab('view');
      loadPhotos(product.id);
    } else {
      setPhotos([]);
      setError(null);
    }
  }, [isOpen, product]);

  const loadPhotos = async (productId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getProductPhotos(productId);
      if (res.success) {
        setPhotos(res.data);
      } else {
        setError(res.error || 'No se pudieron cargar las fotos.');
      }
    } catch (err) {
      setError('Error al cargar las fotos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (publicId: string) => {
    startTransition(async () => {
      setError(null);
      const res = await deleteProductPhoto(publicId);
      if (res.success) {
        setPhotos((prev) => prev.filter((p) => p.publicId !== publicId));
      } else {
        setError(res.error || 'No se pudo eliminar la foto.');
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product?.id) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      uploadPhoto(product.id!, base64String);
    };
    reader.onerror = () => {
      setError('Error al leer el archivo.');
    };
    
    // Reset input
    e.target.value = '';
  };

  const uploadPhoto = (productId: string, base64: string) => {
    startTransition(async () => {
      setError(null);
      const res = await uploadProductPhoto(productId, base64);
      if (res.success) {
        // Add new photo to list and switch to view tab
        setPhotos((prev) => [res.data as any, ...prev]);
        setActiveTab('view');
      } else {
        setError(res.error || 'No se pudo subir la foto.');
      }
    });
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title='Gestionar Fotos'
    >
      <div className='text-sm text-zinc-500 dark:text-zinc-400 mb-2'>
        {product ? `Fotos para: ${product.device?.name || ''}` : ''}
      </div>
      <div className='flex flex-col gap-4 py-4 min-h-[300px]'>
        <div className='flex rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-1 shrink-0'>
          <button
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'view'
                ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Ver Fotos ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Subir Foto
          </button>
        </div>

        {error && <ErrorAlert error={error} />}

        {activeTab === 'view' && (
          <div className='flex-1 overflow-y-auto custom-scrollbar pr-2'>
            {isLoading ? (
              <div className='flex items-center justify-center h-40'>
                <Loader2 className='w-8 h-8 animate-spin text-zinc-400' />
              </div>
            ) : photos.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-40 text-zinc-500'>
                <ImageIcon className='w-12 h-12 mb-2 opacity-20' />
                <p>No hay fotos para este producto.</p>
              </div>
            ) : (
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                {photos.map((photo) => (
                  <div key={photo.publicId} className='relative group aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800'>
                    <img src={photo.url} alt='Product photo' className='w-full h-full object-contain p-2' />
                    <button
                      onClick={() => handleDelete(photo.publicId)}
                      disabled={isPending}
                      className='absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm disabled:opacity-50'
                      title='Eliminar foto'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className='flex flex-col gap-4 justify-center items-center h-full min-h-[200px]'>
            <input
              type='file'
              accept='image/*'
              ref={fileInputRef}
              className='hidden'
              onChange={handleFileUpload}
            />
            <input
              type='file'
              accept='image/*'
              capture='environment'
              ref={cameraInputRef}
              className='hidden'
              onChange={handleFileUpload}
            />

            <Button
              type='button'
              variant='outline'
              className='w-full max-w-xs h-14'
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className='w-5 h-5' />}
            >
              Seleccionar Archivo
            </Button>
            
            <div className='flex items-center gap-4 w-full max-w-xs'>
              <div className='h-px bg-zinc-200 dark:bg-zinc-800 flex-1' />
              <span className='text-xs text-zinc-500 uppercase tracking-wider font-medium'>o</span>
              <div className='h-px bg-zinc-200 dark:bg-zinc-800 flex-1' />
            </div>

            <Button
              type='button'
              variant='primary'
              className='w-full max-w-xs h-14'
              disabled={isPending}
              onClick={() => cameraInputRef.current?.click()}
              leftIcon={<Camera className='w-5 h-5' />}
            >
              Tomar Foto
            </Button>

            {isPending && (
              <div className='flex items-center gap-2 text-sm text-zinc-500 mt-4'>
                <Loader2 className='w-4 h-4 animate-spin' />
                Procesando imagen...
              </div>
            )}
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
