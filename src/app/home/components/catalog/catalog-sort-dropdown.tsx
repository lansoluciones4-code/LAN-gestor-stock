'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { type CatalogSortBy } from './use-catalog-filters';

const SORT_OPTIONS: { value: CatalogSortBy; label: string }[] = [
  { value: 'default', label: 'Relevancia' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'most_viewed', label: 'Más vistos' },
];

export function CatalogSortDropdown({ value, onChange }: { value: CatalogSortBy; onChange: (val: CatalogSortBy) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div
      className='relative flex-1 sm:flex-none sm:min-w-[210px]'
      ref={containerRef}
    >
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='w-full flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-12 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500'
      >
        <ArrowUpDown className='w-4 h-4 text-zinc-400 shrink-0' />
        <span className='flex-1 text-left truncate whitespace-nowrap'>{current.label}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className='absolute left-0 right-0 sm:right-auto top-full mt-2 z-30 sm:w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150'>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type='button'
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-left transition-colors ${opt.value === value ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
            >
              {opt.label}
              {opt.value === value && <Check className='w-4 h-4 shrink-0' />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
