'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ReturnsPanel } from './returns-panel';

export default function DevolucionesPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Devolución de Mercadería'
        description='Registro de devoluciones de productos — repone stock y descuenta el monto de las ganancias del período.'
      />
      <ReturnsPanel />
    </div>
  );
}
