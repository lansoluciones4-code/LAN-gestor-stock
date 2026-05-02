/* eslint-disable react/display-name */
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type DeviceDef } from '@/features/device/domain/device.schema';

interface DeviceCardActionsProps {
  onEdit: (d: DeviceDef) => void;
  onDelete: (id: string) => void;
  onToggleActive: (d: DeviceDef) => void;
}

export function renderDeviceCard(actions: DeviceCardActionsProps) {
  return (device: DeviceDef) => (
    <EntityCard
      key={device.id}
      title={device.name}
      badges={
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${device.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
          {device.isActive ? 'Activo' : 'Inactivo'}
        </span>
      }
      actions={
        <>
          <CardAction
            icon={device.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />}
            label={device.isActive ? 'Desactivar' : 'Activar'}
            onClick={() => actions.onToggleActive(device)}
            variant={device.isActive ? 'warning' : 'success'}
          />
          <CardAction
            icon={<Edit className='w-4 h-4' />}
            label='Editar'
            onClick={() => actions.onEdit(device)}
          />
          <CardAction
            icon={<Trash2 className='w-4 h-4' />}
            label='Eliminar'
            onClick={() => actions.onDelete(device.id!)}
            variant='danger'
          />
        </>
      }
    />
  );
}
