'use client';

import { PageHeader } from '@/components/ui/page-header';
import { SalesPanel } from './sales-panel';

export default function SalesPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Ventas y Órdenes'
        description='Gestión de facturación y salida de stock inmediata.'
      />
      <SalesPanel />
    </div>
  );
}
