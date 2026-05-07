'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { loginSchema, LoginInput } from '@/features/auth/domain/auth.schema';
import { loginAction } from '@/features/auth/actions/auth.actions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const loginState = useAuthStore((state) => state.loginState);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setGlobalError(null);
    const result = await loginAction(data);

    if (result.success && result.user) {
      loginState(result.user);
      router.push('/');
    } else {
      setGlobalError(result.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className='w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8'>
      <div className='flex flex-col items-center mb-8'>
        <div className='bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full mb-4'>
          <LogIn className='w-8 h-8 text-indigo-600 dark:text-indigo-400' />
        </div>
        <h2 className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>Bienvenido</h2>
        <p className='text-zinc-500 dark:text-zinc-400 text-sm mt-1 text-center'>Inicia sesión para acceder a tu sistema de gestión.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className='space-y-5'
        noValidate
      >
        {globalError && <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center'>{globalError}</div>}

        <div>
          <label
            htmlFor='username'
            className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1'
          >
            Usuario
          </label>
          <input
            id='username'
            type='text'
            {...register('username')}
            autoComplete='username'
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            placeholder='Ingresa tu usuario'
          />
          {errors.username && <p className='text-red-500 text-xs mt-1'>{errors.username.message}</p>}
        </div>

        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1'
          >
            Contraseña
          </label>
          <input
            id='password'
            type='password'
            {...register('password')}
            autoComplete='current-password'
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            placeholder='••••••••'
          />
          {errors.password && <p className='text-red-500 text-xs mt-1'>{errors.password.message}</p>}
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed'
        >
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}
