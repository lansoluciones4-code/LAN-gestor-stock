'use client';

import { useMemo } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { type ProductReturnInput, type ProductReturnDef } from '@/features/product-return/domain/product-return.schema';
import { useProductReturnStore } from '@/features/product-return/store/product-return.store';
import { fetchProductReturns, createProductReturnAction } from '@/features/product-return/actions/product-return.actions';
import { ReturnFormModal } from '@/features/product-return/ui/components/return-form-modal';
import { useProductStore } from '@/features/product/store/product.store';
import { fetchProducts } from '@/features/product/actions/product.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { Button } from '@/components/ui/button';
import { getProductReturnColumns } from '@/config/tables/product-return-columns';
import { normalizeForSearch } from '@/lib/utils';
import { GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';
import { renderProductReturnCard } from '@/config/cards/product-return-card';

export function ReturnsPanel() {
  const { returns, setReturns, isLoaded: returnsLoaded } = useProductReturnStore();
  const { products, setProducts, isLoaded: productsLoaded } = useProductStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete: _itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<ProductReturnDef>();

  const { isPending, syncData, handleEditSubmit } = useEntityActions<ProductReturnDef, ProductReturnInput>({
    handlers: { fetchData: fetchProductReturns, createAction: createProductReturnAction },
    setStoreData: setReturns,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive: false,
  });

  const { initialLoading } = useAutoSync({
    isLoaded: returnsLoaded && productsLoaded,
    sync: async () => {
      const [returnsList, productsList] = await Promise.all([fetchProductReturns(), fetchProducts()]);
      setReturns(returnsList);
      setProducts(productsList);
    },
  });

  const filteredReturns = useMemo(() => {
    const terms = normalizeForSearch(search).split(/\s+/);
    return returns.filter((r) => {
      const text = [normalizeForSearch(r.product?.device?.name), normalizeForSearch(r.reason), normalizeForSearch(r.user?.username)].join(' ');
      return terms.every((w) => text.includes(w));
    });
  }, [returns, search]);

  const columns = getProductReturnColumns();

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar por producto, motivo o usuario...'
        searchPlaceholderMobile='Buscar devoluciones...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        sync={
          <Button variant='secondary' size='icon' onClick={() => syncData(true)} disabled={isPending} title='Sincronizar' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        }
        actions={
          <Button variant='primary' onClick={() => openFormModal()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
            <span className='hidden sm:inline'>Registrar Devolución</span>
            <span className='sm:hidden'>Agregar</span>
          </Button>
        }
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredReturns}
        isLoading={isPending}
        emptyMessage='No se han registrado devoluciones.'
        renderCard={renderProductReturnCard()}
      />

      <ReturnFormModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        onSubmit={handleEditSubmit}
        serverError={serverError}
        isPending={isPending}
        products={products}
      />
    </div>
  );
}
