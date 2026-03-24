'use client';

import { useState } from 'react';
import { Search, History, Eye, User, FileText, X, Info } from 'lucide-react';
import { type AuditLogDef } from '@/schemas/audit-log.schema';

interface LogManagerProps {
  initialData: AuditLogDef[];
}

export function LogManager({ initialData }: LogManagerProps) {
  const [logs] = useState<AuditLogDef[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogDef | null>(null);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getHumanReadableDescription = (log: AuditLogDef) => {
    const detail = log.detail as any;
    const entityNames: Record<string, string> = {
      'USER': 'Usuario',
      'PROVIDER': 'Proveedor',
      'PRODUCT': 'Producto',
      'CUSTOMER': 'Cliente',
      'DEVICE': 'Equipo / Modelo'
    };

    const entityLabel = entityNames[log.entity] || log.entity;
    const name = detail?.name || detail?.username || '';

    if (log.action === 'LOGIN') return `${log.user?.username || 'Sistema'} inició sesión.`;

    let actionText = '';
    switch (log.action) {
      case 'CREATE': actionText = 'registró un nuevo'; break;
      case 'UPDATE': actionText = 'actualizó información de'; break;
      case 'DELETE': actionText = 'eliminó el registro de'; break;
      default: actionText = 'realizó una operación en';
    }

    if (log.entity === 'PRODUCT' && log.action === 'CREATE') {
      return `Registró un nuevo producto con stock inicial de ${detail?.stock || 0} unidades.`;
    }
    
    if (log.entity === 'PRODUCT' && log.action === 'UPDATE') {
      return `Actualizó el stock o precios del producto. Nuevo stock: ${detail?.stock || '---'}.`;
    }

    if (name) return `${actionText} ${entityLabel.toLowerCase()} "${name}".`;
    
    return `${actionText} ${entityLabel.toLowerCase()} (ID: ${log.entityId?.substring(0, 8)}...).`;
  };

  return (
    <div className='flex flex-col h-full space-y-4 relative'>
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
          <span>Mostrando últimos 100 eventos de trazabilidad</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className='flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col'>
        <div className='overflow-x-auto overflow-y-auto flex-1 custom-scrollbar'>
          <table className='w-full text-left border-collapse min-w-[800px]'>
            <thead className='sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 shadow-sm'>
              <tr>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'>Fecha / Hora</th>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'>Operador</th>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'>Acción</th>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'>Entidad</th>
                <th className='px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right'>Detalle</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-200 dark:divide-zinc-800'>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className='group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors'>
                    <td className='px-6 py-4 text-sm whitespace-nowrap'>
                      <div className='text-zinc-900 dark:text-zinc-100 font-medium font-mono'>
                        {new Date(log.createdAt).toLocaleDateString('es-AR')}
                      </div>
                      <div className='text-xs text-zinc-500 uppercase font-mono'>
                        {new Date(log.createdAt).toLocaleTimeString('es-AR')}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <div className='flex items-center gap-2.5'>
                        <div className='w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center'>
                          <User className='w-4 h-4 text-red-600 dark:text-red-400' />
                        </div>
                        <span className='font-medium text-zinc-900 dark:text-zinc-100 capitalize'>
                          {log.user?.username || 'Sistema'}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <div className='flex flex-col'>
                        <span className='font-bold text-zinc-700 dark:text-zinc-300'>{log.entity}</span>
                        <span className='text-[10px] font-mono text-zinc-400'>{log.entityId?.substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-right'>
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className='inline-flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/30'
                      >
                        <span className='text-xs font-bold uppercase'>Ver Más</span>
                        <Eye className='w-4 h-4' />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className='px-6 py-20 text-center'>
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

      {/* Detail Modal */}
      {selectedLog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm'>
          <div className='bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]'>
            <div className='flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-100 dark:bg-red-500/10 rounded-xl'>
                  <History className='w-6 h-6 text-red-600 dark:text-red-400' />
                </div>
                <div>
                  <h3 className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>Detalle del Evento</h3>
                  <p className='text-xs text-zinc-500 font-medium'>ID de Auditoría: {selectedLog.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)} 
                className='p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
            
            <div className='p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8'>
              {/* Summary Description Box */}
              <div className='p-5 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-start gap-4'>
                <div className='p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg shrink-0 mt-0.5'>
                  <Info className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
                </div>
                <div>
                  <h4 className='text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1'>Descripción de Actividad</h4>
                  <p className='text-lg font-medium text-zinc-900 dark:text-zinc-100 leading-snug'>
                    {getHumanReadableDescription(selectedLog)}
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800'>
                  <span className='block text-[10px] text-zinc-400 uppercase font-black mb-1'>Acción</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className='p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800'>
                  <span className='block text-[10px] text-zinc-400 uppercase font-black mb-1'>Entidad</span>
                  <span className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>{selectedLog.entity}</span>
                </div>
                <div className='p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800'>
                  <span className='block text-[10px] text-zinc-400 uppercase font-black mb-1'>Usuario / Operador</span>
                  <span className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>{selectedLog.user?.username || 'Sistema'}</span>
                </div>
                <div className='p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800'>
                  <span className='block text-[10px] text-zinc-400 uppercase font-black mb-1'>Fecha y Hora</span>
                  <span className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>
                    {new Date(selectedLog.createdAt).toLocaleTimeString('es-AR')} - {new Date(selectedLog.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Advanced Data (JSON) */}
              <div className='space-y-3'>
                <h4 className='text-xs font-black text-zinc-400 uppercase tracking-widest px-1'>Metadatos del Objeto (Raw JSON)</h4>
                <div className='bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden'>
                  <div className='flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800'>
                    <div className='flex gap-1.5'>
                      <div className='w-2.5 h-2.5 rounded-full bg-rose-500/30' />
                      <div className='w-2.5 h-2.5 rounded-full bg-amber-500/30' />
                      <div className='w-2.5 h-2.5 rounded-full bg-emerald-500/30' />
                    </div>
                    <span className='text-[10px] font-mono text-zinc-500 uppercase'>payload.json</span>
                  </div>
                  <pre className='p-5 text-indigo-300 text-xs font-mono leading-relaxed overflow-x-auto custom-scrollbar max-h-60'>
                    {JSON.stringify(selectedLog.detail, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className='p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3'>
              <button 
                onClick={() => setSelectedLog(null)}
                className='px-6 py-2.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black rounded-xl transition-all font-bold text-sm shadow-xl'
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
