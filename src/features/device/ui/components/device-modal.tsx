'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MonitorSmartphone } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { deviceCreateSchema, type DeviceInput, type DeviceDef, type DeviceUpdateInput } from '@/features/device/domain/device.schema';
import { ErrorAlert } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DeviceInput | DeviceUpdateInput) => void;
  editingItem?: DeviceDef | null;
  serverError?: string | null;
  isPending?: boolean;
}

export function DeviceModal({ isOpen, onClose, onSubmit, editingItem, serverError, isPending }: DeviceModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<DeviceInput>({
    resolver: zodResolver(deviceCreateSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          name: editingItem.name,
        });
      } else {
        reset({
          name: '',
        });
      }
    }
  }, [isOpen, editingItem, reset]);

  const handleFormSubmit = (data: DeviceInput) => {
    if (editingItem) {
      const changedData: any = { version: editingItem.version };
      let hasChanges = false;
      Object.keys(dirtyFields).forEach((key) => {
        changedData[key as keyof DeviceInput] = data[key as keyof DeviceInput];
        hasChanges = true;
      });
      if (!hasChanges) {
        onClose();
        return;
      }
      onSubmit(changedData as DeviceUpdateInput);
    } else {
      onSubmit(data);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Actualizar Categoría' : 'Nueva Categoría en Catálogo'}
      icon={<MonitorSmartphone className='w-5 h-5 text-indigo-500' />}
      width='sm'
      onSubmit={handleSubmit(handleFormSubmit)}
      submitLabel={editingItem ? 'Actualizar Categoría' : 'Agregar Categoría'}
      submitTestId={TEST_IDS.general.btnSubmitModal}
      isPending={isPending}
    >
      <ErrorAlert error={serverError} />
      <div className='max-h-[60vh] overflow-y-auto px-1 space-y-4'>
        <div>
          <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Nombre / Modelo / Marca</label>
          <input
            type='text'
            {...register('name')}
            autoFocus
            placeholder='Ej: iPhone 15 Pro Max'
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.name && <p className='text-red-500 text-xs mt-1.5'>{errors.name.message}</p>}
        </div>
      </div>
    </ResponsiveModal>
  );
}
