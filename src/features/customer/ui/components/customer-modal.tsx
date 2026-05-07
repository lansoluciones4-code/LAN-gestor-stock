'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { customerCreateSchema, type CustomerInput, type CustomerDef, type CustomerUpdateInput } from '@/features/customer/domain/customer.schema';
import { createCustomerAction, updateCustomerAction } from '@/features/customer/actions/customer.actions';
import { invalidateAllCaches } from '@/stores';
import { ErrorAlert } from '@/components/ui/alert';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: CustomerDef, message?: string) => void;
  editingItem?: CustomerDef | null;
}

export function CustomerModal({ isOpen, onClose, onSuccess, editingItem }: CustomerModalProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerCreateSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          name: editingItem.name,
          phone: editingItem.phone || '',
          email: editingItem.email || '',
          documentNumber: editingItem.documentNumber || '',
        });
      } else {
        reset({
          name: '',
          phone: '',
          email: '',
          documentNumber: '',
        });
      }
      setServerError(null);
    }
  }, [isOpen, editingItem, reset]);

  const handleModalSubmit = async (data: CustomerInput | CustomerUpdateInput) => {
    setServerError(null);
    startTransition(async () => {
      const action = editingItem ? updateCustomerAction(editingItem.id, data as CustomerUpdateInput) : createCustomerAction(data as CustomerInput);

      const result = await action;

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      onSuccess(result.data as CustomerDef, result.message);
      invalidateAllCaches();
      onClose();
    });
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Editar Ficha Cliente' : 'Nuevo Registro de Cliente'}
      icon={<Users className='w-5 h-5 text-indigo-500' />}
      width='md'
      onSubmit={handleSubmit((data) => {
        if (editingItem) {
          const changedData: any = { version: editingItem.version };
          let hasChanges = false;

          Object.keys(dirtyFields).forEach((key) => {
            const k = key as keyof CustomerInput;
            (changedData as any)[k] = data[k];
            hasChanges = true;
          });

          if (!hasChanges) {
            onClose();
            return;
          }
          handleModalSubmit(changedData);
        } else {
          handleModalSubmit(data);
        }
      })}
      submitLabel={editingItem ? 'Actualizar Ficha' : 'Guardar Cliente'}
      isPending={isPending}
    >
      <ErrorAlert error={serverError} />
      <div className='max-h-[60vh] overflow-y-auto px-1 space-y-4'>
        <div>
          <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Nombre Completo / Razón Social</label>
          <input
            type='text'
            {...register('name')}
            autoFocus
            placeholder='Ej: Carlos Pérez Martínez'
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.name && <p className='text-red-500 text-xs mt-1.5'>{errors.name.message}</p>}
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>DNI / CUIT</label>
          <input
            type='text'
            {...register('documentNumber')}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9\-\.]/g, '');
              e.target.value = val;
              // Llamamos al onChange de register manualmente para que react-hook-form se entere del cambio
              register('documentNumber').onChange(e);
            }}
            placeholder='Ej: 35.123.456 o 20-35123456-9'
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors text-sm ${errors.documentNumber ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.documentNumber && <p className='text-red-500 text-xs mt-1.5'>{errors.documentNumber.message}</p>}
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Teléfono</label>
            <input
              type='text'
              {...register('phone')}
              placeholder='+54 9 11 9876-5432'
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors text-sm ${errors.phone ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            />
            {errors.phone && <p className='text-red-500 text-xs mt-1.5'>{errors.phone.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Email</label>
            <input
              type='email'
              {...register('email')}
              placeholder='cliente@correo.com'
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors text-sm ${errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            />
            {errors.email && <p className='text-red-500 text-xs mt-1.5'>{errors.email.message}</p>}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
