import * as React from 'react';

interface ToggleFilterProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  'data-testid'?: string;
}

export function ToggleFilter({ id, checked, onChange, label, ...props }: ToggleFilterProps) {
  return (
    <div
      className='flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm w-full sm:w-auto h-11 shrink-0'
      {...props}
    >
      <input
        type='checkbox'
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className='w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700'
      />
      <label
        htmlFor={id}
        className='text-base font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none'
      >
        {label}
      </label>
    </div>
  );
}
