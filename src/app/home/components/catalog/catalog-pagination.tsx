'use client';

import { TEST_IDS } from '@/constants/test-ids';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({ currentPage, totalPages, onPageChange }: CatalogPaginationProps) {
  const pages = useMemo(() => {
    const totalSlots = 7;

    if (totalPages <= totalSlots) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

    const showLeftDots = leftSiblingIndex > 3;
    const showRightDots = rightSiblingIndex < totalPages - 2;

    if (!showLeftDots && showRightDots) {
      return [1, 2, 3, 4, 5, 'dots', totalPages];
    }

    if (showLeftDots && !showRightDots) {
      return [1, 'dots', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'dots', currentPage - 1, currentPage, currentPage + 1, 'dots', totalPages];
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav
      className='flex items-center justify-center gap-1 sm:gap-2 mt-2 md:pb-2 px-4'
      aria-label='Navegación de páginas'
    >
      {/* Botón Anterior */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className='w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none'
        data-testid={TEST_IDS.landing.btnAnteriorPag}
      >
        <ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5' />
      </button>

      {/* Números de Página */}
      <div className='flex items-center gap-0.5 sm:gap-1'>
        {pages.map((page, idx) => {
          if (page === 'dots') {
            return (
              <div
                key={`dots-${idx}`}
                className='w-6 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-zinc-300 dark:text-zinc-700 tracking-widest text-[10px]'
              >
                •••
              </div>
            );
          }

          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`
                w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all duration-200 border
                ${isActive ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border-zinc-200 dark:border-zinc-700 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:bg-white/50 dark:hover:bg-zinc-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className='w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none'
        data-testid={TEST_IDS.landing.btnSiguientePag}
      >
        <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5' />
      </button>
    </nav>
  );
}
