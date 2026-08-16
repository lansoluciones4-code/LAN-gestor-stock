/* eslint-disable react/display-name */
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type TechnicalServiceDef } from '@/features/technical-service/domain/technical-service.schema';

interface TechnicalServiceCardActionsProps {
  role?: string;
  onEdit: (s: TechnicalServiceDef) => void;
  onDelete: (id: string) => void;
  onToggleActive: (s: TechnicalServiceDef) => void;
}

export function renderTechnicalServiceCard(actions: TechnicalServiceCardActionsProps) {
  return (service: TechnicalServiceDef) => (
    <EntityCard
      key={service.id}
      title={service.name}
      badges={
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${service.isActive ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
          {service.isActive ? 'Activo' : 'Inactivo'}
        </span>
      }
      details={
        <div className='flex flex-col gap-1 mt-1'>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Descripción</span>
            <span
              className='truncate max-w-[180px]'
              title={service.description || '---'}
            >
              {service.description || '---'}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Valor</span>
            <span className='font-bold text-zinc-900 dark:text-zinc-100'>${service.value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      }
      actions={
        <>
          <CardAction
            icon={service.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />}
            label={service.isActive ? 'Desactivar' : 'Activar'}
            onClick={() => actions.onToggleActive(service)}
            variant={service.isActive ? 'warning' : 'success'}
          />
          <CardAction
            icon={<Edit className='w-4 h-4' />}
            label='Editar'
            onClick={() => actions.onEdit(service)}
          />
          {actions.role === 'admin' && (
            <CardAction
              icon={<Trash2 className='w-4 h-4' />}
              label='Eliminar'
              onClick={() => actions.onDelete(service.id!)}
              variant='danger'
            />
          )}
        </>
      }
    />
  );
}
