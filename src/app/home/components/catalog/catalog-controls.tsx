'use client';

import { SearchBar } from '@/components/ui/search-bar';
import { Filter, Tag, X } from 'lucide-react';
import { type DeviceDef } from '@/schemas/device.schema';
import { toSentenceCase } from '@/lib/utils';

interface CatalogControlsProps {
  search: string;
  onSearchChange: (val: string) => void;
  onOpenFilters: () => void;
  selectedCategory: string | null;
  categories: DeviceDef[];
  onClearCategory: () => void;
}

export function CatalogControls({
  search,
  onSearchChange,
  onOpenFilters,
  selectedCategory,
  categories,
  onClearCategory,
}: CatalogControlsProps) {
  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name;

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="w-full flex-1 min-w-0">
        <SearchBar
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o descripción..."
          containerClassName="w-full"
        />
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        <button
          onClick={onOpenFilters}
          className="lg:hidden flex-1 flex items-center justify-center gap-2 px-4 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all whitespace-nowrap focus:outline-none"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>

        {selectedCategory && (
          <div className="hidden sm:flex lg:hidden items-center gap-2 px-4 h-12 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400">
            <Tag className="w-4 h-4" />
            {toSentenceCase(selectedCategoryName)}
            <button
              onClick={onClearCategory}
              className="ml-1 p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
