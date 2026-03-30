import { useTransition } from 'react';
import { type ProviderInput, type ProviderDef } from '@/schemas/provider.schema';
import { createProviderAction, updateProviderAction, deleteProviderAction, fetchProviders, toggleProviderActiveAction } from '@/server/actions/provider.actions';
import { useProvidersStore } from '@/stores/providers.store';

interface UseProviderActionsProps {
  onSuccessMessage: (msg: string) => void;
  onErrorMessage: (msg: string) => void;
  closeFormModal: () => void;
  setServerError: (msg: string | null) => void;
  setItemToDelete: (val: string | null) => void;
  editingItem: ProviderDef | null;
  showInactive: boolean;
}

export function useProviderActions({
  onSuccessMessage,
  onErrorMessage,
  closeFormModal,
  setServerError,
  setItemToDelete,
  editingItem,
  showInactive,
}: UseProviderActionsProps) {
  const [isPending, startTransition] = useTransition();
  const { setProviders } = useProvidersStore();

  const syncData = async () => {
    startTransition(async () => {
      const resp = await fetchProviders(true);
      setProviders(resp);
    });
  };

  const handleEditSubmit = async (data: ProviderInput) => {
    setServerError(null);
    const result = await (editingItem ? updateProviderAction(editingItem.id!, data) : createProviderAction(data));
    
    if (!result.success) return setServerError(result.message);
    
    closeFormModal();
    onSuccessMessage(result.message);
    syncData();
  };

  const handleDelete = async (id: string) => {
    setItemToDelete(null);
    const result = await deleteProviderAction(id);
    
    if (!result.success) return onErrorMessage(result.message);
    
    onSuccessMessage(result.message);
    syncData();
  };

  const handleToggleActive = async (item: ProviderDef) => {
    const nextStatus = !item.isActive;
    const result = await toggleProviderActiveAction(item.id, nextStatus);
    if (!result.success) {
      onErrorMessage(result.message);
    } else {
      onSuccessMessage(result.message);
      syncData();
    }
  };

  return {
    isPending,
    syncData,
    handleEditSubmit,
    handleDelete,
    handleToggleActive,
  };
}
