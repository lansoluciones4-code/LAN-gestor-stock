import { type UserDef } from '@/features/user/domain/user.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Plus, Edit, Trash2, CircleCheck, Circle } from 'lucide-react';

interface ColumnActions {
  currentUserId?: string;
  role?: string;
  onEdit: (u: UserDef) => void;
  onDelete: (id: string) => void;
  onToggleActive: (u: UserDef) => void;
  onToggleReturnsAccess: (u: UserDef) => void;
}

export function getUserColumns({ currentUserId, role, onEdit, onDelete, onToggleActive, onToggleReturnsAccess }: ColumnActions): ColumnDef<UserDef>[] {
  return [
    {
      header: 'Usuario Creado',
      cell: (u) => (
        <div className='flex flex-col'>
          <div
            className='font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 truncate min-w-0'
            title={u.username}
          >
            <span className='truncate'>{u.username}</span>
            {!u.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase tracking-tighter'>Inactivo</span>}
            {currentUserId === u.id && <span className='shrink-0 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400 text-[10px] uppercase font-bold ml-2'>Tú</span>}
          </div>
          <div className='text-[10px] text-zinc-500 mt-0.5 uppercase font-medium tracking-tight'>
            ID:
            {u.id.split('-')[0]}
            ***
          </div>
        </div>
      ),
    },
    {
      header: 'Rol / Nivel',
      cell: (u) => <span className={`px-2.5 py-1 rounded-full text-[13px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-900/40' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/40'}`}>{u.role === 'admin' ? 'Administrador' : 'Vendedor'}</span>,
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right font-bold',
      cellClassName: 'flex gap-1 justify-end',
      cell: (u: UserDef) => (
        <>
          <button
            disabled={currentUserId === u.id}
            onClick={() => onToggleActive(u)}
            className={`p-1.5 rounded-lg transition-colors ${currentUserId === u.id ? 'opacity-20 cursor-not-allowed text-zinc-600 dark:text-zinc-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'}`}
            title={u.isActive ? 'Desactivar' : 'Activar'}
          >
            <Plus className={`w-4 h-4 ${u.isActive ? 'rotate-45' : ''}`} />
          </button>

          {u.role === 'vendedor' && (
            <button
              onClick={() => onToggleReturnsAccess(u)}
              className={`p-1.5 rounded-lg transition-colors ${u.canManageReturns ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400'}`}
              title={u.canManageReturns ? 'Puede gestionar devoluciones' : 'No puede gestionar devoluciones'}
            >
              {u.canManageReturns ? <CircleCheck className='w-4 h-4' /> : <Circle className='w-4 h-4' />}
            </button>
          )}

          <button
            onClick={() => onEdit(u)}
            className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400 rounded-lg transition-colors'
            title='Editar Seguridad'
          >
            <Edit className='w-4 h-4' />
          </button>

          {role === 'admin' && (
            <button
              onClick={() => onDelete(u.id)}
              disabled={currentUserId === u.id}
              className={`p-1.5 rounded-lg transition-colors ${currentUserId === u.id ? 'opacity-30 cursor-not-allowed text-zinc-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'}`}
              title='Retirar Acceso'
            >
              <Trash2 className='w-4 h-4' />
            </button>
          )}
        </>
      ),
    },
  ];
}
