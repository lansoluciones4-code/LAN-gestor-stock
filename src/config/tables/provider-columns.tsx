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
                  className={`p-1.5 rounded-lg transition ${p.isActive ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'}`}
                  title={p.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Plus className={`w-4 h-4 ${p.isActive ? 'rotate-45' : ''}`} />
                </button>
                <button
                  onClick={() => onEdit(p)}
                  className='p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition'
                  title='Editar'
                >
                  <Edit className='w-4 h-4' />
                </button>
                <button
                  onClick={() => onDelete(p.id!)}
                  className='p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition'
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
