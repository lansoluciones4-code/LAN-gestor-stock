'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, DollarSign, PackageOpen, PackageX, RefreshCcw } from 'lucide-react';
import { productSchema, type ProductInput, type ProductDef, type ProductUpdateInput } from '@/features/product/domain/product.schema';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useProductStore } from '@/features/product/store/product.store';
import { useDeviceStore } from '@/features/device/store/device.store';
import { useProviderStore } from '@/features/provider/store/provider.store';
import { invalidateAllCaches } from '@/stores';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { VirtualizedDataTable } from '@/components/ui/virtualized-data-table';
import { registerProductLossAction, fetchProducts, fetchSelectorData, createProductAction, updateProductAction, deleteProductAction, toggleProductVisibilityAction } from '@/features/product/actions/product.actions';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { Combobox } from '@/components/ui/combobox';
import { SearchBar } from '@/components/ui/search-bar';
import { Button } from '@/components/ui/button';
import { getProductColumns } from '@/config/tables/product-columns';
import { normalizeForSearch } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';

export function ProductsPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);

  const { products, setProducts, isLoaded: prodsLoaded } = useProductStore();
  const { devices, setDevices, isLoaded: devicesLoaded } = useDeviceStore();
  const { providers: suppliers, setProviders: setSuppliers, isLoaded: supsLoaded } = useProviderStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } = useEntityManager<ProductDef>();

  const [lossProduct, setLossProduct] = useState<ProductDef | null>(null);
  const [lossQuantity, setLossQuantity] = useState<string>('1');
  const [lossReason, setLossReason] = useState<string>('');

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showZeroStock, setShowZeroStock] = useState(true);

  const [isPendingLocal, startTransition] = useTransition();

  const {
    isPending: isPendingAction,
    syncData,
    handleEditSubmit,
    handleDelete,
  } = useEntityActions<ProductDef, ProductInput, ProductUpdateInput>({
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
    showInactive: false,
  });

  const isPending = isPendingAction || isPendingLocal;

  const handleLoss = async (lossProduct: ProductDef, quantity: string, reason: string, onLossClose: () => void) => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return setServerError('La cantidad debe ser al menos 1');
    if (qty > (lossProduct.stock || 0)) return setServerError('Excede el stock disponible');

    setServerError(null);
    startTransition(async () => {
      const result = await registerProductLossAction(lossProduct.id, qty, reason);
      if (!result.success) return setServerError(result.error);

      onLossClose();
      showGlobalMessage('success', result.message || 'Pérdida registrada');
      invalidateAllCaches();
      syncData();
    });
  };

  const handleToggleVisibility = async (p: ProductDef) => {
    startTransition(async () => {
      const result = await toggleProductVisibilityAction(p.id!, !p.showOnLanding);
      if (!result.success) return showGlobalMessage('error', result.error);

      showGlobalMessage('success', result.message || 'Visibilidad actualizada');
      invalidateAllCaches();
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
        promises.push(
          fetchSelectorData().then((res) => {
            setDevices(res.devices);
            setSuppliers(res.providers);
          })
        );
      }
      await Promise.all(promises);
      setInitialLoading(false);
    }
    loadInitial();
  }, [prodsLoaded, devicesLoaded, supsLoaded, setProducts, setDevices, setSuppliers]);

  const displayProducts = products;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
    setValue,
    watch,
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
  });

  const selectedDeviceId = watch('deviceId');
  const selectedProviderId = watch('providerId');

  const filteredProducts = useMemo(() => {
    return displayProducts
      .filter((p) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        const min = parseFloat(minPrice) || 0;
        const max = parseFloat(maxPrice) || Infinity;

        const combinedText = [normalizeForSearch(p.device?.name), normalizeForSearch(p.description), role === 'admin' ? normalizeForSearch(p.provider?.name) : ''].join(' ');

        const matchesSearch = terms.every((word) => combinedText.includes(word));
        return matchesSearch && p.salePrice >= min && p.salePrice <= max && (showZeroStock || p.stock > 0);
      })
      .sort((a, b) => {
        // Priority: has stock vs no stock
        if (a.stock > 0 && b.stock === 0) return -1;
        if (a.stock === 0 && b.stock > 0) return 1;
        return 0;
      });
  }, [displayProducts, search, minPrice, maxPrice, showZeroStock]);

  const handleEditClick = (item?: ProductDef) => {
    openFormModal(item);
    if (item) {
      reset({
        deviceId: item.deviceId,
        providerId: item.providerId,
        description: item.description || '',
        purchasePrice: item.purchasePrice.toFixed(2).replace('.', ','),
        salePrice: item.salePrice.toFixed(2).replace('.', ','),
        stock: item.stock,
      } as any);
    } else {
      reset({ deviceId: '', providerId: '', description: '', purchasePrice: '0,00', salePrice: '0,00', stock: 1 } as any);
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
    onToggleVisibility: handleToggleVisibility,
  });

  return (
    <div
      className="flex flex-col flex-1 h-full overflow-hidden outline-none"
      tabIndex={-1}
    >
      {initialLoading ? (
        <div className="mt-8 animate-in fade-in duration-500">
          <TableSkeleton />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <SearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={role === 'admin' ? 'Buscar por equipo, descripción o proveedor' : 'Buscar por equipo o descripción'}
                className="h-11"
                data-testid={TEST_IDS.general.inputBusquedaTabla}
              />
              <div className="flex items-center gap-2">
                <div className="relative w-[110px] sm:max-w-[130px]">
                  <DollarSign className="absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                      if (['-', '.', ',', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                    }}
                    className="w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                    data-testid={TEST_IDS.productos.inputBusquedaPrecioMin}
                  />
                </div>
                <div className="relative w-[110px] sm:max-w-[130px]">
                  <DollarSign className="absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                      if (['-', '.', ',', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                    }}
                    className="w-full pl-8 pr-2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                    data-testid={TEST_IDS.productos.inputBusquedaPrecioMax}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {role === 'admin' && (
                <ToggleFilter
                  id="showZeroStock"
                  checked={showZeroStock}
                  onChange={setShowZeroStock}
                  label="Ver sin stock"
                  data-testid={TEST_IDS.general.btnVerOcultos}
                />
              )}
              <Button
                variant="secondary"
                size="icon"
                onClick={() => syncData(true)}
                disabled={isPending}
                title="Sincronizar"
                className="h-11 w-11"
                data-testid={TEST_IDS.general.btnSincronizar}
              >
                <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="primary"
                onClick={() => handleEditClick()}
                leftIcon={<Plus className="w-5 h-5" />}
                className="h-11"
                data-testid={TEST_IDS.general.btnAgregar}
              >
                Ingresar Stock
              </Button>
            </div>
          </div>

          <GlobalMessage message={globalMessage} />

          <VirtualizedDataTable
            columns={columns}
            data={filteredProducts}
            isLoading={isPending}
            emptyMessage="No se han encontrado productos coincidentes."
          />

          <ResponsiveModal
            isOpen={isModalOpen}
            onClose={closeFormModal}
            title={editingItem ? 'Editar Producto / Stock' : 'Añadir Nuevo Lote'}
            icon={<PackageOpen className="w-6 h-6 text-indigo-500" />}
            width="2xl"
            onSubmit={handleSubmit((data) => {
              if (editingItem) {
                const changedData: any = {
                  version: editingItem.version,
                  deviceVersion: editingItem.device?.version,
                  providerVersion: editingItem.provider?.version,
                };

                let hasChanges = false;
                Object.keys(dirtyFields).forEach((key) => {
                  const k = key as keyof ProductInput;
                  if (k === 'stock') {
                    changedData.stockDelta = (data.stock ?? 0) - (editingItem.stock ?? 0);
                    if (changedData.stockDelta !== 0) hasChanges = true;
                  } else {
                    changedData[k] = data[k];
                    hasChanges = true;
                  }
                });

                if (!hasChanges) {
                  closeFormModal();
                  return;
                }
                handleEditSubmit(changedData);
              } else {
                handleEditSubmit(data);
              }
            })}
            submitLabel="Confirmar Inventario"
            isPending={isPending}
          >
            <ErrorAlert error={serverError} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2">Modelo / Equipo</label>
                <Combobox
                  options={devices.filter((d) => d.isActive || d.id === editingItem?.deviceId).map((d) => ({ id: d.id, name: d.name }))}
                  value={selectedDeviceId}
                  onChange={(val) => setValue('deviceId', val, { shouldValidate: true })}
                  placeholder="Seleccionar Equipo"
                />
                {errors.deviceId && <p className="text-red-500 text-xs mt-1.5">{errors.deviceId.message}</p>}
              </div>
              {role === 'admin' && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Proveedor Entrante</label>
                  <Combobox
                    options={suppliers.filter((s) => s.isActive || s.id === editingItem?.providerId).map((s) => ({ id: s.id, name: s.name }))}
                    value={selectedProviderId}
                    onChange={(val) => setValue('providerId', val, { shouldValidate: true })}
                    placeholder="Seleccionar Proveedor"
                  />
                  {errors.providerId && <p className="text-red-500 text-xs mt-1.5">{errors.providerId.message}</p>}
                </div>
              )}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Descripción Física (Color, Memoria)</label>
                <input
                  type="text"
                  {...register('description')}
                  placeholder="Ej: Negro, 256GB - Kit Funda"
                  className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Precio de Costo ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    {...register('purchasePrice', {
                      onChange: (e) => {
                        const val = e.target.value.replace(/\./g, '');
                        setValue('purchasePrice', val);
                      },
                    })}
                    onKeyDown={(e) => {
                      if (e.key === ',' && e.currentTarget.value.includes(',')) {
                        e.preventDefault();
                        return;
                      }
                      if (!/^[0-9]$/.test(e.key) && e.key !== ',' && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="0,00"
                    className="w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {errors.purchasePrice && <p className="text-red-500 text-xs mt-1">{errors.purchasePrice.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Precio de Venta ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                  <input
                    type="text"
                    inputMode="decimal"
                    {...register('salePrice', {
                      onChange: (e) => {
                        const val = e.target.value.replace(/\./g, '');
                        setValue('salePrice', val);
                      },
                    })}
                    onKeyDown={(e) => {
                      if (e.key === ',' && e.currentTarget.value.includes(',')) {
                        e.preventDefault();
                        return;
                      }
                      if (!/^[0-9]$/.test(e.key) && e.key !== ',' && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="0,00"
                    className="w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {errors.salePrice && <p className="text-red-500 text-xs mt-1">{errors.salePrice.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Stock Inicial Lote</label>
                <input
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  onKeyDown={(e) => {
                    if (['-', '.', ',', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                  }}
                  min="0"
                  step="1"
                  placeholder="1"
                  className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500"
                />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
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
            icon={<PackageX className="w-5 h-5 text-amber-500" />}
            width="md"
            onSubmit={(e) => {
              e.preventDefault();
              handleLoss(lossProduct!, lossQuantity, lossReason, lossClose);
            }}
            submitLabel="Confirmar Pérdida"
            isPending={isPending}
          >
            <ErrorAlert error={serverError} />
            <div className="p-3 mb-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">Producto</p>
              <p
                className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate"
                title={`${lossProduct?.device?.name} - ${lossProduct?.description}`}
              >
                {lossProduct?.device?.name} - {lossProduct?.description}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Stock actual:
                {lossProduct?.stock} Uds
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Cantidad perdida</label>
                <input
                  type="number"
                  value={lossQuantity}
                  onChange={(e) => setLossQuantity(e.target.value)}
                  onKeyDown={(e) => {
                    if (['-', '.', ',', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                  }}
                  min="1"
                  step="1"
                  placeholder="Ej: 1"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Motivo / Razón</label>
                <textarea
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  placeholder="Ej: Pantalla rota al desembalar"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-indigo-500 min-h-[100px] text-sm"
                />
              </div>
            </div>
          </ResponsiveModal>
        </>
      )}
    </div>
  );
}
