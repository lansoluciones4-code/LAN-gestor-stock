'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, DollarSign, PackageOpen, PackageX, RefreshCcw } from 'lucide-react';
import { productCreateSchema, type ProductInput, type ProductDef, type ProductUpdateInput } from '@/features/product/domain/product.schema';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useProductStore } from '@/features/product/store/product.store';
import { useDeviceStore } from '@/features/device/store/device.store';
import { useProviderStore } from '@/features/provider/store/provider.store';
import { invalidateAllCaches } from '@/stores';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { registerProductLossAction, fetchProducts, fetchSelectorData, createProductAction, updateProductAction, deleteProductAction, toggleProductVisibilityAction } from '@/features/product/actions/product.actions';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { getProductColumns } from '@/config/tables/product-columns';
import { normalizeForSearch } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';
import { renderProductCard } from '@/config/cards/product-card';

const PRICE_KEYS = ['-', '.', ',', 'e', 'E', '+'];

function blockInvalidPriceKey(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === ',' && e.currentTarget.value.includes(',')) { e.preventDefault(); return; }
  if (!/^[0-9]$/.test(e.key) && e.key !== ',' && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
}

export function ProductsPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showZeroStock, setShowZeroStock] = useState(false);
  const [showOnlyLanding, setShowOnlyLanding] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [lossProduct, setLossProduct] = useState<ProductDef | null>(null);
  const [lossQuantity, setLossQuantity] = useState('1');
  const [lossReason, setLossReason] = useState('');
  const [isPendingLocal, startTransition] = useTransition();

  const { products, setProducts, isLoaded: prodsLoaded } = useProductStore();
  const { devices, setDevices, isLoaded: devicesLoaded } = useDeviceStore();
  const { providers: suppliers, setProviders: setSuppliers, isLoaded: supsLoaded } = useProviderStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<ProductDef>();

  const { isPending: isPendingAction, syncData, handleEditSubmit, handleDelete } = useEntityActions<ProductDef, ProductInput, ProductUpdateInput>({
    handlers: { fetchData: fetchProducts, createAction: createProductAction, updateAction: updateProductAction, deleteAction: deleteProductAction },
    setStoreData: setProducts,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive: false,
  });

  const isPending = isPendingAction || isPendingLocal;

  useEffect(() => {
    if (prodsLoaded && devicesLoaded && supsLoaded) { setInitialLoading(false); return; }
    const promises: Promise<unknown>[] = [];
    if (!prodsLoaded) promises.push(fetchProducts().then(setProducts));
    if (!devicesLoaded || !supsLoaded) promises.push(fetchSelectorData().then((res) => { setDevices(res.devices); setSuppliers(res.providers); }));
    Promise.all(promises).finally(() => setInitialLoading(false));
  }, [prodsLoaded, devicesLoaded, supsLoaded, setProducts, setDevices, setSuppliers]);

  const { register, handleSubmit, reset, formState: { errors, dirtyFields }, setValue, watch } = useForm<ProductInput>({
    resolver: zodResolver(productCreateSchema),
  });

  const selectedDeviceId = watch('deviceId');
  const selectedProviderId = watch('providerId');

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        const text = [normalizeForSearch(p.device?.name), normalizeForSearch(p.description), role === 'admin' ? normalizeForSearch(p.provider?.name) : ''].join(' ');
        const min = parseFloat(minPrice) || 0;
        const max = parseFloat(maxPrice) || Infinity;
        return terms.every((w) => text.includes(w)) && p.salePrice >= min && p.salePrice <= max && (showZeroStock || p.stock > 0) && (!showOnlyLanding || p.showOnLanding);
      })
      .sort((a, b) => (a.stock > 0 && b.stock === 0 ? -1 : a.stock === 0 && b.stock > 0 ? 1 : 0));
  }, [products, search, minPrice, maxPrice, showZeroStock, showOnlyLanding, role]);

  const handleEditClick = (item?: ProductDef) => {
    openFormModal(item);
     
    reset(item ? { deviceId: item.deviceId, providerId: item.providerId, description: item.description || '', purchasePrice: item.purchasePrice.toFixed(2).replace('.', ','), salePrice: item.salePrice.toFixed(2).replace('.', ','), stock: item.stock } as any
       
      : { deviceId: '', providerId: '', description: '', purchasePrice: '0,00', salePrice: '0,00', stock: 1 } as any);
  };

  const handleLossOpen = (p: ProductDef) => { setLossProduct(p); setLossQuantity('1'); setLossReason(''); setServerError(null); };

  const handleToggleVisibility = (p: ProductDef) => {
    startTransition(async () => {
      const result = await toggleProductVisibilityAction(p.id!, !p.showOnLanding);
      if (!result.success) return showGlobalMessage('error', result.error);
      showGlobalMessage('success', result.message || 'Visibilidad actualizada');
      invalidateAllCaches(); syncData();
    });
  };

  const handleLossSubmit = () => {
    const qty = parseInt(lossQuantity);
    if (!qty || qty <= 0) return setServerError('La cantidad debe ser al menos 1');
    if (qty > (lossProduct?.stock || 0)) return setServerError('Excede el stock disponible');
    setServerError(null);
    startTransition(async () => {
      const result = await registerProductLossAction(lossProduct!.id, qty, lossReason);
      if (!result.success) return setServerError(result.error);
      setLossProduct(null);
      showGlobalMessage('success', result.message || 'Pérdida registrada');
      invalidateAllCaches(); syncData();
    });
  };

  const handleProductFormSubmit = (data: ProductInput) => {
    if (editingItem) {
       
      const changedData: any = { version: editingItem.version, deviceVersion: editingItem.device?.version, providerVersion: editingItem.provider?.version };
      let hasChanges = false;
      Object.keys(dirtyFields).forEach((key) => {
        const k = key as keyof ProductInput;
        if (k === 'stock') { changedData.stockDelta = (data.stock ?? 0) - (editingItem.stock ?? 0); if (changedData.stockDelta !== 0) hasChanges = true; }
        else { changedData[k] = data[k]; hasChanges = true; }
      });
      if (!hasChanges) { closeFormModal(); return; }
      handleEditSubmit(changedData);
    } else {
      handleEditSubmit(data);
    }
  };

  const columns = getProductColumns({ role, onLoss: handleLossOpen, onEdit: handleEditClick, onDelete: setItemToDelete, onToggleVisibility: handleToggleVisibility });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden outline-none' tabIndex={-1}>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={role === 'admin' ? 'Buscar por equipo, descripción o proveedor' : 'Buscar por equipo o descripción'}
        searchPlaceholderMobile='Buscar productos...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={
          <div className='flex items-center gap-2 flex-wrap'>
            <div className='relative w-24 sm:w-28'>
              <DollarSign className='absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400' />
              <input type='number' placeholder='Min' value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (PRICE_KEYS.includes(e.key)) e.preventDefault(); }}
                className='w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm'
                data-testid={TEST_IDS.productos.inputBusquedaPrecioMin} />
            </div>
            <div className='relative w-24 sm:w-28'>
              <DollarSign className='absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400' />
              <input type='number' placeholder='Max' value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (PRICE_KEYS.includes(e.key)) e.preventDefault(); }}
                className='w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm'
                data-testid={TEST_IDS.productos.inputBusquedaPrecioMax} />
            </div>
            {role === 'admin' && (
              <>
                <ToggleFilter id='showZeroStock' checked={showZeroStock} onChange={setShowZeroStock} label='Ver sin stock' data-testid={TEST_IDS.general.btnVerOcultos} />
                <ToggleFilter id='showOnlyLanding' checked={showOnlyLanding} onChange={setShowOnlyLanding} label='Solo Landing' />
              </>
            )}
          </div>
        }
        sync={
          <Button variant='secondary' size='icon' onClick={() => syncData(true)} disabled={isPending} title='Sincronizar' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        }
        actions={
          <Button variant='primary' onClick={() => handleEditClick()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
            <span className='hidden sm:inline'>Ingresar Stock</span>
            <span className='sm:hidden'>Agregar</span>
          </Button>
        }
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredProducts}
        isLoading={isPending}
        emptyMessage='No se han encontrado productos coincidentes.'
        renderCard={renderProductCard({ role, onLoss: handleLossOpen, onEdit: handleEditClick, onDelete: setItemToDelete, onToggleVisibility: handleToggleVisibility })}
      />

      {/* Product form modal */}
      <ResponsiveModal isOpen={isModalOpen} onClose={closeFormModal} title={editingItem ? 'Editar Producto / Stock' : 'Añadir Nuevo Lote'}
        icon={<PackageOpen className='w-6 h-6 text-indigo-500' />} width='2xl'
        onSubmit={handleSubmit(handleProductFormSubmit)} submitLabel='Confirmar Inventario' isPending={isPending}>
        <ErrorAlert error={serverError} />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='col-span-1 md:col-span-2'>
            <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Modelo / Equipo</label>
            <Combobox options={devices.filter((d) => d.isActive || d.id === editingItem?.deviceId).map((d) => ({ id: d.id, name: d.name }))}
              value={selectedDeviceId} onChange={(val) => setValue('deviceId', val, { shouldValidate: true })} placeholder='Seleccionar Equipo' />
            {errors.deviceId && <p className='text-red-500 text-xs mt-1.5'>{errors.deviceId.message}</p>}
          </div>
          {role === 'admin' && (
            <div className='col-span-1 md:col-span-2'>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Proveedor Entrante</label>
              <Combobox options={suppliers.filter((s) => s.isActive || s.id === editingItem?.providerId).map((s) => ({ id: s.id, name: s.name }))}
                value={selectedProviderId} onChange={(val) => setValue('providerId', val, { shouldValidate: true })} placeholder='Seleccionar Proveedor' />
              {errors.providerId && <p className='text-red-500 text-xs mt-1.5'>{errors.providerId.message}</p>}
            </div>
          )}
          <div className='col-span-1 md:col-span-2'>
            <label className='block text-sm font-medium mb-1.5'>Descripción Física (Color, Memoria)</label>
            <input type='text' {...register('description')} placeholder='Ej: Negro, 256GB - Kit Funda'
              className='w-full px-4 py-2 text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Precio de Costo ($)</label>
            <div className='relative'>
              <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
              <input type='text' inputMode='decimal' {...register('purchasePrice', { onChange: (e) => { setValue('purchasePrice', e.target.value.replace(/\./g, '')); } })}
                onKeyDown={blockInvalidPriceKey} placeholder='0,00'
                className={`w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 ${errors.purchasePrice ? 'border-red-500' : ''}`} />
            </div>
            {errors.purchasePrice && <p className='text-red-500 text-xs mt-1'>{errors.purchasePrice.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Precio de Venta ($)</label>
            <div className='relative'>
              <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-emerald-500' />
              <input type='text' inputMode='decimal' {...register('salePrice', { onChange: (e) => { setValue('salePrice', e.target.value.replace(/\./g, '')); } })}
                onKeyDown={blockInvalidPriceKey} placeholder='0,00'
                className={`w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 ${errors.salePrice ? 'border-red-500' : ''}`} />
            </div>
            {errors.salePrice && <p className='text-red-500 text-xs mt-1'>{errors.salePrice.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Stock Inicial Lote</label>
            <input type='number' {...register('stock', { valueAsNumber: true })} onKeyDown={(e) => { if (PRICE_KEYS.includes(e.key)) e.preventDefault(); }}
              min='0' step='1' placeholder='1' className='w-full px-4 py-2 text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500' />
            {errors.stock && <p className='text-red-500 text-xs mt-1'>{errors.stock.message}</p>}
          </div>
        </div>
      </ResponsiveModal>

      <ConfirmModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={() => handleDelete(itemToDelete as string)}
        title='Borrar Inventario' description='¿Deseas eliminar físicamente este lote del inventario? Toda la trazabilidad de esta ID se perderá.'
        submitLabel='Purgar Stock' isPending={isPending} />

      {/* Loss modal */}
      <ResponsiveModal isOpen={!!lossProduct} onClose={() => setLossProduct(null)} title='Registrar Pérdida'
        icon={<PackageX className='w-5 h-5 text-amber-500' />} width='md'
        onSubmit={(e) => { e.preventDefault(); handleLossSubmit(); }} submitLabel='Confirmar Pérdida' isPending={isPending}>
        <ErrorAlert error={serverError} />
        <div className='p-3 mb-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg'>
          <p className='text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1'>Producto</p>
          <p className='text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate' title={`${lossProduct?.device?.name} - ${lossProduct?.description}`}>
            {lossProduct?.device?.name} - {lossProduct?.description}
          </p>
          <p className='text-xs text-zinc-500 mt-1'>Stock actual: {lossProduct?.stock} Uds</p>
        </div>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Cantidad perdida</label>
            <input type='number' value={lossQuantity} onChange={(e) => setLossQuantity(e.target.value)}
              onKeyDown={(e) => { if (PRICE_KEYS.includes(e.key)) e.preventDefault(); }} min='1' step='1' placeholder='Ej: 1'
              className='w-full px-4 py-2 text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-indigo-500' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Motivo / Razón</label>
            <textarea value={lossReason} onChange={(e) => setLossReason(e.target.value)} placeholder='Ej: Pantalla rota al desembalar'
              className='w-full px-4 py-2 sm:text-base placeholder:text-xs sm:placeholder:text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-indigo-500 min-h-[100px] text-sm' />
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
