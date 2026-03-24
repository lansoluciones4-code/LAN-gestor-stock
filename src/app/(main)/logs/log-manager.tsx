'use client';

import { useState, useMemo } from 'react';
import { History, Eye, X, Calendar, Search } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { type AuditLogDef } from '@/schemas/audit-log.schema';
import { Table } from '@/components/ui/table';

interface LogManagerProps {
  initialData: AuditLogDef[];
}

export function LogManager({ initialData }: LogManagerProps) {
  const [logs] = useState<AuditLogDef[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogDef | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        log.action.toLowerCase().includes(term) ||
        log.entity.toLowerCase().includes(term) ||
        log.user?.username?.toLowerCase().includes(term) ||
        log.entityId?.toLowerCase().includes(term);
      
      const logTime = new Date(log.createdAt).getTime();
      
      let matchesStart = true;
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        matchesStart = logTime >= start.getTime();
      }
      
      let matchesEnd = true;
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        matchesEnd = logTime <= end.getTime();
      }
      
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [logs, searchTerm, startDate, endDate]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'UPDATE': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'DELETE': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
      case 'LOGIN': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800';
    }
  };

  const getHumanReadableDescription = (log: AuditLogDef) => {
    const detail = log.detail as any;
    const entityNames: Record<string, string> = {
      'USER': 'Usuario',
      'PROVIDER': 'Proveedor',
      'PRODUCT': 'Producto',
      'CUSTOMER': 'Cliente',
      'DEVICE': 'Equipo',
      'SALE': 'Venta'
    };

    const entityLabel = entityNames[log.entity] || log.entity;
    const name = detail?.name || detail?.username || '';

    if (log.action === 'LOGIN') return `${log.user?.username || 'Sistema'} inició sesión en la plataforma.`;

    let actionText = '';
    switch (log.action) {
      case 'CREATE': actionText = 'Registró'; break;
      case 'UPDATE': actionText = 'Actualizó'; break;
      case 'DELETE': actionText = 'Eliminó'; break;
      case 'LOGIN': actionText = 'Inició sesión'; break;
      default: actionText = 'Operó sobre';
    }

    if (log.entity === 'SALE' && log.action === 'CREATE') return `Venta generada por $${(detail?.total || 0).toLocaleString('es-AR')}.`;
    if (log.entity === 'SALE' && log.action === 'DELETE') return `Anulación de venta ID ${log.entityId?.substring(0,8) || '--'}. Stock revertido.`;
    if (log.entity === 'PRODUCT' && log.action === 'CREATE') return `Alta de stock para ${detail?.description || 'equipo'}. Unidades: ${detail?.stock || 0}.`;

    if (name) return `${actionText} ${entityLabel.toLowerCase()} "${name}".`;
    return `${actionText} ${entityLabel.toLowerCase()} (Ref ID: ${log.entityId?.substring(0,8) || '--'}).`;
  };

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden animate-in fade-in duration-300'>
      {/* Header Filters */}
      <div className='flex flex-col lg:flex-row gap-4 mb-6 shrink-0'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
          <input
            type='text'
            placeholder='Filtrar registros por acción, ID o usuario...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors'
          />
        </div>
        
        <DateRangePicker 
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          onClear={() => { setStartDate(''); setEndDate(''); }}
        />
      </div>

      <Table headers={['Fecha y Hora', 'Operador', 'Acción', 'Entidad', 'Referencia', 'Acciones']}>
        {filteredLogs.map((log) => (
          <tr key={log.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors'>
            <td className='px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 text-[16px] whitespace-nowrap'>
                {new Date(log.createdAt).toLocaleDateString('es-AR')} <span className='text-indigo-600 dark:text-indigo-400 ml-1'>{new Date(log.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </td>
            <td className='px-6 py-4 font-bold text-zinc-700 dark:text-zinc-300 uppercase text-[15px]'>
               {log.user?.username || 'SISTEMA'}
            </td>
            <td className='px-6 py-4 whitespace-nowrap text-[14px] font-black'>
               <span className={`px-2.5 py-1 rounded border ${getActionColor(log.action)}`}>
                  {log.action}
               </span>
            </td>
            <td className='px-6 py-4 text-[14px] font-black uppercase text-zinc-400 tracking-widest'>
               {log.entity}
            </td>
            <td className='px-6 py-4 text-[14px] font-bold text-zinc-500'>
               {log.entityId?.substring(0,8).toUpperCase() || '--'}
            </td>
            <td className='px-6 py-4 flex gap-2 justify-end'>
              <button 
                onClick={() => setSelectedLog(log)}
                className='p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-lg transition-colors'
                title='Ver Detalle'
              >
                <Eye className='w-4 h-4' />
              </button>
            </td>
          </tr>
        ))}
        {filteredLogs.length === 0 && (
          <tr><td colSpan={6} className='px-6 py-12 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest'>Sin registros seleccionados</td></tr>
        )}
      </Table>

      {selectedLog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200'>
          <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]'>
            <div className='flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50'>
              <h3 className='text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100'>
                <History className='w-5 h-5 text-indigo-500' />
                Resumen de Transacción
              </h3>
              <button onClick={() => setSelectedLog(null)} className='p-1 text-zinc-500 hover:text-zinc-900'><X className='w-5 h-5'/></button>
            </div>
            <div className='p-6 overflow-y-auto custom-scrollbar space-y-6'>
              <div className='p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg'>
                 <h4 className='text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1'>Detalle Descriptivo</h4>
                 <p className='text-base font-bold text-zinc-900 dark:text-zinc-100'>{getHumanReadableDescription(selectedLog)}</p>
              </div>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                 <div><span className='block text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>Fecha y Hora Exacta</span> <span className='font-bold text-zinc-700 dark:text-zinc-300'>{new Date(selectedLog.createdAt).toLocaleString('es-AR')}</span></div>
                 <div><span className='block text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>ID de Auditoría</span> <span className='text-xs opacity-60'>{selectedLog.id}</span></div>
                 <div><span className='block text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>Entidad Afectada</span> <span className='font-bold text-zinc-700 dark:text-zinc-300'>{selectedLog.entity}</span></div>
                 <div><span className='block text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>ID de Referencia</span> <span className='text-xs font-bold'>{selectedLog.entityId}</span></div>
              </div>
              <div className='space-y-4'>
                <h4 className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>Estructura de Datos (Inmutable)</h4>
                <div className='bg-zinc-900 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-800 font-mono text-[10px] text-indigo-300 overflow-x-auto whitespace-pre'>
                  {JSON.stringify(selectedLog.detail, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
