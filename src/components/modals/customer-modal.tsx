'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { customerSchema, type CustomerInput, type CustomerDef } from '@/schemas/customer.schema';
import { createCustomerAction, updateCustomerAction } from '@/server/actions/customer.actions';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: CustomerDef) => void;
  editingItem?: CustomerDef | null;
}

export function CustomerModal({ isOpen, onClose, onSuccess, editingItem }: CustomerModalProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
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

  const onSubmit = async (data: CustomerInput) => {
    setServerError(null);
    startTransition(async () => {
      const action = editingItem 
        ? updateCustomerAction(editingItem.id, data) 
        : createCustomerAction(data);
      
      const result = await action as any;

      if (!result.success) {
        setServerError(result.message);
        return;
      }

      onSuccess(result.data || ({ ...data, id: editingItem?.id } as CustomerDef));
      onClose();
    });
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-70 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 overflow-y-auto'>
      <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 m-auto animate-in zoom-in-95 duration-200'>
        <div className='flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50'>
          <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2'>
            <Users className='w-5 h-5 text-indigo-500'/>
                  {editingItem ? 'Editar Ficha Cliente' : 'Nuevo Registro de Cliente'}
                </h3>
                <button onClick={onClose} className='text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1'>
                  <X className='w-5 h-5' />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className='p-6 space-y-5'>
                {serverError && (
                  <div className='p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/30'>
                    {serverError}
                  </div>
                )}

                <div>
                  <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Nombre Completo / Razón Social</label>
                  <input
                    type='text'
                    {...register('name')}
                    placeholder='Ej: Carlos Sanchez'
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                  />
                  {errors.name && <p className='text-red-500 text-xs mt-1.5'>{errors.name.message}</p>}
                </div>

                <div>
                  <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>DNI / CUIT</label>
                  <input
                    type='text'
                    {...register('documentNumber')}
                    placeholder='Número de identificación...'
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
                      placeholder='Móvil o Fijo...' 
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors text-sm ${errors.phone ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`} 
                    />
                    {errors.phone && <p className='text-red-500 text-xs mt-1.5'>{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Email</label>
                    <input 
                      type='email' 
                      {...register('email')} 
                      placeholder='correo@ejemplo.com' 
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors text-sm ${errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`} 
                    />
                    {errors.email && <p className='text-red-500 text-xs mt-1.5'>{errors.email.message}</p>}
                  </div>
                </div>

          <div className='flex justify-end pt-4 gap-3 border-t border-zinc-200 dark:border-zinc-800 mt-6'>
            <Button variant='ghost' type='button' onClick={onClose}>Cancelar</Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Procesando...' : (editingItem ? 'Actualizar Ficha' : 'Guardar Cliente')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
