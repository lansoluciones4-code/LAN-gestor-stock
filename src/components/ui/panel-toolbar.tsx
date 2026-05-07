'use client';

import { Search, Filter } from 'lucide-react';
import { type ReactNode, useState, useRef, useEffect } from 'react';

interface PanelToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  searchPlaceholderMobile?: string;
  filters?: ReactNode;
  sync?: ReactNode; 
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

      {/* Filter Popover / Mobile Drawer */}
      {showFilters && filters && (
        <>
          {/* Overlay for mobile drawer */}
          <div 
            className='xl:hidden fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-300' 
            onClick={() => setShowFilters(false)}
          />
          <div className='xl:hidden fixed inset-x-0 bottom-0 z-50 p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-300 ease-out'>
            <div className='flex items-center justify-between mb-4 px-2'>
              <div className='flex items-center gap-2'>
                <Filter className='w-4 h-4 text-indigo-500' />
                <span className='text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider'>Filtros</span>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className='px-4 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-full transition-colors'
              >
                Hecho
              </button>
            </div>
            <div className='max-h-[70vh] overflow-y-auto px-2 pb-10 scrollbar-none'>
              <div className='flex flex-wrap gap-3'>
                {filters}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
