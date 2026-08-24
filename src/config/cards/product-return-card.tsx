/* eslint-disable react/display-name */
import { type ProductReturnDef } from '@/features/product-return/domain/product-return.schema';

/** Historial de solo lectura — sin acciones, por eso no usa EntityCard (que siempre muestra el menú "⋮"). */
export function renderProductReturnCard() {
  return (item: ProductReturnDef) => (
    <div
      key={item.id}
      className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-2 animate-in fade-in duration-200'
    >
      <div className='flex items-start justify-between gap-2'>
        <div
          className='font-bold text-zinc-900 dark:text-zinc-100 truncate'
          title={item.product?.device?.name || 'Producto eliminado'}
        >
          {item.product?.device?.name || 'Producto eliminado'}
        </div>
        <span className='shrink-0 font-black text-zinc-700 dark:text-zinc-300'>${item.amount.toLocaleString('es-AR')}</span>
      </div>

      <div className='text-sm text-zinc-600 dark:text-zinc-400 space-y-1'>
        <div className='flex justify-between'>
          <span className='text-xs text-zinc-400'>Cantidad</span>
          <span>{item.quantity}</span>
        </div>
        <div className='flex justify-between gap-2'>
          <span className='text-xs text-zinc-400 shrink-0'>Motivo</span>
          <span
            className='truncate max-w-[180px]'
            title={item.reason}
          >
            {item.reason}
          </span>
        </div>
        <div className='flex justify-between'>
          <span className='text-xs text-zinc-400'>Usuario</span>
          <span>{item.user?.username || 'Desconocido'}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-xs text-zinc-400'>Fecha</span>
          <span>{new Date(item.createdAt).toLocaleDateString('es-AR')}</span>
        </div>
      </div>
    </div>
  );
}
