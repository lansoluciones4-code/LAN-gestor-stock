'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X, Plus } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface ComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  addNewLabel?: string;
  onAddNew?: () => void;
  className?: string;
  'data-testid'?: string;
  searchTestId?: string;
}

export function Combobox({ options, value, onChange, placeholder = 'Seleccionar...', searchPlaceholder = 'Buscar...', emptyMessage = 'No se encontraron resultados.', addNewLabel, onAddNew, className = '', 'data-testid': testId, searchTestId }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = options.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()));

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      ref={containerRef}
      data-testid={testId}
    >
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='flex h-10 w-full items-center justify-between rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors'
      >
        <span className='truncate'>{selectedOption ? selectedOption.name : placeholder}</span>
        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
      </button>

      {open && (
        <div className='absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl animate-in fade-in zoom-in-95 duration-200'>
          <div className='flex items-center border-b border-zinc-100 dark:border-zinc-800 px-3'>
            <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
            <input
              className='flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50'
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              data-testid={searchTestId}
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className='h-4 w-4 opacity-50 hover:opacity-100' />
              </button>
            )}
          </div>
          <div className='overflow-y-auto max-h-[200px] custom-scrollbar border-b border-zinc-100 dark:border-zinc-800'>
            {addNewLabel && (
              <button
                type='button'
                className='flex w-full items-center py-2.5 px-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors shrink-0 border-b border-zinc-50 dark:border-zinc-800/50'
                onClick={() => {
                  onAddNew?.();
                  setOpen(false);
                }}
              >
                {addNewLabel}
              </button>
            )}

            {filteredOptions.length === 0 && !addNewLabel && <div className='py-6 text-center text-sm text-zinc-500'>{emptyMessage}</div>}

            {filteredOptions.map((opt) => (
              <button
                key={opt.id}
                type='button'
                className='relative flex w-full cursor-default select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left font-medium'
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <Check className={`mr-2 h-4 w-4 ${value === opt.id ? 'opacity-100' : 'opacity-0'} text-indigo-500`} />
                <span className='truncate'>{opt.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
