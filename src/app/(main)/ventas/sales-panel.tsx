'use client';

import { useState, useEffect } from 'react';
import { type SaleDef } from '@/features/sale/domain/sale.schema';
import { fetchSales } from '@/features/sale/actions/sale.actions';
import { fetchCustomers } from '@/features/customer/actions/customer.actions';
import { fetchProducts } from '@/features/product/actions/product.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { SalesListView } from '@/features/sale/ui/components/sales-list-view';
import { SalesPOSView } from '@/features/sale/ui/components/sales-pos-view';
import { SalesPrintView } from '@/features/sale/ui/components/sales-print-view';
import { useCart } from '@/features/sale/ui/hooks/useCart';
import { useSalesActions } from '@/features/sale/ui/hooks/useSalesActions';
import { SalePaymentModal } from '@/features/sale/ui/components/sale-payment-modal';
import { SaleDiscountModal } from '@/features/sale/ui/components/sale-discount-modal';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { useSaleStore } from '@/features/sale/store/sale.store';
import { useProductStore } from '@/features/product/store/product.store';
import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { GlobalMessage } from '@/components/ui/alert';
import { roundToDecimals } from '@/lib/utils';

export function SalesPanel() {
  const [view, setView] = useState<'list' | 'new' | 'print'>('list');
  const [initialLoading, setInitialLoading] = useState(true);

  const { sales, setSales, isLoaded: salesLoaded } = useSaleStore();
  const { products, setProducts, isLoaded: prodsLoaded } = useProductStore();
  const { customers, setCustomers, isLoaded: custLoaded } = useCustomerStore();

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
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [currentDiscounts, setCurrentDiscounts] = useState({ amount: 0, percentage: 0 });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  useEffect(() => {
    if (view === 'new' && !selectedCustomerId && displayCustomers.length > 0) {
      const activeCustomers = displayCustomers.filter((c) => c.isActive);
      if (activeCustomers.length > 0) {
        const defaultCust = activeCustomers.find((c) => c.name.toLowerCase() === 'mostrador') || activeCustomers[0];
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
      <div className='mt-8 animate-in fade-in duration-500'>
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
          onConfirmSale={() => setIsDiscountModalOpen(true)}
          onCancel={() => {
            setIsDiscountModalOpen(false);
            setIsPaymentModalOpen(false);
            setView('list');
          }}
          showMobileCart={showMobileCart}
          setShowMobileCart={setShowMobileCart}
          setGlobalMessage={(msg) => (msg ? showGlobalMessage(msg.type, msg.text) : null)}
          isPaymentModalOpen={isPaymentModalOpen || isDiscountModalOpen}
          setIsPaymentModalOpen={setIsPaymentModalOpen} // Also need to pass this for escape key closing or just ignore it
        />
        <SaleDiscountModal
          isOpen={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          subtotal={cartProps.cartTotal}
          onConfirm={(discounts) => {
            setCurrentDiscounts(discounts);
            setIsDiscountModalOpen(false);
            setIsPaymentModalOpen(true);
          }}
        />
        <SalePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          total={roundToDecimals(cartProps.cartTotal * (1 - currentDiscounts.percentage / 100) - currentDiscounts.amount)}
          isPending={isPending}
          onConfirm={(payments) => {
            const finalTotal = roundToDecimals(cartProps.cartTotal * (1 - currentDiscounts.percentage / 100) - currentDiscounts.amount);
            handleCreateSale(selectedCustomerId, cartProps.cart, finalTotal, payments, currentDiscounts);
            setIsPaymentModalOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <div
        className='flex flex-col flex-1 h-full overflow-hidden outline-none'
        tabIndex={-1}
      >
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
          globalMessage={<GlobalMessage message={globalMessage} />}
        />
      </div>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => confirmDelete(itemToDelete as string)}
        title='Anular Venta'
        description='¿Deseas anular esta venta? El stock de los productos asociados será repuesto automáticamente. Esta acción no se puede deshacer.'
        submitLabel='Confirmar Anulación'
        isPending={isPending}
      />
    </>
  );
}
