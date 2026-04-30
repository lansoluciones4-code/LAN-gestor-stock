'use client';

import { SearchBar } from '@/components/ui/search-bar';
import { Filter, Tag, X } from 'lucide-react';
import { type DeviceDef } from '@/features/device/domain/device.schema';
import { toSentenceCase } from '@/lib/utils';
import { TEST_IDS } from '@/constants/test-ids';

interface CatalogControlsProps {
  search: string;
  onSearchChange: (val: string) => void;
  onOpenFilters: () => void;
  selectedCategory: string | null;
  categories: DeviceDef[];
  onClearCategory: () => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
}

export function CatalogControls({ search, onSearchChange, onOpenFilters, selectedCategory, categories, onClearCategory, minPrice, onMinPriceChange, maxPrice, onMaxPriceChange }: CatalogControlsProps) {
  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove special characters, allow only alphanumeric and spaces
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
    onSearchChange(sanitized);
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent non-numeric keys, except navigation and deletion keys
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
    if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumericPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text');
    if (!/^\d*$/.test(pastedData)) {
      e.preventDefault();
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col xl:flex-row gap-4 items-stretch xl:items-center'>
        <div className='flex-1 min-w-0'>
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder='Buscar por nombre o descripción...'
            containerClassName='w-full'
            data-testid={TEST_IDS.general.inputBusquedaTabla}
          />
        </div>
        <div className='flex flex-wrap sm:flex-nowrap gap-2 items-center'>
          <div className='flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-12 flex-1 sm:flex-none sm:w-32 group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all outline-none'>
            <span className='text-[10px] font-bold text-zinc-400 uppercase select-none'>Mín</span>
            <input
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              placeholder='$ 0'
              value={minPrice}
              onKeyDown={handleNumericKeyDown}
              onPaste={handleNumericPaste}
              onChange={(e) => onMinPriceChange(e.target.value.replace(/\D/g, ''))}
              className='w-full bg-transparent border-none text-sm focus:ring-0 p-0 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 font-medium outline-none'
            />
          </div>

          <div className='flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-12 flex-1 sm:flex-none sm:w-32 group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all outline-none'>
            <span className='text-[10px] font-bold text-zinc-400 uppercase select-none'>Máx</span>
            <input
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              placeholder='$ 0'
              value={maxPrice}
              onKeyDown={handleNumericKeyDown}
              onPaste={handleNumericPaste}
              onChange={(e) => onMaxPriceChange(e.target.value.replace(/\D/g, ''))}
              className='w-full bg-transparent border-none text-sm focus:ring-0 p-0 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 font-medium outline-none'
            />
          </div>

          <button
            onClick={onOpenFilters}
            className='lg:hidden flex items-center justify-center gap-2 px-4 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all whitespace-nowrap focus:outline-none'
          >
            <Filter className='w-4 h-4' />
            <span className='hidden sm:inline'>Categorías</span>
          </button>
        </div>
      </div>

      {selectedCategory && (
        <div className='flex lg:hidden items-center gap-2 px-3 py-1.5 w-fit bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full text-xs font-medium text-indigo-600 dark:text-indigo-400'>
          <Tag className='w-3.5 h-3.5' />
          {toSentenceCase(selectedCategoryName)}
          <button
            onClick={onClearCategory}
            className='ml-1 p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full transition-colors'
          >
            <X className='w-3 h-3' />
          </button>
        </div>
      )}
    </div>
  );
}
