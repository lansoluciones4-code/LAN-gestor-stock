'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Package, RefreshCcw } from 'lucide-react';
import { sparePartFormSchema, type SparePartInput, type SparePartFormInput, type SparePartDef, type SparePartUpdateInput } from '@/features/spare-part/domain/spare-part.schema';
import { useSparePartStore } from '@/features/spare-part/store/spare-part.store';
import { fetchSpareParts, createSparePartAction, updateSparePartAction, deleteSparePartAction } from '@/features/spare-part/actions/spare-part.actions';
import { createCustomerAction } from '@/features/customer/actions/customer.actions';
import { SaleCustomerPicker, type SaleCustomerSelection } from '@/features/sale/ui/components/sale-customer-picker';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { Button } from '@/components/ui/button';
import { getSparePartColumns } from '@/config/tables/spare-part-columns';
import { renderSparePartCard } from '@/config/cards/spare-part-card';
import { normalizeForSearch, blockInvalidPriceKey } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { useAuthStore } from '@/features/auth/store/auth.store';

export function RepuestosPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [showSold, setShowSold] = useState(false);
  const { spareParts, setSpareParts, isLoaded } = useSparePartStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<SparePartDef>();

  const { isPending: isPendingAction, syncData, handleEditSubmit, handleDelete } = useEntityActions<SparePartDef, SparePartInput, SparePartUpdateInput>({
    handlers: { fetchData: fetchSpareParts, createAction: createSparePartAction, updateAction: updateSparePartAction, deleteAction: deleteSparePartAction },
    setStoreData: setSpareParts,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive: false,
  });

  const { initialLoading } = useAutoSync({ isLoaded, sync: () => fetchSpareParts().then(setSpareParts) });

  const [customerSelection, setCustomerSelection] = useState<SaleCustomerSelection>({ mode: 'final' });
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [isResolvingCustomer, setIsResolvingCustomer] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<SparePartFormInput>({ resolver: zodResolver(sparePartFormSchema) });

  const isPending = isPendingAction || isResolvingCustomer;

  const condition = watch('condition');
  const costWatch = watch('cost');
  const profitPercentageWatch = watch('profitPercentage');
  // Precio final = costo + costo*%ganancia (ej. costo 100, ganancia 50% -> 150), igual al `salePrice`
  // que ya calcula el server en sparePartRowSchema — esto es solo la preview en vivo del form.
  const salePricePreview = useMemo(() => {
    const cost = Number(costWatch) || 0;
    const pct = Number(profitPercentageWatch) || 0;
    const profitAmount = cost * (pct / 100);
    return Math.round((cost + profitAmount) * 100) / 100;
  }, [costWatch, profitPercentageWatch]);

  const filteredSpareParts = useMemo(
    () =>
      spareParts.filter((s) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        const text = [normalizeForSearch(s.title), normalizeForSearch(s.customer?.name)].join(' ');
        return terms.every((w) => text.includes(w)) && (showSold || !s.sold);
      }),
    [spareParts, search, showSold]
  );

  const handleEditClick = (item?: SparePartDef) => {
    openFormModal(item);
    setServerError(null);
    setCustomerError(null);
    if (item) {
      reset({ title: item.title, condition: item.condition, cost: item.cost, profitPercentage: item.profitPercentage });
    } else {
      reset({ title: '', condition: 'nuevo', cost: undefined, profitPercentage: undefined });
      setCustomerSelection({ mode: 'final' });
    }
  };

  /** Resuelve la selección de cliente a un id, creando el cliente al vuelo si hace falta (mismo patrón que useSalesActions.resolveCustomerId). Cliente es opcional acá: 'final' = sin cliente asociado. */
  const resolveCustomerId = async (): Promise<{ id?: string; error?: string }> => {
    if (customerSelection.mode === 'final') return {};
    if (customerSelection.mode === 'existing') return { id: customerSelection.customerId };
    if (customerSelection.mode === 'new') {
      const result = await createCustomerAction(customerSelection.data);
      if (!result.success) return { error: result.error };
      return { id: result.data!.id };
    }
    return { error: 'Seleccioná o cargá un cliente.' };
  };

  const onSubmit = handleSubmit(async (data) => {
    if (editingItem) {
      const changedData: any = { version: editingItem.version };
      let hasChanges = false;
      Object.keys(dirtyFields).forEach((key) => {
        changedData[key as keyof SparePartFormInput] = data[key as keyof SparePartFormInput];
        hasChanges = true;
      });
      if (!hasChanges) {
        closeFormModal();
        return;
      }
      handleEditSubmit(changedData);
      return;
    }

    setCustomerError(null);
    setIsResolvingCustomer(true);
    const { id: customerId, error } = await resolveCustomerId();
    setIsResolvingCustomer(false);
    if (error) {
      setCustomerError(error);
      return;
    }
    handleEditSubmit({ ...data, customerId });
  });

  const columns = getSparePartColumns({ onEdit: handleEditClick, onDelete: setItemToDelete, role });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full outline-none' tabIndex={-1}>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar por nombre o cliente'
        searchPlaceholderMobile='Buscar repuestos...'
        filters={<ToggleFilter id='showSoldSpareParts' checked={showSold} onChange={setShowSold} label='Ver vendidos' />}
        sync={
          <Button variant='secondary' size='icon' onClick={() => syncData(true)} disabled={isPending} title='Sincronizar' className='h-11 w-11 flex-none'>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        }
        actions={
          <Button variant='primary' onClick={() => handleEditClick()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base'>
            <span className='hidden sm:inline'>Nuevo Repuesto</span>
            <span className='sm:hidden'>Nuevo</span>
          </Button>
        }
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredSpareParts}
        isLoading={isPending}
        emptyMessage='No se han encontrado repuestos/usados.'
        renderCard={renderSparePartCard({ onEdit: handleEditClick, onDelete: setItemToDelete, role })}
      />

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingItem ? 'Editar Repuesto/Usado' : 'Nuevo Repuesto/Usado'}
        icon={<Package className='w-5 h-5 text-zinc-500' />}
        width='md'
        onSubmit={onSubmit}
        submitLabel={editingItem ? 'Actualizar' : 'Crear'}
        isPending={isPending}
      >
        <ErrorAlert error={serverError || customerError} />
        <div className='space-y-4'>
          <div>
            <label className='block text-xs font-medium mb-1.5'>Condición</label>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => setValue('condition', 'nuevo', { shouldDirty: true, shouldValidate: true })}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all font-bold text-xs uppercase ${condition === 'nuevo' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'border-transparent bg-zinc-50 dark:bg-zinc-950 text-zinc-400'}`}
              >
                Nuevo
              </button>
              <button
                type='button'
                onClick={() => setValue('condition', 'usado', { shouldDirty: true, shouldValidate: true })}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all font-bold text-xs uppercase ${condition === 'usado' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700' : 'border-transparent bg-zinc-50 dark:bg-zinc-950 text-zinc-400'}`}
              >
                Usado
              </button>
            </div>
            {errors.condition && <p className='text-zinc-500 text-xs mt-1.5'>Seleccioná una condición</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Nombre</label>
            <input
              type='text'
              placeholder='Nombre'
              {...register('title')}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.title ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            />
            {errors.title && <p className='text-zinc-500 text-xs mt-1.5'>{errors.title.message}</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Cliente asociado</label>
            {editingItem ? (
              <div className='px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400'>{editingItem.customer?.name || 'Sin cliente asociado'} <span className='text-[10px] uppercase font-bold text-zinc-400'>(no editable)</span></div>
            ) : (
              <SaleCustomerPicker
                finalLabel='Sin cliente'
                onChange={setCustomerSelection}
              />
            )}
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Costo ($)</label>
              <input
                type='text'
                inputMode='decimal'
                {...register('cost')}
                onKeyDown={blockInvalidPriceKey}
                className={`w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors ${errors.cost ? 'border-zinc-500' : ''}`}
              />
              {errors.cost && <p className='text-zinc-500 text-xs mt-1.5'>{errors.cost.message}</p>}
            </div>
            <div>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Ganancia (%)</label>
              <input
                type='text'
                inputMode='decimal'
                {...register('profitPercentage')}
                onKeyDown={blockInvalidPriceKey}
                className={`w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors ${errors.profitPercentage ? 'border-zinc-500' : ''}`}
              />
              {errors.profitPercentage && <p className='text-zinc-500 text-xs mt-1.5'>{errors.profitPercentage.message}</p>}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Precio final</label>
            <div className='px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg text-sm font-bold text-emerald-700 dark:text-emerald-400'>
              ${salePricePreview.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </ResponsiveModal>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleDelete(itemToDelete as string)}
        title='Eliminar Repuesto/Usado'
        description='Esta acción es permanente y eliminará el registro. Solo se puede eliminar mientras no se haya vendido.'
        submitLabel='Eliminar'
        isPending={isPending}
      />
    </div>
  );
}
