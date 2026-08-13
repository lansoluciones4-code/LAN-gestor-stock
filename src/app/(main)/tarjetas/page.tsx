'use client';

import { PageHeader } from '@/components/ui/page-header';
import { CardsPanel } from './cards-panel';

export default function CardsPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Alta de Tarjetas'
        description='Tarjetas que acepta la tienda y el recargo por cuotas de cada una.'
      />
      <CardsPanel />
    </div>
  );
}
