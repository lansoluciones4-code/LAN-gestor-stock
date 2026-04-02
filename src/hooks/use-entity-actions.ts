import { useTransition } from 'react';
import { invalidateAllCaches } from '@/stores';

interface EntityActionHandlers<TDef, TInput> {
  fetchData: (showInactive: boolean) => Promise<TDef[]>;
  createAction?: (data: TInput) => Promise<{ success: boolean; message: string; data?: TDef }>;
  updateAction?: (id: string, data: TInput) => Promise<{ success: boolean; message: string; data?: TDef }>;
  deleteAction?: (id: string) => Promise<{ success: boolean; message: string }>;
  toggleActiveAction?: (id: string, isActive: boolean) => Promise<{ success: boolean; message: string }>;
}

interface UseEntityActionsProps<TDef, TInput> {
  handlers: EntityActionHandlers<TDef, TInput>;
  setStoreData: (data: TDef[]) => void;
  onSuccessMessage: (msg: string) => void;
  onErrorMessage: (msg: string) => void;
  closeFormModal: () => void;
  setServerError: (msg: string | null) => void;
  setItemToDelete: (val: string | null) => void;
  editingItem: TDef | (TDef & { id: string }) | null;
  showInactive: boolean;
}

export function useEntityActions<TDef extends { id?: string; isActive?: boolean }, TInput>({ handlers, setStoreData, onSuccessMessage, onErrorMessage, closeFormModal, setServerError, setItemToDelete, editingItem, showInactive }: UseEntityActionsProps<TDef, TInput>) {
  const [isPending, startTransition] = useTransition();

  const syncData = async (manual = false) => {
    startTransition(async () => {
      if (manual) {
        invalidateAllCaches();
      }
      // Usamos el valor directamente para evitar cierres de función (closures) antiguos
      const resp = await handlers.fetchData(showInactive);
      setStoreData(resp);

      if (manual) {
        onSuccessMessage('Datos sincronizados con éxito.');
      }
    });
  };

  const handleEditSubmit = async (data: TInput) => {
    setServerError(null);
    let result;
    if (editingItem) {
      if (!handlers.updateAction) return setServerError('Operación no soportada');
      result = await handlers.updateAction(editingItem.id!, data);
    } else {
      if (!handlers.createAction) return setServerError('Operación no soportada');
      result = await handlers.createAction(data);
    }

    if (!result.success) return setServerError(result.message);

    closeFormModal();
    onSuccessMessage(result.message);
    invalidateAllCaches();
    syncData();
  };

  const handleDelete = async (id: string) => {
    setItemToDelete(null);
    if (!handlers.deleteAction) return onErrorMessage('Operación no soportada');

    const result = await handlers.deleteAction(id);

    if (!result.success) return onErrorMessage(result.message);

    onSuccessMessage(result.message);
    invalidateAllCaches();
    syncData();
  };

  const handleToggleActive = async (item: TDef) => {
    if (!handlers.toggleActiveAction) return onErrorMessage('Operación no soportada');

    const nextStatus = !item.isActive;
    const result = await handlers.toggleActiveAction(item.id!, nextStatus);
    if (!result.success) {
      onErrorMessage(result.message);
    } else {
      onSuccessMessage(result.message);
      invalidateAllCaches();
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
