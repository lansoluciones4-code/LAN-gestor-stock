'use client';

import { Search, Filter } from 'lucide-react';
import { type ReactNode, useState, useRef, useEffect } from 'react';

interface PanelToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  searchPlaceholderMobile?: string;
  filters?: ReactNode;
  sync?: ReactNode; // New slot for the sync/refresh button
  actions?: ReactNode;
  'data-testid'?: string;
}

export function PanelToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  searchPlaceholderMobile,
  filters,
  sync,
  actions,
  'data-testid': testId,
}: PanelToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFilters) return;
    const handleOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showFilters]);

  return (
    <div className='flex flex-col gap-3 mb-6 shrink-0 relative z-30' ref={filterRef}>
      {/* Row 1: Search Input (hidden on xl) */}
      <div className='relative w-full xl:hidden'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none' />
        <input
          type='text'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholderMobile ?? searchPlaceholder}
          className='w-full h-11 pl-9 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-sm sm:hidden'
          data-testid={testId}
        />
        <input
          type='text'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className='w-full h-11 pl-9 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-sm hidden sm:block'
          data-testid={testId}
        />
      </div>

      {/* Main Row: Controls (Search + Filters + Sync + Actions) */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
        <div className='flex items-center gap-2 flex-1'>
          {/* Inline Search for XL screens */}
          <div className='hidden xl:block relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none' />
            <input
              type='text'
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className='w-full h-11 pl-9 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-sm'
              data-testid={testId}
            />
          </div>

          {filters && (
            <>
              {/* Dropdown button for mobile/tablet */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`xl:hidden flex items-center justify-center gap-2 px-4 h-11 border rounded-lg text-sm font-bold transition-colors flex-1 sm:flex-none ${
                  showFilters 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Filter className='w-4 h-4 shrink-0' />
                <span>Filtros</span>
              </button>

              {/* Inline filters for desktop (xl+) */}
              <div className='hidden xl:flex items-center gap-2'>
                {filters}
              </div>
            </>
          )}
          {sync && (
            <div className='shrink-0'>
              {sync}
            </div>
          )}
        </div>

        {actions && (
          <div className='flex items-center gap-2 w-full sm:w-auto'>
            {actions}
          </div>
        )}
      </div>

      {/* Filter Popover (hidden on xl) */}
      {showFilters && filters && (
        <div className='xl:hidden absolute left-0 sm:left-0 top-full mt-2 w-full sm:w-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-40 animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between'>
            <span className='text-xs font-bold text-zinc-500 uppercase tracking-widest'>Filtros Activos</span>
            <button
              onClick={() => setShowFilters(false)}
              className='text-red-500 hover:text-red-600 text-xs font-bold transition-colors'
            >
              Cerrar
            </button>
          </div>
          <div className='p-4 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-b-xl'>
            <div className='flex flex-wrap gap-3'>
              {filters}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
