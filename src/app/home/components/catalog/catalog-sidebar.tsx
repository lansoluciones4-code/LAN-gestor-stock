'use client';

import { type DeviceDef } from '@/features/device/domain/device.schema';
import { Tag, ChevronRight } from 'lucide-react';
import { toSentenceCase } from '@/lib/utils';

interface CatalogSidebarProps {
  categories: DeviceDef[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CatalogSidebar({ categories, selectedCategory, onSelectCategory }: CatalogSidebarProps) {
  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <h3 className='text-xs font-bold uppercase tracking-widest text-zinc-400 px-2 mb-4 flex items-center gap-2 shrink-0'>
        <Tag className='w-3 h-3' /> Categorías
      </h3>

      <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1'>
        <button
          type='button'
          onClick={() => onSelectCategory(null)}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 focus:ring-0 active:outline-none select-none border ${selectedCategory === null ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-zinc-200 dark:border-zinc-700' : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50'}`}
        >
          Todos los productos
        </button>
        {categories.map((category) => (
          <button
            type='button'
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between outline-none focus:outline-none ring-0 focus:ring-0 active:outline-none select-none border group ${selectedCategory === category.id ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-zinc-200 dark:border-zinc-700' : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50'}`}
          >
            <span className='truncate pr-2'>{toSentenceCase(category.name)}</span>
            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${selectedCategory === category.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
