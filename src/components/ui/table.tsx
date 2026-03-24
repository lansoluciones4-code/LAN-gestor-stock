'use client';

import { ReactNode } from 'react';

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
  isPending?: boolean;
}

export function Table({ headers, children, className = '', isPending = false }: TableProps) {
  return (
    <div className={`relative overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 flex-1 bg-white dark:bg-zinc-900 custom-scrollbar ${className}`}>
      <table className='w-full text-[17px] text-left text-zinc-700 dark:text-zinc-300'>
        <thead className='sticky top-0 z-10 text-[14px] font-black uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'>
          <tr>
            {headers.map((h, i) => {
              // Standard alignments: Total/Importe and Acciones should be right-aligned
              const isRightAligned = h.toLowerCase().includes('total') || 
                                     h.toLowerCase().includes('importe') || 
                                     h.toLowerCase().includes('acciones');
              return (
                <th key={i} scope='col' className={`px-6 py-4 ${isRightAligned ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={`divide-y divide-zinc-200 dark:divide-zinc-800 ${isPending ? 'opacity-50' : ''}`}>
          {children}
        </tbody>
      </table>
    </div>
  );
}
