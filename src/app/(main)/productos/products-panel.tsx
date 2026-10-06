'use client';

import { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import { Plus, RefreshCcw, Eye, ChevronDown } from 'lucide-react';
import { type ProductInput, type ProductDef, type ProductUpdateInput } from '@/features/product/domain/product.schema';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useProductStore } from '@/features/product/store/product.store';
import { useDeviceStore } from '@/features/device/store/device.store';
import { useProviderStore } from '@/features/provider/store/provider.store';
import { invalidateAllCaches } from '@/stores';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { fetchProducts, fetchSelectorData, createProductAction, updateProductAction, deleteProductAction, toggleProductVisibilityAction, toggleProductFeaturedAction, bulkSetProductVisibilityBySectionAction } from '@/features/product/actions/product.actions';
import { uploadProductPhoto } from '@/features/product/actions/upload-product-photo';
import { fetchShowPrices, updateShowPricesAction } from '@/features/settings/actions/settings.actions';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { type RestockSection } from '@/features/product/domain/restock-text';
import { OutOfStockPanel } from '@/features/product/ui/components/out-of-stock-panel';
import { Button } from '@/components/ui/button';
import { getProductColumns } from '@/config/tables/product-columns';
import { normalizeForSearch, PRICE_BLOCKED_KEYS } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';
import { renderProductCard } from '@/config/cards/product-card';
import { ProductFormModal } from '@/features/product/ui/components/product-form-modal';
import { ProductPhotosManager } from '@/features/product/ui/components/product-photos-manager';



