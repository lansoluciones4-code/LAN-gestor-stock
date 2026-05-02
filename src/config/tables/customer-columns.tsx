import { type CustomerDef } from '@/features/customer/domain/customer.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Plus, Edit } from 'lucide-react';

interface ColumnActions {
  role?: string;
  onEdit: (c: CustomerDef) => void;
  onToggleActive: (c: CustomerDef) => void;
}

export function getCustomerColumns({ role, onEdit, onToggleActive }: ColumnActions): ColumnDef<CustomerDef>[] {
  return [
    {
      header: 'Nombre / Cliente',
      cellClassName: 'max-w-[200px]',
      cell: (c) => (
        <div
          className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0'
          title={c.name}
        >
          <span className='truncate'>{c.name}</span>
          {!c.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
        </div>
      ),
    },
    {
      header: 'Documento',
      cellClassName: 'text-zinc-500',
      cell: (c) => c.documentNumber || '--',
    },
    {
      header: 'Teléfono',
      cellClassName: 'text-zinc-500',
      cell: (c) => c.phone || '--',
    },
    {
      header: 'Email',
      cellClassName: 'text-zinc-500 max-w-[150px] truncate',
      cell: (c) => <span title={c.email || '--'}>{c.email || '--'}</span>,
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right font-bold',
      cellClassName: 'flex gap-1 justify-end',
      cell: (c: CustomerDef) => (
        <>
          {role === 'admin' && (
            <button
              onClick={() => onToggleActive(c)}
              className={`p-1.5 rounded-lg transition ${c.isActive ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'}`}
              title={c.isActive ? 'Desactivar' : 'Activar'}
            >
              <Plus className={`w-4 h-4 ${c.isActive ? 'rotate-45' : ''}`} />
            </button>
          )}
          <button
            onClick={() => onEdit(c)}
            className='p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 rounded-lg transition'
            title='Editar Profile'
          >
            <Edit className='w-4 h-4' />
          </button>
        </>
      ),
    },
  ];
}
