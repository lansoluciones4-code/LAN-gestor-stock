'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

interface EntityCardProps {
  /** Primary label (e.g. product name, username) */
  title: ReactNode;
  /** Secondary label shown below title */
  subtitle?: ReactNode;
  /** Badge row (e.g. stock badge, status pill) */
  badges?: ReactNode;
  /** Additional detail rows */
  details?: ReactNode;
  /** Action buttons rendered inside the MoreVertical dropdown */
  actions: ReactNode;
}

/**
 * Generic card for mobile/tablet panel views.
 * Actions are hidden inside a MoreVertical (⋮) dropdown that closes on outside click.
 */
export function EntityCard({ title, subtitle, badges, details, actions }: EntityCardProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-2 animate-in fade-in duration-200'>
      {/* Header row: title + action menu */}
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <div className='font-bold text-zinc-900 dark:text-zinc-100 truncate'>{title}</div>
          {subtitle && <div className='text-xs text-zinc-500 truncate mt-0.5'>{subtitle}</div>}
        </div>

        <div className='relative shrink-0' ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className='p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
            aria-label='Acciones'
          >
            <MoreVertical className='w-5 h-5' />
          </button>

          {open && (
            <div className='absolute right-0 top-full mt-1 z-30 min-w-[160px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150'>
              <div
                className='flex flex-col py-1'
                onClick={() => setOpen(false)}
              >
                {actions}
              </div>
            </div>
          )}
        </div>
      </div>

      {badges && <div className='flex flex-wrap gap-1.5'>{badges}</div>}
      {details && <div className='text-sm text-zinc-600 dark:text-zinc-400 space-y-1'>{details}</div>}
    </div>
  );
}

/** A single action item inside the EntityCard dropdown */
export function CardAction({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}) {
  const colors = {
    default: 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800',
    danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10',
    warning: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10',
    success: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors ${colors[variant]}`}
    >
      <span className='w-4 h-4 shrink-0'>{icon}</span>
      <span className='leading-tight whitespace-nowrap'>{label}</span>
    </button>
  );
}
