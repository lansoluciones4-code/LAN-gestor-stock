import { type SparePartDef } from '@/features/spare-part/domain/spare-part.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Edit, Trash2 } from 'lucide-react';

interface ColumnActions {
  onEdit: (s: SparePartDef) => void;
  onDelete: (id: string) => void;
  role?: string;
}

export function getSparePartColumns({ onEdit, onDelete, role }: ColumnActions): ColumnDef<SparePartDef>[] {
  return [
    {
      header: 'Repuesto',
      cellClassName: 'max-w-[220px]',
      cell: (s) => (
        <div
          className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0'
          title={s.title}
        >
          <span className='truncate'>{s.title}</span>
          <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-black rounded uppercase ${s.condition === 'nuevo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>{s.condition}</span>
        </div>
      ),
    },
    {
      header: 'Cliente',
      cellClassName: 'text-zinc-500 max-w-[180px] truncate',
      cell: (s) => <span title={s.customer?.name || '---'}>{s.customer?.name || '---'}</span>,
    },
    {
      header: 'Costo',
      cellClassName: 'text-zinc-500',
      cell: (s) => `$${s.cost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: 'Ganancia',
      cellClassName: 'font-semibold text-emerald-600 dark:text-emerald-400',
      cell: (s) => `$${s.profitAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${s.profitPercentage}%)`,
    },
    {
      header: 'Precio Venta',
      cellClassName: 'font-semibold text-zinc-600 dark:text-zinc-400',
      cell: (s) => `$${s.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: 'Estado',
      cell: (s) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${s.sold ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'}`}>{s.sold ? 'Vendido' : 'Pendiente'}</span>
      ),
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      cellClassName: 'flex gap-1 justify-end',
      cell: (s) =>
        s.sold || role !== 'admin' ? (
          <span className='text-[10px] text-zinc-400 uppercase font-bold'>--</span>
        ) : (
          <>
            <button
              onClick={() => onEdit(s)}
              className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400 rounded-lg transition-colors'
              title='Editar'
            >
              <Edit className='w-4 h-4' />
            </button>
            <button
              onClick={() => onDelete(s.id!)}
              className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors'
              title='Eliminar'
            >
              <Trash2 className='w-4 h-4' />
            </button>
          </>
        ),
    },
  ];
}
