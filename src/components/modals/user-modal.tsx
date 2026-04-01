'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, UserCog } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { userSchema, type UserInput, type UserDef } from '@/schemas/user.schema';
import { useEffect } from 'react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: UserDef | null;
  onSubmit: (data: UserInput) => void;
  isPending: boolean;
  serverError: string | null;
}

export function UserModal({ isOpen, onClose, editingItem, onSubmit, isPending, serverError }: UserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'vendedor' },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          username: editingItem.username,
          role: editingItem.role,
          password: '',
        });
      } else {
        reset({
          username: '',
          role: 'vendedor',
          password: '',
        });
      }
    }
  }, [isOpen, editingItem, reset]);

  const handleInnerSubmit = (data: UserInput) => {
    onSubmit(data);
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Editar Perfil de Seguridad' : 'Nueva Credencial de Acceso'}
      icon={<UserCog className="w-5 h-5 text-indigo-500" />}
      width="md"
      onSubmit={handleSubmit(handleInnerSubmit)}
      submitLabel={editingItem ? 'Confirmar Credencial' : 'Confirmar Credencial'}
      isPending={isPending}
    >
      <div className="p-1 space-y-5">
        {serverError && <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/30">{serverError}</div>}

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nombre de Usuario</label>
          <input
            type="text"
            {...register('username')}
            placeholder="Ej: juan.perez"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.username ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.username && <p className="text-red-500 text-xs mt-1.5">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Contraseña de Ingreso
            {editingItem && <span className="text-zinc-500 font-normal">(Dejar en blanco para no cambiar)</span>}
          </label>
          <input
            type="password"
            {...register('password')}
            placeholder={editingItem ? '******' : 'Escribe una contraseña segura'}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.password ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nivel de Autoridad</label>
          <select
            {...register('role')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.role ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          >
            <option value="vendedor">Vendedor (Acceso Limitado)</option>
            <option value="admin">Administrador (Acceso Total)</option>
          </select>
          {errors.role && <p className="text-red-500 text-xs mt-1.5">{errors.role.message}</p>}
        </div>
      </div>
    </ResponsiveModal>
  );
}
