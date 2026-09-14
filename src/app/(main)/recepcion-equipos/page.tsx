'use client';

import { PageHeader } from '@/components/ui/page-header';
import { RecepcionEquiposPanel } from './recepcion-equipos-panel';

export default function RecepcionEquiposPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Recepción de Equipo'
        description='Registrá el ingreso de equipos a reparar, imprimí la planilla de recepción y dejá constancia del diagnóstico final.'
      />
      <RecepcionEquiposPanel />
    </div>
  );
}
