'use client';

import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

interface PanelToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  searchPlaceholderMobile?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  'data-testid'?: string;
}

/**
 * Shared toolbar used across all management panels.
 * Stacks vertically on mobile, side-by-side on sm+.
 *
 * Slots:
 *   filters  — ToggleFilter, DateRangePicker, price-range inputs, etc.
 *   actions  — sync button, add button, etc.
 */
export function PanelToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  searchPlaceholderMobile,
  filters,
  actions,
  'data-testid': testId,
}: PanelToolbarProps) {
  return (
    <div className='flex flex-col gap-3 mb-6 shrink-0'>
      {/* Row 1: search + filters */}
      <div className='flex flex-col sm:flex-row gap-2'>
        <div className='relative flex-1'>
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
        {filters && <div className='flex items-center gap-2 flex-wrap'>{filters}</div>}
      </div>

      {/* Row 2: action buttons (right-aligned) */}
      {actions && (
        <div className='flex items-center justify-end gap-2'>
          {actions}
        </div>
      )}
    </div>
  );
}
