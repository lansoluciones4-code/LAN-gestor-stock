import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, DollarSign, PackageOpen, PackageX, RefreshCcw } from 'lucide-react';
import { productSchema, type ProductInput, type ProductDef } from '@/schemas/product.schema';
import { useAuthStore } from '@/stores/auth.store';
import { useProductsStore } from '@/stores/products.store';
import { useDevicesStore } from '@/stores/devices.store';
import { useProvidersStore } from '@/stores/providers.store';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { DataTable } from '@/components/ui/data-table';
import { registerProductLossAction, fetchProducts, fetchSelectorData, createProductAction, updateProductAction, deleteProductAction } from '@/server/actions/product.actions';
import { useLogsStore } from '@/stores/logs.store';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { Combobox } from '@/components/ui/combobox';
import { SearchBar } from '@/components/ui/search-bar';
import { Button } from '@/components/ui/button';
import { getProductColumns } from '@/config/tables/product-columns';

export function ProductsPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);

  const { products, setProducts, isLoaded: prodsLoaded } = useProductsStore();
  const { devices, setDevices, isLoaded: devicesLoaded } = useDevicesStore();
  const { providers: suppliers, setProviders: setSuppliers, isLoaded: supsLoaded } = useProvidersStore();

  const {
    isModalOpen, editingItem, openFormModal, closeFormModal,
    itemToDelete, setItemToDelete,
    serverError, setServerError,
    globalMessage, showGlobalMessage,
    search, setSearch
  } = useEntityManager<ProductDef>();

  const [lossProduct, setLossProduct] = useState<ProductDef | null>(null);
  const [lossQuantity, setLossQuantity] = useState<string>('1');
  const [lossReason, setLossReason] = useState<string>('');

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showZeroStock, setShowZeroStock] = useState(true);

  const [isPendingLocal, startTransition] = useTransition();
  const [showInactive, setShowInactive] = useState(false);

  const { isPending: isPendingAction, syncData, handleEditSubmit, handleDelete } = useEntityActions<ProductDef, ProductInput>({
    handlers: {
      fetchData: () => fetchProducts(),
      createAction: createProductAction,
      updateAction: updateProductAction,
      deleteAction: deleteProductAction,
    },
    setStoreData: setProducts,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive,
    onAfterSuccess: () => {
      useProvidersStore.getState().setLoaded(false);
      useDevicesStore.getState().setLoaded(false);
    }
  });

  const isPending = isPendingAction || isPendingLocal;

  const handleLoss = async (lossProduct: ProductDef, quantity: string, reason: string, onLossClose: () => void) => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return setServerError('La cantidad debe ser min1');
    if (qty > (lossProduct.stock || 0)) return setServerError('Excede el stock disponible');
    
    setServerError(null);
    startTransition(async () => {
      const result = await registerProductLossAction(lossProduct.id, qty, reason);
      if (!result.success) return setServerError(result.message);
      
      onLossClose();
      showGlobalMessage('success', result.message);
      useLogsStore.getState().setLoaded(false);
      syncData();
    });
  };

  useEffect(() => {
    async function loadInitial() {
      if (prodsLoaded && devicesLoaded && supsLoaded) {
        setInitialLoading(false);
        return;
      }
      setInitialLoading(true);
      const promises = [];
      if (!prodsLoaded) promises.push(fetchProducts().then(setProducts));
      if (!devicesLoaded || !supsLoaded) {
        promises.push(fetchSelectorData().then(res => {
          setDevices(res.devices);
          setSuppliers(res.providers);
        }));
      }
      await Promise.all(promises);
      setInitialLoading(false);
    }
    loadInitial();
  }, [prodsLoaded, devicesLoaded, supsLoaded, setProducts, setDevices, setSuppliers]);

  const displayProducts = products;

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
  });

  const selectedDeviceId = watch('deviceId');
  const selectedProviderId = watch('providerId');

  const filteredProducts = displayProducts.filter((p) => {
    const term = search.toLowerCase();
    const min = parseFloat(minPrice) || 0;
    const max = parseFloat(maxPrice) || Infinity;
    return (
      (p.device?.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term) || p.provider?.name?.toLowerCase().includes(term)) &&
      (p.salePrice >= min && p.salePrice <= max) &&
      (showZeroStock || p.stock > 0)
    );
  });

  const { paginatedData, hasMore, elementRef } = useClientPagination(filteredProducts, 20);

  const handleEditClick = (item?: ProductDef) => {
    openFormModal(item);
    if (item) {
      reset({ deviceId: item.deviceId, providerId: item.providerId, description: item.description || '', purchasePrice: item.purchasePrice, salePrice: item.salePrice, stock: item.stock });
    } else {
      reset({ deviceId: '', providerId: '', description: '', purchasePrice: 0, salePrice: 0, stock: 1 });
    }
  };

  const handleLossOpen = (p: ProductDef) => {
    setLossProduct(p);
    setLossQuantity('1');
    setLossReason('');
    setServerError(null);
  };

  const lossClose = () => setLossProduct(null);

  const columns = getProductColumns({
    role,
    onLoss: handleLossOpen,
    onEdit: handleEditClick,
    onDelete: setItemToDelete,
  });

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      {initialLoading ? (
        <div className="mt-8 animate-in fade-in duration-500"><TableSkeleton /></div>
      ) : (
      <>
      <div className='flex flex-col sm:flex-row gap-4 mb-6 shrink-0'>
        <div className='flex flex-col sm:flex-row gap-2 flex-1'>
          <SearchBar 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder='Buscar productos por equipo, descripción o proveedor'
            className='h-11'
          />
          <div className='flex items-center gap-2'>
            <div className='relative w-[110px] sm:max-w-[130px]'>
              <DollarSign className='absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400' />
              <input type='number' placeholder='Min' value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className='w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm' />
            </div>
            <div className='relative w-[110px] sm:max-w-[130px]'>
              <DollarSign className='absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400' />
              <input type='number' placeholder='Max' value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className='w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm' />
            </div>
          </div>
        </div>
        {role === 'admin' && (
          <div className='flex items-center gap-2 sm:gap-4'>
            <ToggleFilter id='showZeroStock' checked={showZeroStock} onChange={setShowZeroStock} label='Ver sin stock' />
            <Button variant="secondary" size="icon" onClick={syncData} disabled={isPending} title="Sincronizar" className='h-11 w-11'>
              <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="primary" onClick={() => handleEditClick()} leftIcon={<Plus className='w-5 h-5' />} className='h-11'>
              Ingresar Stock
            </Button>
          </div>
        )}
      </div>

      {globalMessage && (
        <div className={`shrink-0 mb-4 p-4 rounded-lg flex items-center shadow-sm text-sm border ${globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'}`}>
          {globalMessage.text}
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={paginatedData} 
        isLoading={isPending} 
        hasMore={hasMore} 
        observerRef={elementRef} 
        emptyMessage="No se han encontrado productos coincidentes."
      />

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingItem ? 'Editar Producto / Stock' : 'Añadir Nuevo Lote'}
        icon={<PackageOpen className='w-6 h-6 text-indigo-500'/>}
        width="2xl"
        onSubmit={handleSubmit(handleEditSubmit)}
        submitLabel="Confirmar Inventario"
        isPending={isPending}
      >
        {serverError && <div className='p-4 bg-red-50 text-red-600 text-sm font-bold uppercase rounded-lg border border-red-200 mb-6'>{serverError}</div>}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='col-span-1 md:col-span-2'>
            <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Modelo / Equipo</label>
            <Combobox options={devices.map(d => ({ id: d.id, name: d.name }))} value={selectedDeviceId} onChange={(val) => setValue('deviceId', val, { shouldValidate: true })} placeholder="Seleccionar Equipo" />
            {errors.deviceId && <p className='text-red-500 text-xs mt-1.5'>{errors.deviceId.message}</p>}
          </div>
          <div className='col-span-1 md:col-span-2'>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Proveedor Entrante</label>
            <Combobox options={suppliers.map(s => ({ id: s.id, name: s.name }))} value={selectedProviderId} onChange={(val) => setValue('providerId', val, { shouldValidate: true })} placeholder="Seleccionar Proveedor" />
            {errors.providerId && <p className='text-red-500 text-xs mt-1.5'>{errors.providerId.message}</p>}
          </div>
          <div className='col-span-1 md:col-span-2'>
            <label className='block text-sm font-medium mb-1.5'>Descripción Física (Color, Memoria)</label>
            <input type='text' {...register('description')} className='w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Precio de Costo ($)</label>
            <div className='relative'><DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' /><input type='number' step='0.01' {...register('purchasePrice', { valueAsNumber: true })} className='w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500' /></div>
            {errors.purchasePrice && <p className='text-red-500 text-xs mt-1'>{errors.purchasePrice.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Precio de Venta ($)</label>
            <div className='relative'><DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-emerald-500' /><input type='number' step='0.01' {...register('salePrice', { valueAsNumber: true })} className='w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500' /></div>
            {errors.salePrice && <p className='text-red-500 text-xs mt-1'>{errors.salePrice.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Stock Inicial Lote</label>
            <input type='number' {...register('stock', { valueAsNumber: true })} className='w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500' />
            {errors.stock && <p className='text-red-500 text-xs mt-1'>{errors.stock.message}</p>}
          </div>
        </div>
      </ResponsiveModal>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleDelete(itemToDelete as string)}
        title="Borrar Inventario"
        description="¿Deseas eliminar físicamente este lote del inventario? Toda la trazabilidad de esta ID se perderá."
        submitLabel="Purgar Stock"
        isPending={isPending}
      />

      <ResponsiveModal
        isOpen={!!lossProduct}
        onClose={lossClose}
        title="Registrar Pérdida"
        icon={<PackageX className='w-5 h-5 text-amber-500'/>}
        width="md"
        onSubmit={(e) => { e.preventDefault(); handleLoss(lossProduct!, lossQuantity, lossReason, lossClose); }}
        submitLabel="Confirmar Pérdida"
        isPending={isPending}
      >
        {serverError && <div className='p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200'>{serverError}</div>}
        <div className='p-3 mb-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg'>
          <p className='text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1'>Producto</p>
          <p className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>{lossProduct?.device?.name} - {lossProduct?.description}</p>
          <p className='text-xs text-zinc-500 mt-1'>Stock actual: {lossProduct?.stock} Uds</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className='block text-sm font-medium mb-1.5'>Cantidad perdida</label>
            <input type='number' value={lossQuantity} onChange={(e) => setLossQuantity(e.target.value)} className='w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-indigo-500' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Motivo / Razón</label>
            <textarea value={lossReason} onChange={(e) => setLossReason(e.target.value)} className='w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-indigo-500 min-h-[100px] text-sm' />
          </div>
        </div>
      </ResponsiveModal>
      </>
      )}
    </div>
  );
}
