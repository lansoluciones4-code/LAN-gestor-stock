/* eslint-disable react/display-name */
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type ProviderDef } from '@/features/provider/domain/provider.schema';

interface ProviderCardActionsProps {
  role?: string;
  onEdit: (p: ProviderDef) => void;
  onDelete: (id: string) => void;
  onToggleActive: (p: ProviderDef) => void;
}

export function renderProviderCard(actions: ProviderCardActionsProps) {
  return (provider: ProviderDef) => (
    <EntityCard
      key={provider.id}
      title={provider.name}
      badges={
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${provider.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
          {provider.isActive ? 'Activo' : 'Inactivo'}
        </span>
      }
      details={
        <div className='flex flex-col gap-1 mt-1'>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Teléfono</span>
            <span className='truncate max-w-[180px]'>{provider.phone}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Email</span>
            <span className='truncate max-w-[180px]'>{provider.email}</span>
          </div>
        </div>
      }
      actions={
        <>
          <CardAction
            icon={provider.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />}
            label={provider.isActive ? 'Desactivar' : 'Activar'}
            onClick={() => actions.onToggleActive(provider)}
            variant={provider.isActive ? 'warning' : 'success'}
          />
          <CardAction
            icon={<Edit className='w-4 h-4' />}
            label='Editar'
            onClick={() => actions.onEdit(provider)}
          />
          {actions.role === 'admin' && (
            <CardAction
              icon={<Trash2 className='w-4 h-4' />}
              label='Eliminar'
              onClick={() => actions.onDelete(provider.id!)}
              variant='danger'
            />
          )}
        </>
      }
    />
  );
}
