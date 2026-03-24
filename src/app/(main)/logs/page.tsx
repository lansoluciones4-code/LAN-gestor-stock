export const dynamic = 'force-dynamic';
import { fetchAuditLogs } from '@/server/actions/audit.actions';
import { LogManager } from './log-manager';

export default async function AuditLogsPage() {
  const initialData = await fetchAuditLogs();

  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <div className='flex justify-between items-center mb-6 shrink-0'>
        <div>
          <h1 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight'>Historial de Actividad</h1>
          <p className='text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2'>
            Trazabilidad completa de operaciones críticas del sistema.
          </p>
        </div>
      </div>

      <LogManager initialData={initialData} />
    </div>
  );
}
