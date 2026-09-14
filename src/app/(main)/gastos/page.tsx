'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { Receipt, Plus, Building2, RefreshCcw, Pencil, Trash2 } from 'lucide-react';
import { fetchExpensesDashboard, createExpenseAction, updateExpenseAction, deleteExpenseAction } from '@/features/expense/actions/expense.actions';
import { useExpenseStore } from '@/features/expense/store/expense.store';
import type { ExpenseRow } from '@/features/expense/domain/expense-dashboard.types';
import type { ExpenseInput, ExpenseUpdateInput } from '@/features/expense/domain/expense.schema';
import { ExpenseFormModal } from '@/features/expense/ui/expense-form-modal';
import { fetchProviders } from '@/features/provider/actions/provider.actions';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { GlobalMessage } from '@/components/ui/alert';
import { invalidateAllCaches } from '@/stores';
import { TEST_IDS } from '@/constants/test-ids';

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function GastosPage() {
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const { data, setData } = useExpenseStore();

  const [providers, setProviders] = useState<ProviderDef[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseRow | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ExpenseRow | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDashboard = (start?: string, end?: string) => {
    startTransition(async () => {
      const res = await fetchExpensesDashboard(start ?? startDate, end ?? endDate);
      if (res.success) setData(res.data);
    });
  };

  useEffect(() => {
    loadDashboard(startDate, endDate);
    fetchProviders().then(setProviders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setGlobalMessage({ type, text });
    setTimeout(() => setGlobalMessage(null), 4500);
  };

  const handleSync = () => {
    invalidateAllCaches();
    loadDashboard();
  };

  const openCreateModal = () => {
    setServerError(null);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExpenseRow) => {
    setServerError(null);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSubmit = (formData: ExpenseInput | ExpenseUpdateInput) => {
    setServerError(null);
    startSaveTransition(async () => {
      const result = editingItem ? await updateExpenseAction(editingItem.id, formData as ExpenseUpdateInput) : await createExpenseAction(formData as ExpenseInput);

      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setIsModalOpen(false);
      showMessage('success', result.message || 'Operación exitosa');
      invalidateAllCaches();
      loadDashboard();
    });
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    setItemToDelete(null);
    startSaveTransition(async () => {
      const result = await deleteExpenseAction(id);
      if (!result.success) {
        showMessage('error', result.error);
        return;
      }
      showMessage('success', result.message || 'Boleta eliminada');
      invalidateAllCaches();
      loadDashboard();
    });
  };

  const renderTable = (title: string, icon: ReactNode, rows: ExpenseRow[]) => (
    <div className='lg:col-span-6 h-[480px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col'>
      <div className='p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0'>
        <h3 className='font-black flex items-center gap-2 text-zinc-900 dark:text-zinc-100'>
          {icon} {title}
        </h3>
        <span className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>Últimos Datos</span>
      </div>
      <div className='p-0 overflow-x-auto overflow-y-auto flex-1 custom-scrollbar'>
        <table className='w-full text-[15px] text-left text-zinc-600 dark:text-zinc-400'>
          <thead className='sticky top-0 z-10 text-sm uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'>
            <tr className='text-left text-sm font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800'>
              <th className='px-6 py-4'>Nro. de boleta</th>
              <th className='px-4 py-4 text-right'>Importe</th>
              <th className='px-4 py-4'>Fecha</th>
              <th className='px-6 py-4'>Proveedor</th>
              <th className='px-4 py-4 text-right'>Acciones</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
            {rows.map((row) => (
              <tr
                key={row.id}
                className='hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
              >
                <td className='px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100'>
                  {row.pointOfSale}-{row.receiptNumber}
                </td>
                <td className='px-4 py-4 text-right font-black text-zinc-600 text-[16px]'>${row.amount.toLocaleString('es-AR')}</td>
                <td className='px-4 py-4'>{new Date(row.date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</td>
                <td
                  className='px-6 py-4 max-w-[140px] truncate'
                  title={row.providerName}
                >
                  {row.providerName}
                </td>
                <td className='px-4 py-4'>
                  <div className='flex items-center justify-end gap-1'>
                    <button
                      onClick={() => openEditModal(row)}
                      className='p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'
                      title='Editar'
                    >
                      <Pencil className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => setItemToDelete(row)}
                      className='p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors'
                      title='Eliminar'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className='px-8 py-10 text-center text-zinc-400 font-bold uppercase text-[10px]'
                >
                  No hay boletas cargadas en el periodo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div
      className='flex flex-col h-full space-y-8 animate-in fade-in duration-500 overflow-y-auto pr-2 custom-scrollbar pb-10 outline-none ring-0 focus:ring-0 focus-visible:ring-0'
      tabIndex={-1}
    >
      {/* Header & Filter */}
      <div className='flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0'>
        <div>
          <h1 className='text-3xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3'>
            <Receipt className='text-zinc-600' /> Gastos
          </h1>
          <p className='text-zinc-500 text-sm font-medium mt-1'>Boletas de compra a proveedores (Tech y Librería).</p>
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full xl:w-auto'>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={(v) => {
              setStartDate(v);
              loadDashboard(v, endDate);
            }}
            onEndChange={(v) => {
              setEndDate(v);
              loadDashboard(startDate, v);
            }}
            onClear={() => {
              setStartDate('');
              setEndDate('');
              loadDashboard('', '');
            }}
          />
          <button
            onClick={handleSync}
            disabled={isPending}
            data-testid={TEST_IDS.general.btnSincronizar}
            className='px-6 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg text-base transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 group'
          >
            {isPending ? (
              'Recalculando...'
            ) : (
              <>
                <RefreshCcw className='w-4 h-4 group-hover:rotate-180 transition-transform duration-500' />
                Sincronizar
              </>
            )}
          </button>
          <button
            onClick={openCreateModal}
            data-testid={TEST_IDS.general.btnAgregar}
            className='px-6 py-2 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg text-base transition-all shadow-sm flex items-center justify-center gap-2'
          >
            <Plus className='w-4 h-4' /> Ingresar Nueva Boleta
          </button>
        </div>
      </div>

      <GlobalMessage
        message={globalMessage}
        className='shrink-0'
      />

      {/* KPI Cards: un cuadrado por proveedor con boletas en el periodo */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0'>
        {(data?.kpisByProvider ?? []).map((kpi) => (
          <div
            key={kpi.providerId}
            className='bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col'
          >
            <div className='flex justify-between items-start mb-3'>
              <div className='p-2 bg-zinc-50 dark:bg-zinc-500/10 rounded-lg'>
                <Building2 className='w-5 h-5 text-zinc-600 dark:text-zinc-400' />
              </div>
            </div>
            <span
              className='text-[10px] font-black uppercase text-zinc-400 tracking-widest truncate'
              title={kpi.providerName}
            >
              {kpi.providerName}
            </span>
            <span className='text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1'>${kpi.total.toLocaleString('es-AR')}</span>
          </div>
        ))}
        {data && data.kpisByProvider.length === 0 && <div className='col-span-full text-center text-zinc-400 font-bold uppercase text-[10px] py-6'>No hay gastos cargados en el periodo</div>}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        {renderTable('Boletas Tech', <Receipt className='w-5 h-5 text-zinc-500' />, data?.techExpenses ?? [])}
        {renderTable('Boletas Librería', <Receipt className='w-5 h-5 text-zinc-500' />, data?.libreriaExpenses ?? [])}
      </div>

      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingItem={editingItem}
        serverError={serverError}
        isPending={isSaving}
        providers={providers}
      />

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title='Eliminar Boleta'
        description={itemToDelete ? `¿Eliminar la boleta ${itemToDelete.pointOfSale}-${itemToDelete.receiptNumber} de ${itemToDelete.providerName}? Esta acción no se puede deshacer.` : ''}
        isPending={isSaving}
      />
    </div>
  );
}
