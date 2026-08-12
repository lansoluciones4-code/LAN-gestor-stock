import { useTransition } from 'react';
import { type SaleDef } from '@/features/sale/domain/sale.schema';
import { type CustomerDef } from '@/features/customer/domain/customer.schema';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { createSaleAction, createPrintSaleAction, deleteSaleAction, fetchSales } from '@/features/sale/actions/sale.actions';
import { fetchProducts } from '@/features/product/actions/product.actions';
import { fetchCustomers, createCustomerAction } from '@/features/customer/actions/customer.actions';
import { type SaleCustomerSelection } from '@/features/sale/ui/components/sale-customer-picker';
import { type PrintCartItem } from '@/features/sale/ui/hooks/usePrintCart';
import { invalidateAllCaches } from '@/stores';

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

export function useSalesActions({ onSuccessMessage, onErrorMessage, setSales, setProducts, setCustomers, setItemToDelete, clearCart, closeMobileCart, navigateToList }: UseSalesActionsProps) {
  const [isPending, startTransition] = useTransition();

  const loadData = async (manual = false) => {
    startTransition(async () => {
      invalidateAllCaches();

      const [updatedS, updatedP, updatedC] = await Promise.all([fetchSales(), fetchProducts(), fetchCustomers()]);

      setSales(updatedS);
      setProducts(updatedP);
      setCustomers(updatedC);

      if (manual) {
        onSuccessMessage('Datos sincronizados con éxito.');
      }
    });
  };

  /** Resolves a customer selection to an id: creates the customer inline first when mode is 'new'. */
  const resolveCustomerId = async (selection: SaleCustomerSelection): Promise<{ id?: string; error?: string }> => {
    if (selection.mode === 'final') return {};
    if (selection.mode === 'existing') return { id: selection.customerId };

    const result = await createCustomerAction(selection.data);
    if (!result.success) return { error: result.error };
    return { id: result.data!.id };
  };

  const handleCreateSale = async (customerSelection: SaleCustomerSelection, section: 'tech' | 'libreria', cart: any[], cartTotal: number, payments: any[], discounts: { amount: number; percentage: number }) => {
    if (cart.length === 0 || payments.length === 0) return;

    startTransition(async () => {
      const { id: customerId, error: customerError } = await resolveCustomerId(customerSelection);
      if (customerError) {
        onErrorMessage(customerError);
        return;
      }

      const result = await createSaleAction({
        customerId,
        businessSection: section,
        items: cart.map(({ name, desc, max, ...rest }) => ({
          ...rest,
          unitPrice: rest.unitPrice,
          subtotal: rest.subtotal,
        })),
        total: cartTotal,
        discountAmount: discounts.amount,
        discountPercentage: discounts.percentage,
        payments: payments.map((p) => ({
          ...p,
          amount: p.amount,
        })),
      });

      if (result.success) {
        onSuccessMessage(result.message || 'Venta realizada con éxito');
        clearCart();
        closeMobileCart();
        navigateToList();
        loadData();
      } else {
        onErrorMessage(result.error);
      }
    });
  };

  const handleCreatePrintSale = async (customerSelection: SaleCustomerSelection, items: PrintCartItem[], total: number, payments: any[], discounts: { amount: number; percentage: number }, onDone: () => void) => {
    if (items.length === 0 || payments.length === 0) return;

    startTransition(async () => {
      const { id: customerId, error: customerError } = await resolveCustomerId(customerSelection);
      if (customerError) {
        onErrorMessage(customerError);
        return;
      }

      const result = await createPrintSaleAction({
        customerId,
        items: items.map(({ id, ...rest }) => rest),
        total,
        discountAmount: discounts.amount,
        discountPercentage: discounts.percentage,
        payments: payments.map((p) => ({ ...p, amount: p.amount })),
      });

      if (result.success) {
        onSuccessMessage(result.message || 'Venta realizada con éxito');
        onDone();
        closeMobileCart();
        navigateToList();
        loadData();
      } else {
        onErrorMessage(result.error);
      }
    });
  };

  const confirmDelete = async (id: string) => {
    setItemToDelete(null);

    startTransition(async () => {
      const result = await deleteSaleAction(id);
      if (result.success) {
        onSuccessMessage(result.message || 'Venta anulada');
        loadData();
      } else {
        onErrorMessage(result.error);
      }
    });
  };

  return {
    isPending,
    loadData,
    handleCreateSale,
    handleCreatePrintSale,
    confirmDelete,
  };
}
