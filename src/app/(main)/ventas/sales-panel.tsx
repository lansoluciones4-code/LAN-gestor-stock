'use client';

import { useState, useEffect } from 'react';
import { type SaleDef } from '@/features/sale/domain/sale.schema';
import { fetchSales } from '@/features/sale/actions/sale.actions';
import { fetchCustomers } from '@/features/customer/actions/customer.actions';
import { fetchProducts } from '@/features/product/actions/product.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { SalesListView } from '@/features/sale/ui/components/sales-list-view';
import { SalesPOSView } from '@/features/sale/ui/components/sales-pos-view';
import { PrintSaleView } from '@/features/sale/ui/components/print-sale-view';
import { SalesPrintView } from '@/features/sale/ui/components/sales-print-view';
import { useCart } from '@/features/sale/ui/hooks/useCart';
import { usePrintCart } from '@/features/sale/ui/hooks/usePrintCart';
import { useSalesActions } from '@/features/sale/ui/hooks/useSalesActions';
import { type SaleCustomerSelection } from '@/features/sale/ui/components/sale-customer-picker';
import { SalePaymentModal } from '@/features/sale/ui/components/sale-payment-modal';
import { SaleDiscountModal } from '@/features/sale/ui/components/sale-discount-modal';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { useSaleStore } from '@/features/sale/store/sale.store';
import { useProductStore } from '@/features/product/store/product.store';
import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { GlobalMessage } from '@/components/ui/alert';
import { roundToDecimals } from '@/lib/utils';

type BusinessSection = 'tech' | 'libreria' | 'impresiones';

const SECTION_TABS: { id: BusinessSection; label: string }[] = [
  { id: 'tech', label: 'Tech' },
  { id: 'libreria', label: 'Librería' },
  { id: 'impresiones', label: 'Impresiones' },
];

export function SalesPanel() {
  const [view, setView] = useState<'list' | 'new' | 'print'>('list');
  const [activeSection, setActiveSection] = useState<BusinessSection>('tech');
  const [initialLoading, setInitialLoading] = useState(true);

  const { sales, setSales, isLoaded: salesLoaded } = useSaleStore();
  const { products, setProducts, isLoaded: prodsLoaded } = useProductStore();
  const { setCustomers, isLoaded: custLoaded } = useCustomerStore();

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

  const sectionSales = sales.filter((s) => s.businessSection === activeSection);
  const sectionProducts = products.filter((p) => p.device?.section === activeSection);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<SaleDef | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [currentDiscounts, setCurrentDiscounts] = useState({ amount: 0, percentage: 0 });

  const [customerSelection, setCustomerSelection] = useState<SaleCustomerSelection>({ mode: 'final' });

  const cartProps = useCart();
  const printCartProps = usePrintCart();

  const { isPending, handleCreateSale, handleCreatePrintSale, confirmDelete, loadData } = useSalesActions({
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

  const currentSubtotal = activeSection === 'impresiones' ? printCartProps.printTotal : cartProps.cartTotal;

  if (view === 'new') {
    return (
      <>
        {activeSection === 'impresiones' ? (
          <PrintSaleView
            items={printCartProps.items}
            addItem={printCartProps.addItem}
            removeItem={printCartProps.removeItem}
            printTotal={printCartProps.printTotal}
            customerSelection={customerSelection}
            setCustomerSelection={setCustomerSelection}
            isPending={isPending}
            onConfirmSale={() => setIsDiscountModalOpen(true)}
            onCancel={() => {
              setIsDiscountModalOpen(false);
              setIsPaymentModalOpen(false);
              setView('list');
            }}
          />
        ) : (
          <SalesPOSView
            products={sectionProducts}
            {...cartProps}
            setCustomerSelection={setCustomerSelection}
            isPending={isPending}
            onConfirmSale={() => setIsDiscountModalOpen(true)}
            onCancel={() => {
              setIsDiscountModalOpen(false);
              setIsPaymentModalOpen(false);
              setView('list');
            }}
            showMobileCart={showMobileCart}
            setShowMobileCart={setShowMobileCart}
            isPaymentModalOpen={isPaymentModalOpen || isDiscountModalOpen}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
          />
        )}
        <SaleDiscountModal
          isOpen={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          subtotal={currentSubtotal}
          onConfirm={(discounts) => {
            setCurrentDiscounts(discounts);
            setIsDiscountModalOpen(false);
            setIsPaymentModalOpen(true);
          }}
        />
        <SalePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          total={roundToDecimals(currentSubtotal * (1 - currentDiscounts.percentage / 100) - currentDiscounts.amount)}
          isPending={isPending}
          onConfirm={(payments) => {
            const baseTotal = roundToDecimals(currentSubtotal * (1 - currentDiscounts.percentage / 100) - currentDiscounts.amount);
            const paymentsSum = roundToDecimals(payments.reduce((acc, p) => acc + p.amount, 0));
            // El total cobrado puede superar al de la venta por el recargo de cuotas con interés en Crédito.
            const finalTotal = Math.max(baseTotal, paymentsSum);
            if (activeSection === 'impresiones') {
              handleCreatePrintSale(customerSelection, printCartProps.items, finalTotal, payments, currentDiscounts, printCartProps.clearItems);
            } else {
              handleCreateSale(customerSelection, activeSection, cartProps.cart, finalTotal, payments, currentDiscounts);
            }
            setIsPaymentModalOpen(false);
          }}
        />
      </>
    );
  }

  const saleBeingDeleted = sales.find((s) => s.id === itemToDelete);
  const isDeletingPrintSale = saleBeingDeleted?.businessSection === 'impresiones';

  return (
    <>
      <div className='flex rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-1 mb-4 shrink-0'>
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeSection === tab.id ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className='flex flex-col flex-1 h-full overflow-hidden outline-none'
        tabIndex={-1}
      >
        <SalesListView
          sales={sectionSales}
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
        description={isDeletingPrintSale ? '¿Deseas anular esta venta de impresión? Esta acción no se puede deshacer.' : '¿Deseas anular esta venta? El stock de los productos asociados será repuesto automáticamente. Esta acción no se puede deshacer.'}
        submitLabel='Confirmar Anulación'
        isPending={isPending}
      />
    </>
  );
}
