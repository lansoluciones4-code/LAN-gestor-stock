'use client';

import { useState, useTransition, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight, Clock, Briefcase, UploadCloud, AlertTriangle, Cpu, BookOpen, Printer, Wrench, Monitor, FileText } from 'lucide-react';
import { fetchDashboardStats } from '@/features/stats/actions/stats.actions';
import { publicarStock, getLastSyncInfo, type LastSyncInfo } from '@/features/sync/actions/publish-stock.actions';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { invalidateAllCaches } from '@/stores';
import { useStatsStore } from '@/features/stats/store/stats.store';
import { RefreshCcw } from 'lucide-react';
import { getPaymentTypeMeta, type PaymentType } from '@/lib/payment-types';

const PAYMENT_REVENUE_KEY: Record<string, string> = {
  transferencia: 'transferRevenue',
  efectivo: 'cashRevenue',
  debito: 'debitoRevenue',
  credito: 'creditoRevenue',
};

const PAYMENT_ORDER: PaymentType[] = ['transferencia', 'credito', 'efectivo', 'debito'];

const BUSINESS_KPIS: { key: string; label: string; statsKey: string; icon: typeof Cpu; iconColor: string }[] = [
  { key: 'servicio', label: 'Servicio Técnico', statsKey: 'servicioTecnicoRevenue', icon: Wrench, iconColor: 'text-white' },
  { key: 'tech', label: 'Tech', statsKey: 'techRevenue', icon: Cpu, iconColor: 'text-blue-600 dark:text-blue-400' },
  { key: 'impresiones', label: 'Impresiones', statsKey: 'impresionesRevenue', icon: Printer, iconColor: 'text-yellow-500 dark:text-yellow-400' },
  { key: 'libreria', label: 'Librería', statsKey: 'libreriaRevenue', icon: BookOpen, iconColor: 'text-green-600 dark:text-green-400' },
  { key: 'ciber', label: 'Ciber', statsKey: 'ciberRevenue', icon: Monitor, iconColor: 'text-red-600 dark:text-red-400' },
  { key: 'tramites', label: 'Trámites Online', statsKey: 'tramitesRevenue', icon: FileText, iconColor: 'text-zinc-500 dark:text-zinc-300' },
];

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatTimeAgo(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMin = Math.floor((Date.now() - target.getTime()) / 60000);
  if (diffMin < 1) return 'hace instantes';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} d`;
}

export default function DashboardPage() {
  const [isPending, startTransition] = useTransition();
  const [isPublishing, startPublishTransition] = useTransition();
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [lastSync, setLastSync] = useState<LastSyncInfo | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const { stats, setStats } = useStatsStore();

  const loadStats = (start?: string, end?: string) => {
    startTransition(async () => {
      const res = await fetchDashboardStats(start || startDate, end || endDate);
      if (res.success) {
        setStats(res.data);
      }
    });
  };

  useEffect(() => {
    loadStats(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getLastSyncInfo().then(setLastSync);
  }, []);

  const handleSync = () => {
    invalidateAllCaches();
    loadStats();
  };

  const handlePublish = () => {
    setPublishError(null);
    startPublishTransition(async () => {
      const res = await publicarStock();
      if (res.success) {
        const info = await getLastSyncInfo();
        setLastSync(info);
      } else {
        setPublishError(res.error);
      }
    });
  };

  return (
    <div
      className='flex flex-col h-full space-y-8 animate-in fade-in duration-500 overflow-y-auto pr-2 custom-scrollbar pb-10 outline-none ring-0 focus:ring-0 focus-visible:ring-0'
      tabIndex={-1}
    >
      {/* Header & Filter */}
      <div className='flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0'>
        <div>
          <h1 className='text-3xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3'>
            <Activity className='text-zinc-600' /> Resumen de Actividad
          </h1>
          <p className='text-zinc-500 text-sm font-medium mt-1'>Panel de Control e Inteligencia de Negocio.</p>
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full xl:w-auto'>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={(v) => {
              setStartDate(v);
              invalidateAllCaches();
            }}
            onEndChange={(v) => {
              setEndDate(v);
              invalidateAllCaches();
            }}
            onClear={() => {
              setStartDate('');
              setEndDate('');
              invalidateAllCaches();
            }}
          />
          <button
            onClick={handleSync}
            disabled={isPending}
            className='px-6 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg text-base transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 group'
          >
            {isPending ? (
              'Recalculando...'
            ) : (
              <>
                <RefreshCcw className={`w-4 h-4 ${isPending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                Sincronizar Panel
              </>
            )}
          </button>
          <div className='flex flex-col gap-1'>
            {(lastSync || publishError) && (
              <div className='flex flex-col items-end'>
                {lastSync && (
                  <p className='text-xs font-medium text-zinc-400 whitespace-nowrap'>
                    Última sincronización: {formatTimeAgo(lastSync.at)} por {lastSync.username}
                  </p>
                )}
                {publishError && <p className='text-xs font-bold text-zinc-500 whitespace-nowrap'>{publishError}</p>}
              </div>
            )}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className='px-6 py-2 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 dark:bg-zinc-200 dark:hover:bg-zinc-300 dark:text-zinc-900 dark:border-zinc-300 rounded-lg text-base transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2'
            >
              {isPublishing ? (
                'Publicando...'
              ) : (
                <>
                  <UploadCloud className='w-4 h-4' />
                  Publicar cambios al sitio web
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0'>
        {/* Fila 1 y parte de la 2: ingresos por rubro */}
        {BUSINESS_KPIS.map(({ key, label, statsKey, icon: Icon, iconColor }) => (
          <div
            key={key}
            className='bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col'
          >
            <div className='flex justify-between items-start mb-3'>
              <div className='p-2 bg-zinc-50 dark:bg-zinc-500/10 rounded-lg'>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
            </div>
            <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>{label}</span>
            <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>${(stats?.[statsKey] ?? 0).toLocaleString('es-AR')}</span>
          </div>
        ))}

        <div className='bg-white dark:bg-zinc-900 p-4 rounded-2xl border-2 border-blue-800 dark:border-blue-600 shadow-sm flex flex-col'>
          <div className='flex justify-between items-start mb-3'>
            <div className='p-2 bg-zinc-50 dark:bg-zinc-500/10 rounded-lg'>
              <Briefcase className='w-5 h-5 text-blue-800 dark:text-blue-400' />
            </div>
          </div>
          <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Órdenes Procesadas</span>
          <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>{stats?.salesCount || '0'}</span>
        </div>

        <div className='bg-white dark:bg-zinc-900 p-4 rounded-2xl border-2 border-green-400 dark:border-green-500 shadow-lg shadow-green-200/60 dark:shadow-green-500/10 flex flex-col ring-4 ring-green-400/20'>
          <div className='flex justify-between items-start mb-3'>
            <div className='p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg'>
              <TrendingUp className='w-5 h-5 text-emerald-600' />
            </div>
            <span className='text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1'>
              <ArrowUpRight className='w-3 h-3' /> NETO
            </span>
          </div>
          <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Ganancias</span>
          <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>${(stats?.netProfit ?? 0).toLocaleString('es-AR')}</span>
        </div>

        {/* Fila 3: medios de pago, ahora tarjeta completa cada uno */}
        {PAYMENT_ORDER.map((t) => {
          const meta = getPaymentTypeMeta(t);
          const Icon = meta.icon;
          const revenue = stats?.[PAYMENT_REVENUE_KEY[t]] ?? 0;
          return (
            <div
              key={t}
              className={`p-4 rounded-2xl border flex flex-col transition-colors ${meta.resting} ${meta.hover}`}
            >
              <div className='flex justify-between items-start mb-3'>
                <Icon className='w-5 h-5' />
              </div>
              <span className='text-[10px] font-black uppercase tracking-widest'>{meta.label}</span>
              <span className='text-xl font-black mt-1'>${revenue.toLocaleString('es-AR')}</span>
            </div>
          );
        })}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        {/* Top Sellers Table */}
        <div className='lg:col-span-6 h-[480px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col'>
          <div className='p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0'>
            <h3 className='font-black flex items-center gap-2 text-zinc-900 dark:text-zinc-100'>
              <Users className='w-5 h-5 text-zinc-500' /> Vendedores con Mayor Rendimiento
            </h3>
            <span className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>Últimos Datos</span>
          </div>
          <div className='p-0 overflow-x-auto overflow-y-auto flex-1 custom-scrollbar'>
            <table className='w-full text-[17px] text-left text-zinc-600 dark:text-zinc-400'>
              <thead className='sticky top-0 z-10 text-sm uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'>
                <tr className='text-left text-sm font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800'>
                  <th className='px-6 py-4 w-[45%]'>Perfil Vendedor</th>
                  <th className='px-4 py-4 w-[20%] text-center'>Ventas</th>
                  <th className='px-4 py-4 w-[35%] text-center'>Importe Generado</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
                {stats?.topSellers.map((seller: any, idx: number) => (
                  <tr
                    key={idx}
                    className='hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
                  >
                    <td className='px-6 py-5 flex items-center gap-3'>
                      <div className='w-9 h-9 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-500/20 flex items-center justify-center text-zinc-600 font-bold'>{seller.username[0].toUpperCase()}</div>
                      <div className='min-w-0'>
                        <p
                          className='font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]'
                          title={seller.username}
                        >
                          {seller.username}
                        </p>
                        <p className='text-xs font-bold text-zinc-400 uppercase tracking-tighter truncate max-w-[140px]'>Responsable de Ventas</p>
                      </div>
                    </td>
                    <td className='px-4 py-5 text-center font-black text-[17px] text-zinc-700 dark:text-zinc-300'>{seller.count}</td>
                    <td className='px-4 py-5 text-center font-black text-zinc-600 text-[16px]'>${seller.total.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
                {(!stats?.topSellers || stats.topSellers.length === 0) && (
                  <tr>
                    <td
                      colSpan={3}
                      className='px-8 py-10 text-center text-zinc-400 font-bold uppercase text-[10px]'
                    >
                      No hay transacciones en el periodo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tech Sales Table */}
        <div className='lg:col-span-6 h-[480px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col'>
          <div className='p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0'>
            <h3 className='font-black flex items-center gap-2 text-zinc-900 dark:text-zinc-100'>
              <Cpu className='w-5 h-5 text-zinc-500' /> Ventas Tech
            </h3>
            <span className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>Últimos Datos</span>
          </div>
          <div className='p-0 overflow-x-auto overflow-y-auto flex-1 custom-scrollbar'>
            <table className='w-full text-[15px] text-left text-zinc-600 dark:text-zinc-400'>
              <thead className='sticky top-0 z-10 text-sm uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'>
                <tr className='text-left text-sm font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800'>
                  <th className='px-6 py-4'>Producto</th>
                  <th className='px-6 py-4'>Vendedor</th>
                  <th className='px-6 py-4 text-right'>Monto</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
                {stats?.techSales.map((sale: any, idx: number) => (
                  <tr
                    key={idx}
                    className='hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
                  >
                    <td
                      className='px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate'
                      title={sale.productLabel}
                    >
                      {sale.productLabel}
                    </td>
                    <td
                      className='px-6 py-4 max-w-[120px] truncate'
                      title={sale.vendorUsername}
                    >
                      {sale.vendorUsername}
                    </td>
                    <td className='px-6 py-4 text-right font-black text-zinc-600 text-[16px]'>${sale.amount.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
                {(!stats?.techSales || stats.techSales.length === 0) && (
                  <tr>
                    <td
                      colSpan={3}
                      className='px-8 py-10 text-center text-zinc-400 font-bold uppercase text-[10px]'
                    >
                      No hay ventas de Tech en el periodo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informative Grid */}
        <div className='lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-2 pb-6'>
          <div className='bg-zinc-100 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700'>
            <div className='flex items-center gap-3 mb-4'>
              <Clock className='w-5 h-5 text-zinc-500' />
              <h4 className='font-bold text-sm'>Actividad Reciente</h4>
            </div>
            <p className='text-xs text-zinc-500 leading-relaxed font-medium'>
              El inventario actual cuenta con <strong>{stats?.totalEquipos}</strong> unidades operativas distribuidas en <strong>{stats?.totalModels}</strong> modelos diferentes.
            </p>
          </div>

          <div className='bg-zinc-100 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700'>
            <div className='flex items-center gap-3 mb-4'>
              <ArrowUpRight className='w-5 h-5 text-zinc-500' />
              <h4 className='font-bold text-sm'>Rendimiento Operativo</h4>
            </div>
            <p className='text-xs text-zinc-500 leading-relaxed font-medium'>
              Se han procesado <strong>{stats?.salesCount}</strong> órdenes de venta, generando una ganancia bruta de <strong>${stats?.totalRevenue?.toLocaleString('es-AR')}</strong>.
            </p>
          </div>

          <div className='bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 transition-all hover:border-amber-200 dark:hover:border-amber-900/50'>
            <div className='flex items-center gap-3 mb-4'>
              <AlertTriangle className='w-5 h-5 text-amber-500' />
              <h4 className='font-bold text-sm text-amber-800 dark:text-amber-400'>Alerta de Stock</h4>
            </div>
            <p className='text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed font-medium'>
              Hay <strong>{stats?.lowStockCount ?? 0}</strong> productos con pocas unidades — revisá la reposición para no quedarte sin stock.
            </p>
          </div>

          <div className='bg-zinc-100 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700'>
            <div className='flex items-center gap-3 mb-4'>
              <Briefcase className='w-5 h-5 text-zinc-500' />
              <h4 className='font-bold text-sm'>Inversión en Activos</h4>
            </div>
            <p className='text-xs text-zinc-500 leading-relaxed font-medium'>
              El capital total actualmente retenido en stock físico (mercadería disponible) asciende a <strong>${stats?.currentInventoryCost?.toLocaleString('es-AR')}</strong>.
            </p>
          </div>

          <div className='bg-zinc-100 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700'>
            <div className='flex items-center gap-3 mb-4'>
              <DollarSign className='w-5 h-5 text-zinc-500' />
              <h4 className='font-bold text-sm'>Flujo de Caja</h4>
            </div>
            <p className='text-xs text-zinc-500 leading-relaxed font-medium'>
              Segmentación de cobros: <strong>${stats?.cashRevenue?.toLocaleString('es-AR')}</strong> en efectivo, <strong>${stats?.transferRevenue?.toLocaleString('es-AR')}</strong> por transferencia, <strong>${stats?.debitoRevenue?.toLocaleString('es-AR')}</strong> con débito y <strong>${stats?.creditoRevenue?.toLocaleString('es-AR')}</strong> con crédito.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
