'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { History, X, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { type AuditLogDef } from '@/features/audit/domain/audit-log.schema';
import { fetchAuditLogs } from '@/features/audit/actions/audit.actions';
import { useAuditStore } from '@/features/audit/store/audit.store';
import { invalidateAllCaches } from '@/stores';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { getAuditColumns } from '@/config/tables/audit-columns';
import { TEST_IDS } from '@/constants/test-ids';
import { renderAuditCard } from '@/config/cards/audit-card';

const ENTITY_LABELS: Record<string, string> = {
  USER: 'USUARIO', PROVIDER: 'PROVEEDOR', PRODUCT: 'PRODUCTO',
  CUSTOMER: 'CLIENTE', DEVICE: 'EQUIPO', SALE: 'VENTA',
};

const PAGE_SIZE = 50;

function AuditDetailModal({ log, onClose }: { log: AuditLogDef; onClose: () => void }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]'>
        <div className='flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50'>
          <h3 className='text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100'>
            <History className='w-5 h-5 text-indigo-500' />
            Resumen de Transacción
          </h3>
          <button onClick={onClose} className='p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors'>
            <X className='w-5 h-5' />
          </button>
        </div>
        <div className='p-6 overflow-y-auto custom-scrollbar space-y-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
            <div className='space-y-0.5'>
              <span className='block text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>Fecha y Hora Exacta</span>
              <span className='font-bold text-zinc-700 dark:text-zinc-300'>{new Date(log.createdAt).toLocaleString('es-AR')}</span>
            </div>
            <div className='space-y-0.5'>
              <span className='block text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>ID de Auditoría</span>
              <span className='text-xs opacity-90 font-mono'>{log.id}</span>
            </div>
            <div className='space-y-0.5'>
              <span className='block text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>Entidad Afectada</span>
              <span className='font-bold text-zinc-700 dark:text-zinc-300'>{ENTITY_LABELS[log.entity] || log.entity}</span>
            </div>
            <div className='space-y-0.5'>
              <span className='block text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>Entidad Específica</span>
              <span className='font-bold text-indigo-600 dark:text-indigo-400'>
                {log.product?.device?.name || log.customer?.name || log.provider?.name || log.device?.name || (log.sale ? `VENTA $${log.sale.total}` : '--')}
              </span>
            </div>
            <div className='space-y-0.5'>
              <span className='block text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>ID de Referencia</span>
              <span className='text-[12px] font-mono text-zinc-500 break-all'>{log.entityId || '--'}</span>
            </div>
          </div>
          <div className='space-y-4'>
            <h4 className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>Estructura de Datos</h4>
            <div className='bg-zinc-900 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-800 font-mono text-[11px] text-indigo-300 overflow-x-auto whitespace-pre custom-scrollbar'>
              {JSON.stringify(log.detail, null, 2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
AuditDetailModal.displayName = 'AuditDetailModal';

export function LogPanel() {
  const { logs, setLogs, appendLogs, isLoaded } = useAuditStore();
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(logs.length === 0 || logs.length >= PAGE_SIZE);
  const [selectedLog, setSelectedLog] = useState<AuditLogDef | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { search, setSearch, globalMessage, showGlobalMessage } = useEntityManager<AuditLogDef>();
  const isFirstRender = useRef(true);

  const loadData = useCallback(async (reset = false) => {
    setIsPending(true);
    const res = await fetchAuditLogs({ page: reset ? 1 : page, search, startDate, endDate });
    if (reset) { setLogs(res); setPage(1); }
    else appendLogs(res);
    setHasMore(res.length === PAGE_SIZE);
    setIsPending(false);
  }, [page, search, startDate, endDate, setLogs, appendLogs]);

  const onEndReached = useCallback(() => {
    if (!isPending && hasMore) setPage((p) => p + 1);
  }, [isPending, hasMore]);

  // Initial load
  useEffect(() => {
    if (!isLoaded) { loadData(true).finally(() => setInitialLoading(false)); }
    else { setHasMore(logs.length > 0 && logs.length % PAGE_SIZE === 0); setInitialLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, logs.length]);

  // Filter change → debounced reset
  useEffect(() => {
    if (initialLoading) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isLoaded && !search && !startDate && !endDate) return;
    }
    const timer = setTimeout(() => loadData(true), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, startDate, endDate, initialLoading]);

  // Pagination trigger
  useEffect(() => {
    if (page > 1 && !initialLoading) loadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, initialLoading]);

  // Escape to close detail
  useEffect(() => {
    if (!selectedLog) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedLog(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedLog]);

  const handleSync = async () => {
    invalidateAllCaches();
    await loadData(true);
    showGlobalMessage('success', 'Datos sincronizados con éxito.');
  };

  const columns = getAuditColumns({ onView: setSelectedLog });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar por acción, usuario, entidad, nombre o IDs...'
        searchPlaceholderMobile='Buscar registros...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            onClear={() => { setStartDate(''); setEndDate(''); }}
            data-testid={TEST_IDS.logPanel.inputFiltroFecha}
          />
        }
        actions={
          <Button variant='secondary' size='icon' onClick={handleSync} disabled={isPending} title='Sincronizar' className='h-11 w-11' data-testid={TEST_IDS.general.btnSincronizar}>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      {globalMessage && (
        <div className={`shrink-0 mb-4 p-4 rounded-lg flex items-center shadow-sm text-sm border ${globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'}`}>
          {globalMessage.text}
        </div>
      )}

      <ResponsivePanelView
        columns={columns}
        data={logs}
        isLoading={isPending && page === 1}
        hasMore={hasMore}
        onEndReached={onEndReached}
        emptyMessage='No se han encontrado registros de auditoría.'
        renderCard={renderAuditCard({ onView: setSelectedLog })}
      />

      {selectedLog && <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
