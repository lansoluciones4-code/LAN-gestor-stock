import { useTransition } from 'react';
import { type ProductInput, type ProductDef } from '@/schemas/product.schema';
import { createProductAction, updateProductAction, deleteProductAction, fetchProducts, registerProductLossAction } from '@/server/actions/product.actions';
import { useProductsStore } from '@/stores/products.store';
import { useEntityManager } from '@/hooks/use-entity-manager';

interface UseProductActionsProps {
  onSuccessMessage: (msg: string) => void;
  onErrorMessage: (msg: string) => void;
  closeFormModal: () => void;
  setServerError: (msg: string | null) => void;
  setItemToDelete: (val: string | null) => void;
  editingItem: ProductDef | null;
}

export function useProductActions({
  onSuccessMessage,
  onErrorMessage,
  closeFormModal,
  setServerError,
  setItemToDelete,
  editingItem,
}: UseProductActionsProps) {
  const [isPending, startTransition] = useTransition();
  const { setProducts } = useProductsStore();

  const syncData = async () => {
    startTransition(async () => {
      const resp = await fetchProducts();
      setProducts(resp);
    });
  };

  const handleEditSubmit = async (data: ProductInput) => {
    setServerError(null);
    const result = await (editingItem ? updateProductAction(editingItem.id!, data) : createProductAction(data));
    if (!result.success) return setServerError(result.message);
    
    closeFormModal();
    onSuccessMessage(result.message);
    syncData();
  };

  const handleDelete = async (id: string) => {
    setItemToDelete(null);
    const result = await deleteProductAction(id);
    if (!result.success) return onErrorMessage(result.message);
    
    onSuccessMessage(result.message);
    syncData();
  };

  const handleLoss = async (lossProduct: ProductDef, quantity: string, reason: string, onLossClose: () => void) => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return setServerError('La cantidad debe ser mayor a 0');
    if (qty > (lossProduct.stock || 0)) return setServerError('Excede el stock disponible');
    
    setServerError(null);
    const result = await registerProductLossAction(lossProduct.id, qty, reason);
    if (!result.success) return setServerError(result.message);
    
    onLossClose();
    onSuccessMessage(result.message);
    syncData();
  };

  return {
    isPending,
    syncData,
    handleEditSubmit,
    handleDelete,
    handleLoss,
  };
}
