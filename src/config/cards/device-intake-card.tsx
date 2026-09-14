/* eslint-disable react/display-name */
import { Camera, Printer, Stethoscope, FileCheck2, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type DeviceIntakeDef } from '@/features/device-intake/domain/device-intake.schema';
import { EQUIPMENT_TYPE_LABELS, type EquipmentType } from '@/config/forms/device-intake-fields';

interface DeviceIntakeCardActionsProps {
  role?: string;
  onPhotos: (item: DeviceIntakeDef) => void;
  onPrint: (item: DeviceIntakeDef) => void;
  onPrintDiagnosis: (item: DeviceIntakeDef) => void;
  onDiagnose: (item: DeviceIntakeDef) => void;
  onEdit: (item: DeviceIntakeDef) => void;
  onToggleActive: (item: DeviceIntakeDef) => void;
  onDelete: (id: string) => void;
}

export function renderDeviceIntakeCard(actions: DeviceIntakeCardActionsProps) {
  return (intake: DeviceIntakeDef) => (
    <EntityCard
      key={intake.id}
      title={intake.customer?.name || '---'}
      subtitle={intake.receivedByName ? `Recibida por ${intake.receivedByName}` : undefined}
      badges={
        <div className='flex gap-1'>
          <span className='px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 uppercase'>{EQUIPMENT_TYPE_LABELS[intake.equipmentType as EquipmentType]}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${intake.diagnosed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>{intake.diagnosed ? 'Diagnosticado' : 'Pendiente'}</span>
          {!intake.isActive && <span className='px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>Inactivo</span>}
        </div>
      }
      details={
        <div className='flex flex-col gap-1 mt-1'>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Descripción</span>
            <span
              className='truncate max-w-[180px]'
              title={intake.description}
            >
              {intake.description || '---'}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Fecha</span>
            <span>{new Date(intake.createdAt).toLocaleDateString('es-AR')}</span>
          </div>
        </div>
      }
      actions={
        <>
          <CardAction
            icon={<Camera className='w-4 h-4' />}
            label='Fotos del estado inicial'
            onClick={() => actions.onPhotos(intake)}
          />
          <CardAction
            icon={<Printer className='w-4 h-4' />}
            label='Imprimir Planilla'
            onClick={() => actions.onPrint(intake)}
          />
          <CardAction
            icon={<Stethoscope className='w-4 h-4' />}
            label='Diagnóstico Final'
            onClick={() => actions.onDiagnose(intake)}
          />
          {intake.diagnosed && (
            <CardAction
              icon={<FileCheck2 className='w-4 h-4' />}
              label='Imprimir Diagnóstico'
              onClick={() => actions.onPrintDiagnosis(intake)}
            />
          )}
          <CardAction
            icon={<Edit className='w-4 h-4' />}
            label='Editar'
            onClick={() => actions.onEdit(intake)}
          />
          {actions.role === 'admin' && (
            <>
              <CardAction
                icon={intake.isActive ? <PowerOff className='w-4 h-4' /> : <Power className='w-4 h-4' />}
                label={intake.isActive ? 'Desactivar' : 'Activar'}
                onClick={() => actions.onToggleActive(intake)}
                variant='warning'
              />
              <CardAction
                icon={<Trash2 className='w-4 h-4' />}
                label='Eliminar'
                onClick={() => actions.onDelete(intake.id!)}
                variant='danger'
              />
            </>
          )}
        </>
      }
    />
  );
}
