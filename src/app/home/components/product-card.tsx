'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { type ProductDef } from '@/schemas/product.schema';
import { Package } from 'lucide-react';

export function ProductCard({ product }: { product: ProductDef }) {
  const [imageError, setImageError] = useState(false);
  const deviceName = product.device?.name || 'Accesorio Apple';

  // Normalize name for image file: "Funda iPhone 15 Pro Max" -> "funda-iphone-15-pro-max"
  const normalizedName = deviceName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const imagePath = `/products/${normalizedName}.webp`;
  const isOutOfStock = product.stock <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`group relative flex flex-col bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all ${
        isOutOfStock ? 'opacity-70 grayscale-[0.3]' : ''
      }`}
    >
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center overflow-hidden p-4 sm:p-6">
        {!imageError ? (
          <img
            src={imagePath}
            alt={deviceName}
            className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
            <Package className="w-10 h-10 sm:w-16 sm:h-16 stroke-[1.5] mb-2 sm:mb-4" />
            <span className="text-[10px] sm:text-xs font-medium tracking-widest uppercase">Pronto</span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <span className="bg-zinc-900/80 dark:bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-wider">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 sm:p-6 text-center">
        <h3 className="text-sm sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1.5 sm:mb-2 line-clamp-1">
          {deviceName}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 md:line-clamp-3 mb-3 sm:mb-4 leading-relaxed flex-1">
          {product.description || 'Diseñado con precisión para ofrecer la mejor experiencia y protección para tu dispositivo.'}
        </p>
        <div className="mt-auto">
          <span className="text-base sm:text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            ${product.salePrice.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
