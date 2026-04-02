'use client';

import { useState, useEffect } from 'react';
import { type SaleDef } from '@/schemas/sale.schema';
import { fetchSales } from '@/server/actions/sale.actions';
import { fetchCustomers } from '@/server/actions/customer.actions';
import { fetchProducts } from '@/server/actions/product.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { SalesListView } from '@/features/sales/components/sales-list-view';
import { SalesPOSView } from '@/features/sales/components/sales-pos-view';
import { SalesPrintView } from '@/features/sales/components/sales-print-view';
import { useCart } from '@/features/sales/hooks/useCart';
import { useSalesActions } from '@/features/sales/hooks/useSalesActions';
import { SalePaymentModal } from '@/features/sales/components/sale-payment-modal';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { useSalesStore } from '@/stores/sales.store';
import { useProductsStore } from '@/stores/products.store';
import { useCustomersStore } from '@/stores/customers.store';
import { useEntityManager } from '@/hooks/use-entity-manager';

export function SalesPanel() {
  const [view, setView] = useState<'list' | 'new' | 'print'>('list');
  const [initialLoading, setInitialLoading] = useState(true);

  const { sales, setSales, isLoaded: salesLoaded } = useSalesStore();
  const { products, setProducts, isLoaded: prodsLoaded } = useProductsStore();
  const { customers, setCustomers, isLoaded: custLoaded } = useCustomersStore();

  const { itemToDelete, setItemToDelete, globalMessage, showGlobalMessage, search: searchTerm, setSearch: setSearchTerm } = useEntityManager<SaleDef>();

  useEffect(() => {
    async function loadInitial() {
      if (salesLoaded && prodsLoaded && custLoaded) {
        setInitialLoading(false);
        return;
      }

      setInitialLoading(true);
      const promises = [];
      if (!salesLoaded) promises.push(fetchSales().then(setSales));
      if (!prodsLoaded) promises.push(fetchProducts().then(setProducts));
      if (!custLoaded) promises.push(fetchCustomers().then(setCustomers));

      await Promise.all(promises);
      setInitialLoading(false);
    }
    loadInitial();
  }, [salesLoaded, prodsLoaded, custLoaded, setSales, setProducts, setCustomers]);

  const displaySales = sales;
  const displayProducts = products;
  const displayCustomers = customers;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<SaleDef | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  useEffect(() => {
    if (view === 'new' && !selectedCustomerId && displayCustomers.length > 0) {
      const activeCustomers = displayCustomers.filter(c => c.isActive);
      if (activeCustomers.length > 0) {
        const defaultCust = activeCustomers.find(c => c.name.toLowerCase() === 'mostrador') || activeCustomers[0];
        setSelectedCustomerId(defaultCust.id);
      }
    }
  }, [view, displayCustomers, selectedCustomerId]);

  const cartProps = useCart();

  const { isPending, handleCreateSale, confirmDelete, loadData } = useSalesActions({
    onSuccessMessage: (text) => showGlobalMessage('success', text),
    onErrorMessage: (text) => showGlobalMessage('error', text),
    setSales,
    setProducts,
    setCustomers,
    setItemToDelete,
    clearCart: cartProps.clearCart,
    closeMobileCart: () => setShowMobileCart(false),
    navigateToList: () => setView('list'),
  });

  if (initialLoading) {
    return (
      <div className="mt-8 animate-in fade-in duration-500">
        <TableSkeleton />
      </div>
    );
  }

  if (view === 'print' && selectedSaleForPrint) {
    return (
      <SalesPrintView
        sale={selectedSaleForPrint}
        onClose={() => {
          setSelectedSaleForPrint(null);
          setView('list');
        }}
      />
    );
  }

  if (view === 'new') {
    return (
      <>
        <SalesPOSView
          products={displayProducts}
          customers={displayCustomers}
          setCustomers={setCustomers}
          {...cartProps}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          isPending={isPending}
          onConfirmSale={() => setIsPaymentModalOpen(true)}
          onCancel={() => {
            setIsPaymentModalOpen(false);
            setView('list');
          }}
          showMobileCart={showMobileCart}
          setShowMobileCart={setShowMobileCart}
          setGlobalMessage={(msg) => (msg ? showGlobalMessage(msg.type, msg.text) : null)}
          isPaymentModalOpen={isPaymentModalOpen}
          setIsPaymentModalOpen={setIsPaymentModalOpen}
        />
        <SalePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          total={cartProps.cartTotal}
          isPending={isPending}
          onConfirm={(payments) => {
            handleCreateSale(selectedCustomerId, cartProps.cart, cartProps.cartTotal, payments);
            setIsPaymentModalOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col flex-1 h-full overflow-hidden outline-none" tabIndex={-1}>
        <SalesListView
          sales={displaySales}
          isPending={isPending}
          onSync={() => loadData(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onNewSale={() => {
            setSelectedCustomerId('');
            setView('new');
          }}
          onPrintRow={(sale) => {
            setSelectedSaleForPrint(sale);
            setView('print');
          }}
          onDeleteRow={setItemToDelete}
          globalMessage={globalMessage}
        />
      </div>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => confirmDelete(itemToDelete as string)}
        title="Anular Venta"
        description="¿Deseas anular esta venta? El stock de los productos asociados será repuesto automáticamente. Esta acción no se puede deshacer."
        submitLabel="Confirmar Anulación"
        isPending={isPending}
      />
    </>
  );
}
