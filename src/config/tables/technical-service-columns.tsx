import { type TechnicalServiceDef } from '@/features/technical-service/domain/technical-service.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ColumnActions {
  role?: string;
  onEdit: (s: TechnicalServiceDef) => void;
  onToggleActive: (s: TechnicalServiceDef) => void;
  onDelete: (id: string) => void;
}

export function getTechnicalServiceColumns({ role, onEdit, onToggleActive, onDelete }: ColumnActions): ColumnDef<TechnicalServiceDef>[] {
  return [
    {
      header: 'Nombre',
      cellClassName: 'max-w-[200px]',
      cell: (s) => (
        <div
          className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0'
          title={s.name}
        >
          <span className='truncate'>{s.name}</span>
          {!s.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
        </div>
      ),
    },
    {
      header: 'Descripción',
      cellClassName: 'text-zinc-500 max-w-[300px] truncate',
      cell: (s) => <span title={s.description || '---'}>{s.description || '---'}</span>,
    },
    {
      header: 'Valor',
      cellClassName: 'font-semibold text-zinc-600 dark:text-zinc-400',
      cell: (s) => `$${s.value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    ...(role === 'admin'
      ? [
          {
            header: 'Acciones',
            headerClassName: 'text-right',
            cellClassName: 'flex gap-1 justify-end',
            cell: (s: TechnicalServiceDef) => (
              <>
                <button
                  onClick={() => onToggleActive(s)}
                  className='p-1.5 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                  title={s.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Plus className={`w-4 h-4 ${s.isActive ? 'rotate-45' : ''}`} />
                </button>
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
        ]
      : []),
  ];
}
