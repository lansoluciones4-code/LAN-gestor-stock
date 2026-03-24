'use client';

import { useState } from 'react';
import { Search, History, Eye, User, FileText } from 'lucide-react';
import { type AuditLogDef } from '@/schemas/audit-log.schema';

interface LogManagerProps {
  initialData: AuditLogDef[];
}

export function LogManager({ initialData }: LogManagerProps) {
  const [logs, setLogs] = useState<AuditLogDef[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log as any).user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'UPDATE': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'DELETE': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
      case 'LOGIN': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400 border-zinc-200 dark:border-zinc-500/20';
    }
  };

  return (
    <div className='flex flex-col h-full space-y-4'>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0'>
        <div className='relative w-full sm:w-96'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
          <input
            type='text'
            placeholder='Buscar por usuario, acción o entidad...'
            className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className='flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-800'>
          <History className='w-3.5 h-3.5' />
          <span>Mostrando últimos 100 eventos</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className='flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col'>
        <div className='overflow-x-auto overflow-y-auto flex-1'>
          <table className='w-full text-left border-collapse min-w-[800px]'>
            <thead className='sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 shadow-sm'>
              <tr>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'>Fecha / Hora</th>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'>Usuario</th>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'>Acción</th>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'>Entidad</th>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'>ID Entidad</th>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right'>Detalle</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-200 dark:divide-zinc-800'>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className='group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors'>
                    <td className='px-6 py-4 text-sm whitespace-nowrap'>
                      <div className='text-zinc-900 dark:text-zinc-100 font-medium font-mono'>
                        {new Date(log.createdAt).toLocaleDateString('es-AR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                      </div>
                      <div className='text-xs text-zinc-500 uppercase font-mono'>
                        {new Date(log.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <div className='flex items-center gap-2.5'>
                        <div className='w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center'>
                          <User className='w-4 h-4 text-red-600 dark:text-red-400' />
                        </div>
                        <span className='font-medium text-zinc-900 dark:text-zinc-100 capitalize'>
                          {(log as any).user?.username || 'Sistema'}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <span className='font-medium text-zinc-700 dark:text-zinc-300'>{log.entity}</span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <code className='text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded font-mono truncate max-w-[120px] block'>
                        {log.entityId || 'N/A'}
                      </code>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-right'>
                      <button 
                        className='p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all'
                        title={JSON.stringify(log.detail, null, 2)}
                      >
                        <Eye className='w-4 h-4' />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className='px-6 py-20 text-center'>
                    <div className='flex flex-col items-center gap-3'>
                      <div className='w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center'>
                        <FileText className='w-6 h-6 text-zinc-400' />
                      </div>
                      <p className='text-zinc-500 dark:text-zinc-400'>No se han encontrado registros de auditoría</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
