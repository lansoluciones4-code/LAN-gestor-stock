'use client';

import { PageHeader } from '@/components/ui/page-header';
import { TechnicalServicesPanel } from './technical-services-panel';

export default function TechnicalServicesPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Servicios Técnicos'
        description='Catálogo de servicios técnicos que ofrece la tienda.'
      />
      <TechnicalServicesPanel />
    </div>
  );
}
