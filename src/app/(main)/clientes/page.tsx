'use client';

import { PageHeader } from '@/components/ui/page-header';
import { CustomerPanel } from './customer-panel';

export default function CustomersPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Cartera de Clientes'
        description='Registro de compradores eventuales y fidelizados para facturación.'
      />
      <CustomerPanel />
    </div>
  );
}
