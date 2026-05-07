'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCog } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { userFormSchema, type UserFormInput, type UserInput, type UserDef, type UserUpdateInput } from '@/features/user/domain/user.schema';
import { useEffect } from 'react';
import { ErrorAlert } from '@/components/ui/alert';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: UserDef | null;
  onSubmit: (data: UserInput | UserUpdateInput) => void;
  isPending: boolean;
  serverError: string | null;
}

export function UserModal({ isOpen, onClose, editingItem, onSubmit, isPending, serverError }: UserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { role: 'vendedor', isEditing: false },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      reset({ username: editingItem.username, role: editingItem.role, password: '', isEditing: true });
    } else {
      reset({ username: '', role: 'vendedor', password: '', isEditing: false });
    }
  }, [isOpen, editingItem, reset]);

  const handleInnerSubmit = (formData: UserFormInput) => {
     
    const { isEditing, ...rest } = formData;

    if (editingItem) {
       
      const changedData: any = { version: editingItem.version };
      let hasChanges = false;

      Object.keys(dirtyFields).forEach((key) => {
        if (key === 'isEditing') return;
        const k = key as keyof typeof rest;
        changedData[k] = rest[k as keyof typeof rest];
        hasChanges = true;
      });

      if (!hasChanges) { onClose(); return; }
      onSubmit(changedData);
    } else {
      onSubmit(rest as UserInput);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Editar Perfil de Seguridad' : 'Nueva Credencial de Acceso'}
      icon={<UserCog className='w-5 h-5 text-indigo-500' />}
      width='md'
      onSubmit={handleSubmit(handleInnerSubmit)}
      submitLabel='Confirmar Credencial'
      isPending={isPending}
    >
      <div className='p-1 space-y-5'>
        <ErrorAlert error={serverError} />

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Nombre de Usuario</label>
          <input
            type='text'
            {...register('username')}
            placeholder='Ej: juan.perez'
            className={`w-full px-4 py-2 text-sm sm:text-base placeholder:text-[11px] sm:placeholder:text-sm border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.username ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.username && <p className='text-red-500 text-xs mt-1.5'>{errors.username.message}</p>}
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>
            Contraseña de Ingreso
            {editingItem && <span className='text-zinc-500 font-normal'> (Dejar en blanco para no cambiar)</span>}
          </label>
          <input
            type='password'
            {...register('password')}
            placeholder={editingItem ? '******' : 'Escribe una contraseña segura'}
            className={`w-full px-4 py-2 text-sm sm:text-base placeholder:text-[11px] sm:placeholder:text-sm border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.password ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.password && <p className='text-red-500 text-xs mt-1.5'>{errors.password.message}</p>}
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Nivel de Autoridad</label>
          <select
            {...register('role')}
            className={`w-full px-4 py-2 text-sm sm:text-base placeholder:text-[11px] sm:placeholder:text-sm border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.role ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          >
            <option value='vendedor'>Vendedor (Acceso Limitado)</option>
            <option value='admin'>Administrador (Acceso Total)</option>
          </select>
          {errors.role && <p className='text-red-500 text-xs mt-1.5'>{errors.role.message}</p>}
        </div>
      </div>
    </ResponsiveModal>
  );
}
