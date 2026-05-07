'use client';

import { PageHeader } from '@/components/ui/page-header';
import { UserPanel } from './user-panel';

export default function UsersPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Usuarios y Permisos'
        description='Gestión centralizada de cuentas de vendedores y administradores.'
      />
      <UserPanel />
    </div>
  );
}
