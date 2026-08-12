import { type ProviderDef } from '@/features/provider/domain/provider.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ColumnActions {
  role?: string;
  onEdit: (p: ProviderDef) => void;
  onToggleActive: (p: ProviderDef) => void;
  onDelete: (id: string) => void;
}

export function getProviderColumns({ role, onEdit, onToggleActive, onDelete }: ColumnActions): ColumnDef<ProviderDef>[] {
  return [
    {
      header: 'Empresa / Mayorista',
      cellClassName: 'max-w-[200px]',
      cell: (p) => (
        <div
          className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0'
          title={p.name}
        >
          <span className='truncate'>{p.name}</span>
          {!p.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
        </div>
      ),
    },
    {
      header: 'Teléfono',
      cellClassName: 'text-zinc-500',
      cell: (p) => p.phone || '---',
    },
    {
      header: 'Correo',
      cellClassName: 'text-zinc-500 max-w-[150px] truncate',
      cell: (p) => <span title={p.email || '---'}>{p.email || '---'}</span>,
    },
    ...(role === 'admin'
      ? [
          {
            header: 'Acciones',
            headerClassName: 'text-right',
            cellClassName: 'flex gap-1 justify-end',
            cell: (p: ProviderDef) => (
              <>
                <button
                  onClick={() => onToggleActive(p)}
                  className='p-1.5 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                  title={p.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Plus className={`w-4 h-4 ${p.isActive ? 'rotate-45' : ''}`} />
                </button>
                <button
                  onClick={() => onEdit(p)}
                  className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400 rounded-lg transition-colors'
                  title='Editar'
                >
                  <Edit className='w-4 h-4' />
                </button>
                <button
                  onClick={() => onDelete(p.id!)}
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
