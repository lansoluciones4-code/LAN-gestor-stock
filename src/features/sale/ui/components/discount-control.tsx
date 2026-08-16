'use client';

import { Percent } from 'lucide-react';

/** Botón "Desc" blanco + ícono % negro, con editor inline — compartido por las líneas de carrito de Nueva Venta y Venta Rápida. */
export function DiscountControl({ discountPercentage, isEditing, onToggle, value, onValueChange, onApply, onClear }: { discountPercentage: number; isEditing: boolean; onToggle: () => void; value: string; onValueChange: (v: string) => void; onApply: () => void; onClear: () => void }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={onToggle}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase border bg-white transition-colors ${discountPercentage > 0 ? 'border-zinc-900 dark:border-zinc-100' : 'border-zinc-200 hover:border-zinc-400'}`}
          title='Descuento para este ítem'
        >
          <Percent className='w-3 h-3 text-zinc-900' />
          <span className='text-zinc-900'>Desc</span>
        </button>
        {discountPercentage > 0 && <span className='text-[10px] font-bold text-zinc-500'>-{discountPercentage}%</span>}
      </div>
      {isEditing && (
        <div className='flex items-center gap-1.5'>
          <input
            type='text'
            inputMode='decimal'
            autoFocus
            value={value}
            onChange={(e) => onValueChange(e.target.value.replace(/[^0-9,]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
            placeholder='0'
            className='w-14 px-2 py-1 text-xs border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
          />
          <span className='text-xs font-bold text-zinc-400'>%</span>
          <button
            type='button'
            onClick={onApply}
            className='px-2.5 py-1 text-[10px] font-bold uppercase bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg'
          >
            Aplicar
          </button>
          {discountPercentage > 0 && (
            <button
              type='button'
              onClick={onClear}
              className='text-[10px] font-bold uppercase text-zinc-400 hover:text-red-500'
            >
              Quitar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