export function ProductsPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [showZeroStock, setShowZeroStock] = useState(false);
  // "Solo sin stock": listado de productos en 0, filtrable por el día en que quedaron sin stock (`outOfStockAt`).
  const [onlyOutOfStock, setOnlyOutOfStock] = useState(false);
  const [outStartDate, setOutStartDate] = useState('');
  const [outEndDate, setOutEndDate] = useState('');
  const [outOfStockSections, setOutOfStockSections] = useState<Record<RestockSection, boolean>>({ tech: false, libreria: false });
  const [showOnlyLanding, setShowOnlyLanding] = useState(false);
  const [showPricesOnCatalog, setShowPricesOnCatalog] = useState(true);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [photoManageProduct, setPhotoManageProduct] = useState<ProductDef | null>(null);
  const [isPendingLocal, startTransition] = useTransition();
  const pendingPhotosRef = useRef<File[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);

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
    onCreateSuccess: (created) => {
      const photos = pendingPhotosRef.current;
      pendingPhotosRef.current = [];
      if (photos.length === 0 || !created.id) return;

      startTransition(async () => {
        setIsUploadingPhotos(true);
        let failed = 0;
        for (const file of photos) {
          const res = await uploadProductPhoto(created.id!, file);
          if (!res.success) failed += 1;
        }
        setIsUploadingPhotos(false);
        if (failed > 0) {
          showGlobalMessage('error', `Se creó el producto, pero ${failed} de ${photos.length} foto(s) no se pudieron subir. Podés reintentar desde "Gestionar Fotos".`);
        }
        invalidateAllCaches();
        syncData();
      });
    },
  });

  const isPending = isPendingAction || isPendingLocal || isUploadingPhotos;

  const { initialLoading } = useAutoSync({
    isLoaded: prodsLoaded && devicesLoaded && supsLoaded,
    sync: async () => {
      const [prods, selector] = await Promise.all([fetchProducts(), fetchSelectorData()]);
      setProducts(prods);
      setDevices(selector.devices);
      setSuppliers(selector.providers);
    },
  });

  useEffect(() => {
    if (role === 'admin') fetchShowPrices().then(setShowPricesOnCatalog);
  }, [role]);

  useEffect(() => {
    if (!showVisibilityMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(e.target as Node)) {
        setShowVisibilityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showVisibilityMenu]);

  const handleToggleShowPrices = (checked: boolean) => {
    setShowPricesOnCatalog(checked);
    startTransition(async () => {
      const result = await updateShowPricesAction(checked);
      if (!result.success) {
        setShowPricesOnCatalog(!checked);
        showGlobalMessage('error', result.error);
      } else {
        showGlobalMessage('success', result.message || 'Configuración actualizada.');
      }
    });
  };



  const allTechVisible = useMemo(() => {
    const techProducts = products.filter((p) => p.device?.section === 'tech');
    return techProducts.length > 0 && techProducts.every((p) => p.showOnLanding);
  }, [products]);

  const allLibreriaVisible = useMemo(() => {
    const libreriaProducts = products.filter((p) => p.device?.section === 'libreria');
    return libreriaProducts.length > 0 && libreriaProducts.every((p) => p.showOnLanding);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const outOfStockTime = (p: ProductDef) => (p.outOfStockAt ? new Date(p.outOfStockAt).getTime() : null);
    const matchesStock = (p: ProductDef) => {
      if (!onlyOutOfStock) return showZeroStock || p.stock > 0;
      if (p.stock > 0) return false;
      // Rubros TECH/LIBRERÍA: sin ninguno marcado se ven todos los sin stock.
      if ((outOfStockSections.tech || outOfStockSections.libreria) && !outOfStockSections[p.device?.section as RestockSection]) return false;
      if (!outStartDate && !outEndDate) return true;
      // Con rango de fechas cargado, un producto sin fecha conocida no puede caer adentro.
      const time = outOfStockTime(p);
      if (time === null) return false;
      if (outStartDate && time < new Date(outStartDate + 'T00:00:00').getTime()) return false;
      if (outEndDate && time > new Date(outEndDate + 'T23:59:59').getTime()) return false;
      return true;
    };

    return products
      .filter((p) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        const text = [normalizeForSearch(p.device?.name), normalizeForSearch(p.device?.category), normalizeForSearch(p.device?.brand), normalizeForSearch(p.description), role === 'admin' ? normalizeForSearch(p.provider?.name) : ''].join(' ');
        const min = parseFloat(minPrice) || 0;
        const max = parseFloat(maxPrice) || Infinity;
        return terms.every((w) => text.includes(w)) && p.salePrice >= min && p.salePrice <= max && matchesStock(p) && (!showOnlyLanding || p.showOnLanding);
      })
      .sort((a, b) => {
        // "Solo sin stock": el que quedó en 0 más recientemente primero; los sin fecha conocida al final.
        if (onlyOutOfStock) {
          const ta = outOfStockTime(a);
          const tb = outOfStockTime(b);
          if (ta === null || tb === null) return ta === tb ? 0 : ta === null ? 1 : -1;
          return tb - ta;
        }
        return a.stock > 0 && b.stock === 0 ? -1 : a.stock === 0 && b.stock > 0 ? 1 : 0;
      });
  }, [products, search, minPrice, maxPrice, showZeroStock, onlyOutOfStock, outOfStockSections, outStartDate, outEndDate, showOnlyLanding, role]);

  const handleEditClick = (item?: ProductDef) => {
    openFormModal(item);
  };

  const handleManagePhotosOpen = (p: ProductDef) => { setPhotoManageProduct(p); };

  const handleToggleVisibility = (p: ProductDef) => {
    startTransition(async () => {
      const result = await toggleProductVisibilityAction(p.id!, !p.showOnLanding);
      if (!result.success) return showGlobalMessage('error', result.error);
      showGlobalMessage('success', result.message || 'Visibilidad actualizada');
      invalidateAllCaches(); syncData();
    });
  };

  const handleToggleFeatured = (p: ProductDef) => {
    startTransition(async () => {
      const result = await toggleProductFeaturedAction(p.id!, !p.featuredAt);
      if (!result.success) return showGlobalMessage('error', result.error);
      showGlobalMessage('success', result.message || 'Destacado actualizado');
      invalidateAllCaches(); syncData();
    });
  };

  const handleBulkToggleSection = (section: 'tech' | 'libreria', isVisible: boolean) => {
    startTransition(async () => {
      const result = await bulkSetProductVisibilityBySectionAction(section, isVisible);
      if (!result.success) return showGlobalMessage('error', result.error);
      showGlobalMessage('success', result.message || 'Visibilidad actualizada');
      invalidateAllCaches(); syncData();
    });
  };

  const outOfStockPanel = onlyOutOfStock ? (
    <OutOfStockPanel
      visibleProducts={filteredProducts}
      allProducts={products}
      sections={outOfStockSections}
      onSectionsChange={setOutOfStockSections}
      startDate={outStartDate}
      endDate={outEndDate}
      onStartDateChange={setOutStartDate}
      onEndDateChange={setOutEndDate}
      onCopyError={(msg) => showGlobalMessage('error', msg)}
    />
  ) : null;

  const columns = getProductColumns({ role, onEdit: handleEditClick, onDelete: setItemToDelete, onToggleVisibility: handleToggleVisibility, onToggleFeatured: handleToggleFeatured, onManagePhotos: handleManagePhotosOpen });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full outline-none' tabIndex={-1}>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={role === 'admin' ? 'Buscar por equipo, categoría, marca, descripción o proveedor' : 'Buscar por equipo, categoría, marca o descripción'}
        searchPlaceholderMobile='Buscar productos...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={
          <>
            <div className='relative w-24 sm:w-28'>
              <div className='absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400'>$</div>
              <input type='number' placeholder='Min' value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (PRICE_BLOCKED_KEYS.includes(e.key)) e.preventDefault(); }}
                className='w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-zinc-500 transition-colors shadow-sm'
                data-testid={TEST_IDS.productos.inputBusquedaPrecioMin} />
            </div>
            <div className='relative w-24 sm:w-28'>
              <div className='absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400'>$</div>
              <input type='number' placeholder='Max' value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (PRICE_BLOCKED_KEYS.includes(e.key)) e.preventDefault(); }}
                className='w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-zinc-500 transition-colors shadow-sm'
                data-testid={TEST_IDS.productos.inputBusquedaPrecioMax} />
            </div>
            {/* Filtros de stock: disponibles para admin y vendedor. */}
            <ToggleFilter id='showZeroStock' checked={showZeroStock} onChange={setShowZeroStock} label='Ver sin stock' data-testid={TEST_IDS.general.btnVerOcultos} />
            <ToggleFilter id='onlyOutOfStock' checked={onlyOutOfStock} onChange={setOnlyOutOfStock} label='Solo sin stock' data-testid={TEST_IDS.productos.toggleSoloSinStock} />
            {role === 'admin' && (
              <>
                <ToggleFilter id='showOnlyLanding' checked={showOnlyLanding} onChange={setShowOnlyLanding} label='Solo Landing' />
                <ToggleFilter id='showPricesOnCatalog' checked={showPricesOnCatalog} onChange={handleToggleShowPrices} label='Mostrar Precios' />
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
          role === 'admin' ? (
            <Button variant='primary' onClick={() => handleEditClick()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
              <span className='hidden sm:inline'>Ingresar Stock</span>
              <span className='sm:hidden'>Agregar</span>
            </Button>
          ) : null
        }
      />

      <GlobalMessage message={globalMessage} />

      {role === 'admin' && (
        <div className='flex justify-end mb-2 relative' ref={visibilityMenuRef}>
          <button
            onClick={() => setShowVisibilityMenu((v) => !v)}
            className='flex items-center gap-2 px-3 h-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm'
          >
            <Eye className='w-4 h-4' />
            Visibilidad masiva
            <ChevronDown className={`w-4 h-4 transition-transform ${showVisibilityMenu ? 'rotate-180' : ''}`} />
          </button>

          {showVisibilityMenu && (
            <div className='absolute right-0 top-full mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150'>
              <ToggleFilter id='showAllTech' checked={allTechVisible} onChange={(checked) => handleBulkToggleSection('tech', checked)} label='Mostrar tech en el catálogo' />
              <ToggleFilter id='showAllLibreria' checked={allLibreriaVisible} onChange={(checked) => handleBulkToggleSection('libreria', checked)} label='Mostrar librería en el catálogo' />
            </div>
          )}
        </div>
      )}

      {/* Desktop: fijo arriba de la tabla. Mobile/tablet: va como encabezado de la lista de cards, para que scrollee
          con ellas — fijo arriba no entra en la pantalla de un celular y la lista y el botón Copiar quedan cortados. */}
      {outOfStockPanel && <div className='hidden xl:block shrink-0'>{outOfStockPanel}</div>}

      <ResponsivePanelView
        mobileHeader={outOfStockPanel}
        columns={columns}
        data={filteredProducts}
        isLoading={isPending}
        emptyMessage='No se han encontrado productos coincidentes.'
        renderCard={renderProductCard({ role, onEdit: handleEditClick, onDelete: setItemToDelete, onToggleVisibility: handleToggleVisibility, onToggleFeatured: handleToggleFeatured, onManagePhotos: handleManagePhotosOpen })}
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
        onPhotosReady={(photos) => { pendingPhotosRef.current = photos; }}
      />

      <ConfirmModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={() => handleDelete(itemToDelete as string)}
        title='Borrar Inventario' description='¿Deseas eliminar físicamente este lote del inventario? Toda la trazabilidad de esta ID se perderá.'
        submitLabel='Purgar Stock' isPending={isPending} />

      <ProductPhotosManager
        isOpen={!!photoManageProduct}
        onClose={() => setPhotoManageProduct(null)}
        product={photoManageProduct}
      />
    </div>
  );
}
