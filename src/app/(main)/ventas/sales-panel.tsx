'use client';

import { useState } from 'react';
import { type SaleDef } from '@/features/sale/domain/sale.schema';
import { fetchSales } from '@/features/sale/actions/sale.actions';
import { fetchCustomers } from '@/features/customer/actions/customer.actions';
import { fetchProducts } from '@/features/product/actions/product.actions';
import { fetchTechnicalServices } from '@/features/technical-service/actions/technical-service.actions';
import { fetchCards } from '@/features/card/actions/card.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { SalesListView } from '@/features/sale/ui/components/sales-list-view';
import { SaleBuilderView } from '@/features/sale/ui/components/sale-builder-view';
import { QuickSaleView } from '@/features/sale/ui/components/quick-sale-view';
import { SalesPrintView } from '@/features/sale/ui/components/sales-print-view';
import { useCart } from '@/features/sale/ui/hooks/useCart';
import { usePrintCart } from '@/features/sale/ui/hooks/usePrintCart';
import { useServiceCart } from '@/features/sale/ui/hooks/useServiceCart';
import { useSalesActions } from '@/features/sale/ui/hooks/useSalesActions';
import { type SaleCustomerSelection } from '@/features/sale/ui/components/sale-customer-picker';
import { SalePaymentModal } from '@/features/sale/ui/components/sale-payment-modal';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { useSaleStore } from '@/features/sale/store/sale.store';
import { useProductStore } from '@/features/product/store/product.store';
import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useTechnicalServiceStore } from '@/features/technical-service/store/technical-service.store';
import { useCardStore } from '@/features/card/store/card.store';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { GlobalMessage } from '@/components/ui/alert';
import { roundToDecimals } from '@/lib/utils';

