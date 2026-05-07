'use client';

import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  onClear?: () => void;
}

export function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, onClear }: DateRangePickerProps) {
  return (
    <div className='flex flex-wrap sm:flex-nowrap items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-zinc-800 w-full sm:w-auto'>
      <div className='flex items-center px-3 py-1.5 flex-1 sm:flex-none'>
        <input
          type='date'
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className='bg-transparent text-sm font-bold outline-none border-none p-0 focus:ring-0 w-full sm:w-[125px] dark:text-zinc-100 cursor-pointer h-7'
        />
      </div>
      <div className='flex items-center px-3 py-1.5 flex-1 sm:flex-none'>
        <input
          type='date'
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className='bg-transparent text-sm font-bold outline-none border-none p-0 focus:ring-0 w-full sm:w-[125px] dark:text-zinc-100 cursor-pointer h-7'
        />
        {(startDate || endDate) && onClear && (
          <button
            onClick={onClear}
            className='ml-2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500 transition-all'
            title='Limpiar Filtro'
          >
            <X className='w-4 h-4' />
          </button>
        )}
      </div>
    </div>
  );
}
