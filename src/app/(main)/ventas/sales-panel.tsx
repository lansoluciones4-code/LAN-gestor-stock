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
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { useSalesStore } from '@/stores/sales.store';
import { useProductsStore } from '@/stores/products.store';
import { useCustomersStore } from '@/stores/customers.store';
export function SalesPanel() {
  const [view, setView] = useState<'list' | 'new' | 'print'>('list');
  const [initialLoading, setInitialLoading] = useState(true);
  
  const { sales, setSales, isLoaded: salesLoaded } = useSalesStore();
  const { products, setProducts, isLoaded: prodsLoaded } = useProductsStore();
  const { customers, setCustomers, isLoaded: custLoaded } = useCustomersStore();

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
      if (!custLoaded) promises.push(fetchCustomers(false).then(setCustomers));
      
      await Promise.all(promises);
      setInitialLoading(false);
    }
    loadInitial();
  }, [salesLoaded, prodsLoaded, custLoaded, setSales, setProducts, setCustomers]);

  const displaySales = sales;
  const displayProducts = products;
  const displayCustomers = customers;

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<SaleDef | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    displayCustomers.find((c) => c.name.toLowerCase() === 'mostrador')?.id || displayCustomers[0]?.id || ''
  );

  const cartProps = useCart();
  
  const { isPending, handleCreateSale, confirmDelete, loadData } = useSalesActions({
    onSuccessMessage: (text) => { setGlobalMessage({ type: 'success', text }); setTimeout(() => setGlobalMessage(null), 4000); },
    onErrorMessage: (text) => { setGlobalMessage({ type: 'error', text }); setTimeout(() => setGlobalMessage(null), 4000); },
    setSales,
    setProducts,
    setCustomers,
    setItemToDelete,
    clearCart: cartProps.clearCart,
    closeMobileCart: () => setShowMobileCart(false),
    navigateToList: () => setView('list')
  });

  if (initialLoading) {
    return <div className="mt-8 animate-in fade-in duration-500"><TableSkeleton /></div>;
  }

  if (view === 'print' && selectedSaleForPrint) {
    return <SalesPrintView sale={selectedSaleForPrint} onClose={() => { setSelectedSaleForPrint(null); setView('list'); }} />;
  }

  if (view === 'new') {
    return (
      <SalesPOSView 
        products={displayProducts}
        customers={displayCustomers}
        setCustomers={setCustomers}
        {...cartProps}
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        isPending={isPending}
        onConfirmSale={() => handleCreateSale(selectedCustomerId, cartProps.cart, cartProps.cartTotal)}
        onCancel={() => setView('list')}
        showMobileCart={showMobileCart}
        setShowMobileCart={setShowMobileCart}
        setGlobalMessage={setGlobalMessage}
      />
    );
  }

  return (
    <>
      <div className='flex flex-col flex-1 h-full overflow-hidden'>
        {globalMessage && (
          <div className={`shrink-0 mb-4 p-4 rounded-lg border text-sm font-bold animate-in slide-in-from-top-2 duration-300 shadow-sm ${
            globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'
          }`}>
            {globalMessage.text}
          </div>
        )}

        <SalesListView 
          sales={displaySales}
          isPending={isPending}
          onSync={loadData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onNewSale={() => setView('new')}
          onPrintRow={(sale) => { setSelectedSaleForPrint(sale); setView('print'); }}
          onDeleteRow={setItemToDelete}
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
