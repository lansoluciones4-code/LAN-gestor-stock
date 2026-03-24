'use client';

import { LucideIcon, Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  icon?: LucideIcon;
  className?: string;
}

export function SearchBar({ 
  placeholder = 'Buscar...', 
  value, 
  onChange, 
  icon: Icon = Search,
  className = ''
}: SearchBarProps) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Icon className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
      <input
        type='text'
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors'
      />
    </div>
  );
}
