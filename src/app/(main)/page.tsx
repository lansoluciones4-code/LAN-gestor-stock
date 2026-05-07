'use client';

import { useState, useTransition, useEffect } from 'react';
import { TrendingUp, TrendingDown, Package, Users, DollarSign, Activity, ArrowUpRight, Clock, Briefcase, CreditCard, Banknote } from 'lucide-react';
import { fetchDashboardStats } from '@/features/stats/actions/stats.actions';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { invalidateAllCaches } from '@/stores';
import { useStatsStore } from '@/features/stats/store/stats.store';
import { RefreshCcw } from 'lucide-react';

export default function DashboardPage() {
  const [isPending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { stats, setStats, isLoaded } = useStatsStore();

  const loadStats = (start?: string, end?: string) => {
    startTransition(async () => {
      const res = await fetchDashboardStats(start || startDate, end || endDate);
      if (res.success) {
        setStats(res.data);
      }
    });
  };

  useEffect(() => {
    if (!isLoaded) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const handleSync = () => {
    invalidateAllCaches();
    loadStats();
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
            <Activity className='text-indigo-600' /> Resumen de Actividad
          </h1>
          <p className='text-zinc-500 text-sm font-medium mt-1'>Panel de Control e Inteligencia de Negocio.</p>
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto'>
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
            className='px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 group'
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0'>
        <div className='bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg'>
              <DollarSign className='w-5 h-5 text-indigo-600' />
            </div>
            <span className='text-[10px] font-bold text-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter'>Ingresos</span>
          </div>
          <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Bruto Ventas</span>
          <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>${stats?.totalRevenue?.toLocaleString('es-AR') || '0'}</span>
        </div>

        <div className='bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-md shadow-indigo-50 dark:shadow-none flex flex-col ring-2 ring-indigo-500/5'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg'>
              <TrendingUp className='w-5 h-5 text-emerald-600' />
            </div>
            <span className='text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1'>
              <ArrowUpRight className='w-3 h-3' /> NETO
            </span>
          </div>
          <span className='text-[10px] font-black uppercase text-indigo-500 tracking-widest leading-none'>Ganancia Real</span>
          <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>${stats?.netProfit?.toLocaleString('es-AR') || '0'}</span>
        </div>

        <div className='bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col hover:border-emerald-500/50 transition-colors'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg'>
              <Banknote className='w-5 h-5 text-emerald-600' />
            </div>
            <span className='text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter'>EFECTIVO</span>
          </div>
          <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none'>Pagos Recibidos</span>
          <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>${stats?.cashRevenue?.toLocaleString('es-AR') || '0'}</span>
        </div>

        <div className='bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col hover:border-blue-500/50 transition-colors'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg'>
              <CreditCard className='w-5 h-5 text-blue-600' />
            </div>
            <span className='text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter'>TRANSFERENCIA</span>
          </div>
          <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none'>Pagos Recibidos</span>
          <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>${stats?.transferRevenue?.toLocaleString('es-AR') || '0'}</span>
        </div>

        <div className='bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg'>
              <TrendingDown className='w-5 h-5 text-rose-600' />
            </div>
            <span className='text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full'>COSTO</span>
          </div>
          <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Pérdidas Totales</span>
          <span className='text-xl font-black text-rose-600 dark:text-rose-400 mt-1'>
            -$
            {stats?.totalLossCost?.toLocaleString('es-AR') || '0'}
          </span>
        </div>

        <div className='bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-2 bg-zinc-50 dark:bg-zinc-500/10 rounded-lg'>
              <Package className='w-5 h-5 text-zinc-600' />
            </div>
          </div>
          <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Valor en Stock</span>
          <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>${stats?.currentInventoryCost?.toLocaleString('es-AR') || '0'}</span>
        </div>

        <div className='bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-2 bg-zinc-50 dark:bg-zinc-500/10 rounded-lg'>
              <Activity className='w-5 h-5 text-amber-500' />
            </div>
          </div>
          <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Unidades Físicas</span>
          <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>{stats?.totalEquipos || '0'}</span>
        </div>

        <div className='bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col'>
          <div className='flex justify-between items-start mb-4'>
            <div className='p-2 bg-zinc-50 dark:bg-zinc-500/10 rounded-lg'>
              <Briefcase className='w-5 h-5 text-zinc-600' />
            </div>
          </div>
          <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Órdenes Procesadas</span>
          <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>{stats?.salesCount || '0'}</span>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        {/* Top Sellers Table */}
        <div className='lg:col-span-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col'>
          <div className='p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between'>
            <h3 className='font-black flex items-center gap-2 text-zinc-900 dark:text-zinc-100'>
              <Users className='w-5 h-5 text-indigo-500' /> Vendedores con Mayor Rendimiento
            </h3>
            <span className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>Últimos Datos</span>
          </div>
          <div className='p-0 overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar'>
            <table className='w-full text-[17px] text-left text-zinc-600 dark:text-zinc-400'>
              <thead className='sticky top-0 z-10 text-sm uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'>
                <tr className='text-left text-sm font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800'>
                  <th className='px-8 py-4'>Perfil Vendedor</th>
                  <th className='px-8 py-4 text-center'>Ventas</th>
                  <th className='px-8 py-4 text-right pr-12'>Importe Generado</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
                {stats?.topSellers.map((seller: any, idx: number) => (
                  <tr
                    key={idx}
                    className='hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
                  >
                    <td className='px-8 py-5 flex items-center gap-4'>
                      <div className='w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 font-bold'>{seller.username[0].toUpperCase()}</div>
                      <div className='min-w-0'>
                        <p
                          className='font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]'
                          title={seller.username}
                        >
                          {seller.username}
                        </p>
                        <p className='text-xs font-bold text-zinc-400 uppercase tracking-tighter truncate max-w-[180px]'>Responsable de Ventas</p>
                      </div>
                    </td>
                    <td className='px-8 py-5 text-center font-black text-[17px] text-zinc-700 dark:text-zinc-300'>{seller.count}</td>
                    <td className='px-8 py-5 text-right font-black text-emerald-600 text-[18px] pr-12'>${seller.total.toLocaleString('es-AR')}</td>
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

        {/* Informative Grid */}
        <div className='lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-2 pb-6'>
          <div className='bg-zinc-100 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700'>
            <div className='flex items-center gap-3 mb-4'>
              <Clock className='w-5 h-5 text-indigo-500' />
              <h4 className='font-bold text-sm'>Actividad Reciente</h4>
            </div>
            <p className='text-xs text-zinc-500 leading-relaxed font-medium'>
              El inventario actual cuenta con <strong>{stats?.totalEquipos}</strong> unidades operativas distribuidas en <strong>{stats?.totalModels}</strong> modelos diferentes.
            </p>
          </div>

          <div className='bg-zinc-100 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700'>
            <div className='flex items-center gap-3 mb-4'>
              <ArrowUpRight className='w-5 h-5 text-emerald-500' />
              <h4 className='font-bold text-sm'>Rendimiento Operativo</h4>
            </div>
            <p className='text-xs text-zinc-500 leading-relaxed font-medium'>
              Se han procesado <strong>{stats?.salesCount}</strong> órdenes de venta, generando una ganancia bruta de <strong>${stats?.totalRevenue?.toLocaleString('es-AR')}</strong>.
            </p>
          </div>

          <div className='bg-rose-50/50 dark:bg-rose-900/10 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/30 transition-all hover:border-rose-200 dark:hover:border-rose-900/50'>
            <div className='flex items-center gap-3 mb-4'>
              <TrendingDown className='w-5 h-5 text-rose-500' />
              <h4 className='font-bold text-sm text-rose-800 dark:text-rose-400'>Impacto de Pérdidas</h4>
            </div>
            <p className='text-xs text-rose-600/80 dark:text-rose-400/80 leading-relaxed font-medium'>
              Se han registrado mermas por un valor acumulado de <strong>${stats?.totalLossCost?.toLocaleString('es-AR')}</strong>, afectando el margen neto final.
            </p>
          </div>

          <div className='bg-zinc-100 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700'>
            <div className='flex items-center gap-3 mb-4'>
              <Briefcase className='w-5 h-5 text-amber-500' />
              <h4 className='font-bold text-sm'>Inversión en Activos</h4>
            </div>
            <p className='text-xs text-zinc-500 leading-relaxed font-medium'>
              El capital total actualmente retenido en stock físico (mercadería disponible) asciende a <strong>${stats?.currentInventoryCost?.toLocaleString('es-AR')}</strong>.
            </p>
          </div>

          <div className='bg-zinc-100 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700'>
            <div className='flex items-center gap-3 mb-4'>
              <DollarSign className='w-5 h-5 text-emerald-500' />
              <h4 className='font-bold text-sm'>Flujo de Caja</h4>
            </div>
            <p className='text-xs text-zinc-500 leading-relaxed font-medium'>
              Segmentación de cobros: <strong>${stats?.cashRevenue?.toLocaleString('es-AR')}</strong> en efectivo y <strong>${stats?.transferRevenue?.toLocaleString('es-AR')}</strong> vía transferencia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