export function SalesPanel() {
  const [view, setView] = useState<'list' | 'new' | 'quick' | 'print'>('list');

  const { sales, setSales, isLoaded: salesLoaded } = useSaleStore();
  const { products, setProducts, isLoaded: prodsLoaded } = useProductStore();
  const { setCustomers, isLoaded: custLoaded } = useCustomerStore();
  const { technicalServices, setTechnicalServices, isLoaded: servicesLoaded } = useTechnicalServiceStore();
  const { cards, setCards, isLoaded: cardsLoaded } = useCardStore();

  const { itemToDelete, setItemToDelete, globalMessage, showGlobalMessage, search: searchTerm, setSearch: setSearchTerm } = useEntityManager<SaleDef>();

  const { initialLoading } = useAutoSync({
    isLoaded: salesLoaded && prodsLoaded && custLoaded && servicesLoaded && cardsLoaded,
    sync: async () => {
      const [s, p, c, ts, cd] = await Promise.all([fetchSales(), fetchProducts(), fetchCustomers(), fetchTechnicalServices(), fetchCards()]);
      setSales(s);
      setProducts(p);
      setCustomers(c);
      setTechnicalServices(ts);
      setCards(cd);
    },
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<SaleDef | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [customerSelection, setCustomerSelection] = useState<SaleCustomerSelection>({ mode: 'final' });

  const cartProps = useCart();
  const printCartProps = usePrintCart();
  const serviceCartProps = useServiceCart();

  // Carrito propio de Venta Rápida — independiente del de "Nueva venta" para que no se pisen si el
  // vendedor alterna entre los dos flujos.
  const quickCartProps = useCart();
  const quickPrintCartProps = usePrintCart();

  const { isPending, handleCreateSale, confirmDelete, loadData } = useSalesActions({
    onSuccessMessage: (text) => showGlobalMessage('success', text),
    onErrorMessage: (text) => showGlobalMessage('error', text),
    setSales,
    setProducts,
    setCustomers,
    setItemToDelete,
    clearCart: cartProps.clearCart,
    clearPrintItems: printCartProps.clearItems,
    clearServiceItems: serviceCartProps.clearItems,
    closeMobileCart: () => setShowMobileCart(false),
    navigateToList: () => setView('list'),
  });

  const { isPending: isQuickPending, handleCreateSale: handleCreateQuickSale } = useSalesActions({
    onSuccessMessage: (text) => showGlobalMessage('success', text),
    onErrorMessage: (text) => showGlobalMessage('error', text),
    setSales,
    setProducts,
    setCustomers,
    setItemToDelete,
    clearCart: quickCartProps.clearCart,
    clearPrintItems: quickPrintCartProps.clearItems,
    clearServiceItems: () => {},
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

  const currentSubtotal = roundToDecimals(cartProps.cartTotal + printCartProps.printTotal + serviceCartProps.serviceTotal);
  const quickSubtotal = roundToDecimals(quickCartProps.cartTotal + quickPrintCartProps.printTotal);

  if (view === 'quick') {
    return (
      <>
        <QuickSaleView
          products={products}
          cartProps={quickCartProps}
          printCartProps={quickPrintCartProps}
          cartTotal={quickSubtotal}
          isPending={isQuickPending}
          onConfirmSale={() => setIsPaymentModalOpen(true)}
          onCancel={() => {
            setIsPaymentModalOpen(false);
            setView('list');
          }}
          showMobileCart={showMobileCart}
          setShowMobileCart={setShowMobileCart}
          isPaymentModalOpen={isPaymentModalOpen}
          setIsPaymentModalOpen={setIsPaymentModalOpen}
        />
        <SalePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          subtotal={quickSubtotal}
          cards={cards}
          allowedTypes={['efectivo', 'transferencia']}
          isPending={isQuickPending}
          onConfirm={(payments, discountPercentage) => {
            const baseTotal = roundToDecimals(quickSubtotal * (1 - discountPercentage / 100));
            const paymentsSum = roundToDecimals(payments.reduce((acc, p) => acc + p.amount, 0));
            const finalTotal = Math.max(baseTotal, paymentsSum);
            handleCreateQuickSale({ mode: 'final' }, quickCartProps.cart, quickPrintCartProps.items, [], finalTotal, payments, { amount: 0, percentage: discountPercentage });
            setIsPaymentModalOpen(false);
          }}
        />
      </>
    );
  }

  if (view === 'new') {
    return (
      <>
        <SaleBuilderView
          products={products}
          technicalServices={technicalServices}
          cartProps={cartProps}
          printCartProps={printCartProps}
          serviceCartProps={serviceCartProps}
          cartTotal={currentSubtotal}
          setCustomerSelection={setCustomerSelection}
          isPending={isPending}
          onConfirmSale={() => setIsPaymentModalOpen(true)}
          onCancel={() => {
            setIsPaymentModalOpen(false);
            setView('list');
          }}
          showMobileCart={showMobileCart}
          setShowMobileCart={setShowMobileCart}
          isPaymentModalOpen={isPaymentModalOpen}
          setIsPaymentModalOpen={setIsPaymentModalOpen}
        />
        <SalePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          subtotal={currentSubtotal}
          cards={cards}
          isPending={isPending}
          onConfirm={(payments, discountPercentage) => {
            const baseTotal = roundToDecimals(currentSubtotal * (1 - discountPercentage / 100));
            const paymentsSum = roundToDecimals(payments.reduce((acc, p) => acc + p.amount, 0));
            const finalTotal = Math.max(baseTotal, paymentsSum);
            handleCreateSale(customerSelection, cartProps.cart, printCartProps.items, serviceCartProps.items, finalTotal, payments, { amount: 0, percentage: discountPercentage });
            setIsPaymentModalOpen(false);
          }}
        />
      </>
    );
  }

  const saleBeingDeleted = sales.find((s) => s.id === itemToDelete);
  const willRestoreStock = (saleBeingDeleted?.items?.length ?? 0) > 0;

  return (
    <>
      <div
        className='flex flex-col flex-1 h-full overflow-hidden outline-none'
        tabIndex={-1}
      >
        <SalesListView
          sales={sales}
          isPending={isPending}
          onSync={() => loadData(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onNewSale={() => {
            setCustomerSelection({ mode: 'final' });
            setView('new');
          }}
          onQuickSale={() => setView('quick')}
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
        description={willRestoreStock ? '¿Deseas anular esta venta? El stock de los productos asociados será repuesto automáticamente. Esta acción no se puede deshacer.' : '¿Deseas anular esta venta? Esta acción no se puede deshacer.'}
        submitLabel='Confirmar Anulación'
        isPending={isPending}
      />
    </>
  );
}
