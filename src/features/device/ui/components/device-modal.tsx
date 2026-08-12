'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MonitorSmartphone } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Combobox } from '@/components/ui/combobox';
import { deviceCreateSchema, type DeviceInput, type DeviceDef, type DeviceUpdateInput } from '@/features/device/domain/device.schema';
import { fetchDeviceFieldOptions, deleteDeviceFieldOptionAction, type DeviceFieldOption } from '@/features/device/actions/device.actions';
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
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<DeviceInput>({
    resolver: zodResolver(deviceCreateSchema),
  });

  const [categoryOptions, setCategoryOptions] = useState<DeviceFieldOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<DeviceFieldOption[]>([]);
  const category = watch('category');
  const brand = watch('brand');
  const section = watch('section');

  const loadOptions = (forSection: 'tech' | 'libreria') => {
    fetchDeviceFieldOptions('category', forSection).then(setCategoryOptions);
    fetchDeviceFieldOptions('brand', forSection).then(setBrandOptions);
  };

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          name: editingItem.name,
          category: editingItem.category || '',
          brand: editingItem.brand || '',
          section: (editingItem.section as 'tech' | 'libreria') || 'tech',
        });
        loadOptions((editingItem.section as 'tech' | 'libreria') || 'tech');
      } else {
        reset({
          name: '',
          category: '',
          brand: '',
          section: 'tech',
        });
        loadOptions('tech');
      }
    }
  }, [isOpen, editingItem, reset]);

  const handleSectionChange = (val: 'tech' | 'libreria') => {
    setValue('section', val, { shouldValidate: true, shouldDirty: true });
    setValue('category', '', { shouldValidate: true });
    setValue('brand', '', { shouldValidate: true });
    loadOptions(val);
  };

  const handleDeleteOption = async (field: 'category' | 'brand', value: string) => {
    const res = await deleteDeviceFieldOptionAction(field, value, section || 'tech');
    if (res.success) loadOptions(section || 'tech');
  };

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
      title={editingItem ? 'Actualizar Modelo' : 'Nuevo Modelo en Catálogo'}
      icon={<MonitorSmartphone className='w-5 h-5 text-zinc-500' />}
      width='sm'
      onSubmit={handleSubmit(handleFormSubmit)}
      submitLabel={editingItem ? 'Actualizar Modelo' : 'Agregar Modelo'}
      submitTestId={TEST_IDS.general.btnSubmitModal}
      isPending={isPending}
    >
      <ErrorAlert error={serverError} />
      <div className='max-h-[60vh] overflow-y-auto px-1 space-y-4'>
        <div>
          <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Sección</label>
          <div className='flex rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-1'>
            <button
              type='button'
              onClick={() => handleSectionChange('tech')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${section === 'tech' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            >
              Tech
            </button>
            <button
              type='button'
              onClick={() => handleSectionChange('libreria')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${section === 'libreria' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            >
              Librería
            </button>
          </div>
          {errors.section && <p className='text-zinc-500 text-xs mt-1.5'>{errors.section.message}</p>}
        </div>
        <div>
          <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Categoría</label>
          <Combobox
            options={categoryOptions.map((o) => ({ id: o.value, name: o.value, deletable: !o.hasProducts }))}
            value={category || ''}
            onChange={(val) => setValue('category', val, { shouldValidate: true, shouldDirty: true })}
            onDeleteOption={(val) => handleDeleteOption('category', val)}
            freeText
            placeholder='Ej: Celulares'
            searchPlaceholder='Buscar o escribir una categoría nueva...'
            emptyMessage='Escribí para crear una categoría nueva.'
          />
          {errors.category && <p className='text-zinc-500 text-xs mt-1.5'>{errors.category.message}</p>}
        </div>
        <div>
          <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Marca</label>
          <Combobox
            options={brandOptions.map((o) => ({ id: o.value, name: o.value, deletable: !o.hasProducts }))}
            value={brand || ''}
            onChange={(val) => setValue('brand', val, { shouldValidate: true, shouldDirty: true })}
            onDeleteOption={(val) => handleDeleteOption('brand', val)}
            freeText
            placeholder='Ej: Apple (opcional)'
            searchPlaceholder='Buscar o escribir una marca nueva...'
            emptyMessage='Escribí para crear una marca nueva.'
          />
          {errors.brand && <p className='text-zinc-500 text-xs mt-1.5'>{errors.brand.message}</p>}
        </div>
        <div>
          <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Modelo</label>
          <input
            type='text'
            {...register('name')}
            autoFocus
            placeholder='Ej: iPhone 15 Pro Max'
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.name && <p className='text-zinc-500 text-xs mt-1.5'>{errors.name.message}</p>}
        </div>
      </div>
    </ResponsiveModal>
  );
}
