'use client';

import { PageHeader } from '@/components/ui/page-header';
import { LogPanel } from './log-panel';

export default function AuditLogsPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Historial de Actividad'
        description='Trazabilidad completa de operaciones críticas del sistema.'
      />
      <LogPanel />
    </div>
  );
}
