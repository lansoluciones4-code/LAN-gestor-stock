'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PackageSearch } from 'lucide-react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { ProductCard } from '../product-card';

interface CatalogGridProps {
  products: ProductDef[];
  onResetFilters: () => void;
}

export function CatalogGrid({ products, onResetFilters }: CatalogGridProps) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex flex-col items-center justify-center py-24 text-center space-y-4'
      >
        <div className='w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4'>
          <PackageSearch className='w-10 h-10 text-zinc-400' />
        </div>
        <h3 className='text-xl font-bold text-zinc-900 dark:text-white'>No encontramos lo que buscas</h3>
        <p className='text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto'>Prueba ajustando los filtros o el término de búsqueda para encontrar otros accesorios.</p>
        <button
          onClick={onResetFilters}
          className='mt-4 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl'
        >
          Ver todos los productos
        </button>
      </motion.div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
      <AnimatePresence mode='popLayout'>
        {products.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className='h-full'
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
