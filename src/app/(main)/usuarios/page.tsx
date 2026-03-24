import { fetchUsers } from '@/server/actions/user.actions';
import { UserManager } from './user-manager';

export default async function UsersPage() {
  const initialUsers = await fetchUsers();

  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <div className='flex justify-between items-center mb-6 shrink-0'>
        <div>
          <h1 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100'>Usuarios y Permisos</h1>
          <p className='text-zinc-500 dark:text-zinc-400 mt-1'>
            Gestión centralizada de cuentas de vendedores y administradores.
          </p>
        </div>
      </div>

      <UserManager initialData={initialUsers} />
    </div>
  );
}
