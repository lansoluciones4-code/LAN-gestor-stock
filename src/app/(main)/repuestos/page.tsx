'use client';

import { PageHeader } from '@/components/ui/page-header';
import { RepuestosPanel } from './repuestos-panel';

export default function RepuestosPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Repuestos / Art. Usados'
        description='Alta de repuestos y artículos usados a la venta, con costo, ganancia y cliente asociado.'
      />
      <RepuestosPanel />
    </div>
  );
}
