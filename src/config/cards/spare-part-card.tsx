/* eslint-disable react/display-name */
import { Edit, Trash2 } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type SparePartDef } from '@/features/spare-part/domain/spare-part.schema';

interface SparePartCardActionsProps {
  onEdit: (s: SparePartDef) => void;
  onDelete: (id: string) => void;
  role?: string;
}

export function renderSparePartCard(actions: SparePartCardActionsProps) {
  return (sparePart: SparePartDef) => (
    <EntityCard
      key={sparePart.id}
      title={sparePart.title}
      badges={
        <div className='flex gap-1'>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${sparePart.condition === 'nuevo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>{sparePart.condition}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${sparePart.sold ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'}`}>{sparePart.sold ? 'Vendido' : 'Pendiente'}</span>
        </div>
      }
      details={
        <div className='flex flex-col gap-1 mt-1'>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Cliente</span>
            <span
              className='truncate max-w-[180px]'
              title={sparePart.customer?.name || 'Sin cliente asociado'}
            >
              {sparePart.customer?.name || 'Sin cliente asociado'}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Costo</span>
            <span>${sparePart.cost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Ganancia ({sparePart.profitPercentage}%)</span>
            <span className='font-bold text-emerald-600 dark:text-emerald-400'>${sparePart.profitAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Precio Venta</span>
            <span className='font-bold text-zinc-900 dark:text-zinc-100'>${sparePart.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      }
      actions={
        sparePart.sold || actions.role !== 'admin' ? undefined : (
          <>
            <CardAction
              icon={<Edit className='w-4 h-4' />}
              label='Editar'
              onClick={() => actions.onEdit(sparePart)}
            />
            <CardAction
              icon={<Trash2 className='w-4 h-4' />}
              label='Eliminar'
              onClick={() => actions.onDelete(sparePart.id!)}
              variant='danger'
            />
          </>
        )
      }
    />
  );
}
