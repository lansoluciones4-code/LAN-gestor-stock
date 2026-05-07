'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ProvidersPanel } from './providers-panel';

export default function ProvidersPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Proveedores Autorizados'
        description='Gestión interna de distribuidores y mayoristas de mercadería.'
      />
      <ProvidersPanel />
    </div>
  );
}
