'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Tag, ChevronRight } from 'lucide-react';
import { type DeviceDef } from '@/features/device/domain/device.schema';
import { toSentenceCase } from '@/lib/utils';
import { useEffect } from 'react';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DeviceDef[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
}

export function MobileFilterDrawer({ isOpen, onClose, categories, selectedCategory, onSelectCategory, minPrice, onMinPriceChange, maxPrice, onMaxPriceChange }: MobileFilterDrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 bg-black/60 backdrop-blur-sm z-100 lg:hidden'
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white dark:bg-zinc-950 z-101 lg:hidden p-6 shadow-2xl flex flex-col'
          >
            <div className='flex items-center justify-between mb-8'>
              <h2 className='text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2'>
                <SlidersHorizontal className='w-5 h-5' /> Filtros
              </h2>
              <button
                onClick={onClose}
                className='p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors'
              >
                <X className='w-6 h-6' />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto space-y-10 pr-2'>
              <section>
                <h3 className='text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2'>
                  <Tag className='w-3 h-3' /> Categorías
                </h3>
                <div className='grid grid-cols-1 gap-2'>
                  <button
                    onClick={() => {
                      onSelectCategory(null);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 focus:ring-0 active:outline-none select-none border ${selectedCategory === null ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-zinc-200 dark:border-zinc-700' : 'border-transparent bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400'}`}
                  >
                    Todos los productos
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        onSelectCategory(category.id);
                        onClose();
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between outline-none focus:outline-none ring-0 focus:ring-0 active:outline-none select-none border ${selectedCategory === category.id ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'border-transparent bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400'}`}
                    >
                      {toSentenceCase(category.name)}
                      {selectedCategory === category.id && <ChevronRight className='w-4 h-4' />}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className='pt-6 border-t border-zinc-100 dark:border-zinc-800'>
              <button
                onClick={onClose}
                className='w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform'
              >
                Ver Resultados
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
