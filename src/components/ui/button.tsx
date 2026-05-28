'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export function Button({ children, variant = 'primary', fullWidth = false, leftIcon, size = 'md', className = '', isLoading, disabled, ...props }: ButtonProps) {
  const baseStyles = 'flex items-center justify-center gap-2 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2.5',
  };

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
    outline: 'bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900',
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : leftIcon && <span>{leftIcon}</span>}
      {children}
    </button>
  );
}
