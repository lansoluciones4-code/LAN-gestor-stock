'use client';

import { PageHeader } from '@/components/ui/page-header';
import { DevicePanel } from './device-panel';

export default function DevicesPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Categorias'
        description='Gestión administrativa de los modelos físicos que ingresan al catálogo.'
      />
      <DevicePanel />
    </div>
  );
}
