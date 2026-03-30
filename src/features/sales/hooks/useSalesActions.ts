import { useTransition } from 'react';
import { type SaleDef } from '@/schemas/sale.schema';
import { type CustomerDef } from '@/schemas/customer.schema';
import { type ProductDef } from '@/schemas/product.schema';
import { createSaleAction, deleteSaleAction, fetchSales } from '@/server/actions/sale.actions';
import { fetchProducts } from '@/server/actions/product.actions';
import { fetchCustomers } from '@/server/actions/customer.actions';
import { useProductsStore } from '@/stores/products.store';
import { useProvidersStore } from '@/stores/providers.store';
import { useDevicesStore } from '@/stores/devices.store';
import { useLogsStore } from '@/stores/logs.store';

interface UseSalesActionsProps {
  onSuccessMessage: (msg: string) => void;
  onErrorMessage: (msg: string) => void;
  setSales: (data: SaleDef[]) => void;
  setProducts: (data: ProductDef[]) => void;
  setCustomers: (data: CustomerDef[]) => void;
  setItemToDelete: (val: string | null) => void;
  clearCart: () => void;
  closeMobileCart: () => void;
  navigateToList: () => void;
}

export function useSalesActions({
  onSuccessMessage,
  onErrorMessage,
  setSales,
  setProducts,
  setCustomers,
  setItemToDelete,
  clearCart,
  closeMobileCart,
  navigateToList
}: UseSalesActionsProps) {
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    startTransition(async () => {
      const [updatedS, updatedP, updatedC] = await Promise.all([
        fetchSales(),
        fetchProducts(),
        fetchCustomers()
      ]);
      setSales(updatedS);
      setProducts(updatedP);
      setCustomers(updatedC);
      
      // Invalidar stores externos para forzar re-fetch al navegar
      useProductsStore.getState().setLoaded(false);
      useProvidersStore.getState().setLoaded(false);
      useDevicesStore.getState().setLoaded(false);
    });
  };

  const handleCreateSale = async (selectedCustomerId: string, cart: any[], cartTotal: number) => {
    if (cart.length === 0 || !selectedCustomerId) return;
    
    startTransition(async () => {
      const result = await createSaleAction({
        customerId: selectedCustomerId || undefined,
        items: cart.map(({ name, desc, max, ...rest }) => ({
          ...rest,
          unitPrice: rest.unitPrice.toString(),
          subtotal: rest.subtotal.toString()
        })) as any,
        total: cartTotal.toString(),
      });

      if (result.success) {
        onSuccessMessage(result.message);
        clearCart();
        closeMobileCart();
        navigateToList();
        useLogsStore.getState().setLoaded(false);
        loadData();
      } else {
        onErrorMessage(result.message);
      }
    });
  };

  const confirmDelete = async (id: string) => {
    setItemToDelete(null);

    startTransition(async () => {
      const result = await deleteSaleAction(id);
      if (result.success) {
        onSuccessMessage(result.message);
        useLogsStore.getState().setLoaded(false);
        loadData();
      } else {
        onErrorMessage(result.message);
      }
    });
  };

  return {
    isPending,
    loadData,
    handleCreateSale,
    confirmDelete,
  };
}
