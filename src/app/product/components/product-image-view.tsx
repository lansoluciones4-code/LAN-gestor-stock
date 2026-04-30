'use client';

import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

interface ProductImageViewProps {
  imagePath: string;
  deviceName: string;
  isOutOfStock: boolean;
}

export function ProductImageView({ imagePath, deviceName, isOutOfStock }: ProductImageViewProps) {
  const [imageStatus, setImageStatus] = useState<'loading' | 'error' | 'loaded'>('loading');

  useEffect(() => {
    setImageStatus('loading');
  }, [imagePath]);

  return (
    <div className='relative aspect-square rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden p-12 shadow-sm w-full max-w-xl mx-auto'>
      {/* Placeholder / Icono de Error (Package) */}
      {imageStatus !== 'loaded' && (
        <div className='flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 transition-opacity duration-300'>
          <Package className='w-16 h-16 stroke-[1.5] mb-4' />
          <span className='text-xs font-medium tracking-widest uppercase'>Pronto</span>
        </div>
      )}

      {/* Imagen con fade-in */}
      {imageStatus !== 'error' && (
        <img
          src={imagePath}
          alt={deviceName}
          className={`object-contain w-full h-full transition-all duration-700 hover:scale-105 absolute inset-0 p-12 ${imageStatus === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          onLoad={() => setImageStatus('loaded')}
          onError={() => setImageStatus('error')}
        />
      )}

      {isOutOfStock && (
        <div className='absolute top-8 right-8'>
          <span className='bg-zinc-900 dark:bg-black text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-2xl'>Agotado</span>
        </div>
      )}
    </div>
  );
}
