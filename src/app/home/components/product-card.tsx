'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import { ContactButtons } from '@/components/contact/contact-buttons';

interface ProductCardProps {
  product: ProductDef;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageStatus, setImageStatus] = useState<'loading' | 'error' | 'loaded'>('loading');
  const deviceName = product.device?.name || 'Accesorio Apple';

  const imagePath = `/products/${slugify(deviceName)}.webp`;
  const isOutOfStock = product.stock <= 0;

  useEffect(() => {
    setImageStatus('loading');
  }, [imagePath]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`h-full group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 ${
        isOutOfStock ? 'opacity-70 grayscale-[0.3]' : ''
      }`}
    >
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1">
        <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center overflow-hidden p-3 sm:p-4">
          {/* Placeholder / Icono de Error (Package) */}
          {imageStatus !== 'loaded' && (
            <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 transition-opacity duration-300">
              <Package className="w-8 h-8 sm:w-12 sm:h-12 stroke-[1.5] mb-2 sm:mb-3" />
              <span className="text-[9px] sm:text-[10px] font-medium tracking-widest uppercase">Pronto</span>
            </div>
          )}

          {/* Imagen con fade-in */}
          {imageStatus !== 'error' && (
            <img
              src={imagePath}
              alt={deviceName}
              className={`object-contain w-full h-full transition-all duration-500 group-hover:scale-105 absolute inset-0 p-3 sm:p-4 ${
                imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageStatus('loaded')}
              onError={() => setImageStatus('error')}
            />
          )}

          {isOutOfStock && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <span className="bg-zinc-900/80 dark:bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-wider">
                Agotado
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-3 sm:p-4 text-center">
          <h3 className="text-xs sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1 sm:mb-1.5 line-clamp-1">
            {deviceName}
          </h3>
          <p className="text-[11px] sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2 sm:mb-3 leading-relaxed flex-1">
            {product.description || 'Diseñado con precisión para ofrecer la mejor experiencia y protección.'}
          </p>
          <div className="mb-3">
            <span className="text-sm sm:text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
              ${product.salePrice.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </Link>
      
      {!isOutOfStock && (
        <div className="px-3 pb-4 pt-0 mt-auto">
          <ContactButtons 
            product={{ name: deviceName, description: product.description }} 
            size="sm" 
            showLabels={false}
          />
        </div>
      )}
    </motion.div>
  );
}
