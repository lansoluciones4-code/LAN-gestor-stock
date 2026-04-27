'use client';

import { TEST_IDS } from '@/constants/test-ids';

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-12 md:mt-16 text-sm font-medium">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 ${
          currentPage === 1
            ? 'pointer-events-none opacity-40'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300'
        }`}
        data-testid={TEST_IDS.landing.btnAnteriorPag}
      >
        Anterior
      </button>

      <div className="flex flex-wrap justify-center gap-1 mx-1 sm:mx-4">
        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1;
          const isActive = currentPage === pageNum;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors focus:outline-none ${
                isActive
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 ${
          currentPage === totalPages
            ? 'pointer-events-none opacity-40'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300'
        }`}
        data-testid={TEST_IDS.landing.btnSiguientePag}
      >
        Siguiente
      </button>
    </div>
  );
}
