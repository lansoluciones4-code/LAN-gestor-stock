'use client';

import { useAuthStore } from '@/stores/auth.store';
import { logoutAction } from '@/server/actions/auth.actions';
import { useRouter } from 'next/navigation';

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const logoutState = useAuthStore((state) => state.logoutState);
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    logoutState();
    router.push('/login');
  };

  return (
    <div className='flex min-h-screen items-center justify-center dark:bg-zinc-950 dark:text-zinc-100'>
       <div className='bg-zinc-100 dark:bg-zinc-900 p-8 rounded-xl flex flex-col items-center'>
         <h1 className='text-3xl font-bold mb-4'>Panel de Control</h1>
         <p className='mb-6 opacity-80 text-sm'>
           Bienvenido de nuevo, <strong>{user?.username}</strong>! (Rol: {user?.role})
         </p>

         <button
           onClick={handleLogout}
           className='bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition'
         >
           Cerrar Sesión
         </button>
       </div>
    </div>
  );
}
