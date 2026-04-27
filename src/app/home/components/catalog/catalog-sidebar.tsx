'use client';

import { type DeviceDef } from '@/schemas/device.schema';
import { Tag, SlidersHorizontal, ChevronRight } from 'lucide-react';

interface CatalogSidebarProps {
  categories: DeviceDef[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
}

export function CatalogSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
}: CatalogSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 shrink-0 space-y-8">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 px-2 flex items-center gap-2">
          <Tag className="w-3 h-3" /> Categorías
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none focus:outline-none ring-0 focus:ring-0 active:outline-none select-none border ${
              selectedCategory === null
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-zinc-200 dark:border-zinc-700'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            Todos los productos
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between outline-none focus:outline-none ring-0 focus:ring-0 active:outline-none select-none border group ${
                selectedCategory === category.id
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-zinc-200 dark:border-zinc-700'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {category.name}
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  selectedCategory === category.id
                    ? 'translate-x-0'
                    : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 px-2 flex items-center gap-2">
          <SlidersHorizontal className="w-3 h-3" /> Rango de Precio
        </h3>
        <div className="grid grid-cols-2 gap-2 px-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase ml-1">Mín</label>
            <input
              type="number"
              placeholder="$ 0"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase ml-1">Máx</label>
            <input
              type="number"
              placeholder="Sin tope"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
