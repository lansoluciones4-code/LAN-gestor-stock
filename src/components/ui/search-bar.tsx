import { Search } from 'lucide-react';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  containerClassName?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar...', containerClassName = '', className = '', ...props }: SearchBarProps) {
  return (
    <div className={`relative flex-1 min-w-0 ${containerClassName}`}>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400' />
      <input
        type='text'
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors shadow-sm text:xs md:text-[12px] lg:text-[16px] placeholder:text-xs md:placeholder:text-[12px] lg:placeholder:text-[16px] ${className}`}
        {...props}
      />
    </div>
  );
}
