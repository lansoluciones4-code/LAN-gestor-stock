'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { type ProductInput, type ProductDef, type ProductUpdateInput } from '@/features/product/domain/product.schema';
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
import { Button } from '@/components/ui/button';
import { getProductColumns } from '@/config/tables/product-columns';
import { normalizeForSearch, PRICE_BLOCKED_KEYS } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';
import { renderProductCard } from '@/config/cards/product-card';
import { ProductFormModal } from '@/features/product/ui/components/product-form-modal';
import { ProductLossModal } from '@/features/product/ui/components/product-loss-modal';
import { ProductPhotosManager } from '@/features/product/ui/components/product-photos-manager';



export function ProductsPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showZeroStock, setShowZeroStock] = useState(false);
  const [showOnlyLanding, setShowOnlyLanding] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [lossProduct, setLossProduct] = useState<ProductDef | null>(null);
  const [photoManageProduct, setPhotoManageProduct] = useState<ProductDef | null>(null);
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
    setInitialLoading(true);
    const promises: Promise<unknown>[] = [];
    if (!prodsLoaded) promises.push(fetchProducts().then(setProducts));
    if (!devicesLoaded || !supsLoaded) promises.push(fetchSelectorData().then((res) => { setDevices(res.devices); setSuppliers(res.providers); }));
    Promise.all(promises).finally(() => setInitialLoading(false));
  }, [prodsLoaded, devicesLoaded, supsLoaded, setProducts, setDevices, setSuppliers]);



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
  };

  const handleLossOpen = (p: ProductDef) => { setLossProduct(p); setServerError(null); };
  
  const handleManagePhotosOpen = (p: ProductDef) => { setPhotoManageProduct(p); };

  const handleToggleVisibility = (p: ProductDef) => {
    startTransition(async () => {
      const result = await toggleProductVisibilityAction(p.id!, !p.showOnLanding);
      if (!result.success) return showGlobalMessage('error', result.error);
      showGlobalMessage('success', result.message || 'Visibilidad actualizada');
      invalidateAllCaches(); syncData();
    });
  };

  const handleLossSubmit = (qty: number, reason: string) => {
    if (!qty || qty <= 0) return setServerError('La cantidad debe ser al menos 1');
    if (qty > (lossProduct?.stock || 0)) return setServerError('Excede el stock disponible');
    setServerError(null);
    startTransition(async () => {
      const result = await registerProductLossAction(lossProduct!.id, qty, reason);
      if (!result.success) return setServerError(result.error);
      setLossProduct(null);
      showGlobalMessage('success', result.message || 'Pérdida registrada');
      invalidateAllCaches(); syncData();
    });
  };

  const columns = getProductColumns({ role, onLoss: handleLossOpen, onEdit: handleEditClick, onDelete: setItemToDelete, onToggleVisibility: handleToggleVisibility, onManagePhotos: handleManagePhotosOpen });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full outline-none' tabIndex={-1}>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={role === 'admin' ? 'Buscar por equipo, descripción o proveedor' : 'Buscar por equipo o descripción'}
        searchPlaceholderMobile='Buscar productos...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={
          <>
            <div className='relative w-24 sm:w-28'>
              <div className='absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400'>$</div>
              <input type='number' placeholder='Min' value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (PRICE_BLOCKED_KEYS.includes(e.key)) e.preventDefault(); }}
                className='w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm'
                data-testid={TEST_IDS.productos.inputBusquedaPrecioMin} />
            </div>
            <div className='relative w-24 sm:w-28'>
              <div className='absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400'>$</div>
              <input type='number' placeholder='Max' value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (PRICE_BLOCKED_KEYS.includes(e.key)) e.preventDefault(); }}
                className='w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm'
                data-testid={TEST_IDS.productos.inputBusquedaPrecioMax} />
            </div>
            {role === 'admin' && (
              <>
                <ToggleFilter id='showZeroStock' checked={showZeroStock} onChange={setShowZeroStock} label='Ver sin stock' data-testid={TEST_IDS.general.btnVerOcultos} />
                <ToggleFilter id='showOnlyLanding' checked={showOnlyLanding} onChange={setShowOnlyLanding} label='Solo Landing' />
              </>
            )}
          </>
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
        renderCard={renderProductCard({ role, onLoss: handleLossOpen, onEdit: handleEditClick, onDelete: setItemToDelete, onToggleVisibility: handleToggleVisibility, onManagePhotos: handleManagePhotosOpen })}
      />

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        onSubmit={handleEditSubmit}
        editingItem={editingItem}
        serverError={serverError}
        isPending={isPending}
        devices={devices}
        suppliers={suppliers}
        role={role}
      />

      <ConfirmModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={() => handleDelete(itemToDelete as string)}
        title='Borrar Inventario' description='¿Deseas eliminar físicamente este lote del inventario? Toda la trazabilidad de esta ID se perderá.'
        submitLabel='Purgar Stock' isPending={isPending} />

      <ProductLossModal
        isOpen={!!lossProduct}
        onClose={() => setLossProduct(null)}
        onSubmit={handleLossSubmit}
        product={lossProduct}
        serverError={serverError}
        isPending={isPending}
      />

      <ProductPhotosManager
        isOpen={!!photoManageProduct}
        onClose={() => setPhotoManageProduct(null)}
        product={photoManageProduct}
      />
    </div>
  );
}
