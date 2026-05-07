/* eslint-disable react/display-name */
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type UserDef } from '@/features/user/domain/user.schema';

interface UserCardActionsProps {
  onEdit: (u: UserDef) => void;
  onDelete: (id: string) => void;
  onToggleActive: (u: UserDef) => void;
  currentUserId?: string;
}

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
};

const roleColors: Record<string, string> = {
  admin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  vendedor: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

export function renderUserCard(actions: UserCardActionsProps) {
  return (user: UserDef) => (
    <EntityCard
      key={user.id}
      title={user.username}
      badges={
        <>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${roleColors[user.role] ?? roleColors.vendedor}`}>
            {roleLabel[user.role] ?? user.role}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            {user.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </>
      }
      actions={
        <>
          <CardAction
            icon={user.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />}
            label={user.isActive ? 'Desactivar' : 'Activar'}
            onClick={() => actions.onToggleActive(user)}
            variant={user.isActive ? 'warning' : 'success'}
          />
          <CardAction
            icon={<Edit className='w-4 h-4' />}
            label='Editar'
            onClick={() => actions.onEdit(user)}
          />
          {user.id !== actions.currentUserId && (
            <CardAction
              icon={<Trash2 className='w-4 h-4' />}
              label='Eliminar'
              onClick={() => actions.onDelete(user.id!)}
              variant='danger'
            />
          )}
        </>
      }
    />
  );
}
