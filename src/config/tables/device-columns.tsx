import { type DeviceDef } from '@/features/device/domain/device.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function getDeviceColumns({ role, onEdit, onToggleActive, onDelete }: { role?: string; onEdit: (item: DeviceDef) => void; onToggleActive: (item: DeviceDef) => void; onDelete: (id: string) => void }): ColumnDef<DeviceDef>[] {
  const isSuper = role === 'admin';

  return [
    {
      header: 'Sección',
      cellClassName: 'text-zinc-700 dark:text-zinc-300 max-w-[100px] truncate',
      cell: (row: DeviceDef) => (row.section === 'libreria' ? 'Librería' : 'Tech'),
    },
    {
      header: 'Categoría',
      cellClassName: 'text-zinc-700 dark:text-zinc-300 max-w-[180px] truncate',
      cell: (row: DeviceDef) => row.category || '—',
    },
    {
      header: 'Marca',
      cellClassName: 'text-zinc-700 dark:text-zinc-300 max-w-[150px] truncate',
      cell: (row: DeviceDef) => row.brand || '—',
    },
    {
      header: 'Modelo',
      cellClassName: 'max-w-[250px]',
      cell: (row: DeviceDef) => (
        <div
          className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0'
          title={row.name}
        >
          <span className='truncate'>{row.name}</span>
          {!row.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
        </div>
      ),
    },
    ...(isSuper
      ? [
          {
            header: 'Acciones',
            headerClassName: 'text-right',
            cellClassName: 'flex gap-1 justify-end',
            cell: (row: DeviceDef) => (
              <>
                <button
                  onClick={() => onToggleActive(row)}
                  className={`p-1.5 rounded-lg transition ${row.isActive ? 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-500/10' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-500/10'}`}
                  title={row.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Plus className={`w-4 h-4 ${row.isActive ? 'rotate-45' : ''}`} />
                </button>
                <button
                  onClick={() => onEdit(row)}
                  className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 rounded-lg transition'
                  title='Editar Ficha'
                >
                  <Edit className='w-4 h-4' />
                </button>
                <button
                  onClick={() => onDelete(row.id)}
                  className='p-1.5 text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-500/10 rounded-lg transition'
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
