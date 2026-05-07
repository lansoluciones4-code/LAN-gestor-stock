import { useTransition } from 'react';
import { invalidateAllCaches } from '@/stores';
import { ActionResult } from '@/lib/action-result';

interface EntityActionHandlers<TDef, TInput, TUpdateInput = Partial<TInput>> {
  fetchData: (showInactive: boolean) => Promise<TDef[]>;
  createAction?: (data: TInput) => Promise<ActionResult<TDef>>;
  updateAction?: (id: string, data: TUpdateInput) => Promise<ActionResult<TDef>>;
  deleteAction?: (id: string) => Promise<ActionResult>;
  toggleActiveAction?: (id: string, isActive: boolean) => Promise<ActionResult>;
}

interface UseEntityActionsProps<TDef, TInput, TUpdateInput = Partial<TInput>> {
  handlers: EntityActionHandlers<TDef, TInput, TUpdateInput>;
  setStoreData: (data: TDef[]) => void;
  onSuccessMessage: (msg: string) => void;
  onErrorMessage: (msg: string) => void;
  closeFormModal: () => void;
  setServerError: (msg: string | null) => void;
  setItemToDelete: (val: string | null) => void;
  editingItem: TDef | (TDef & { id: string }) | null;
  showInactive: boolean;
}

export function useEntityActions<TDef extends { id?: string; isActive?: boolean }, TInput, TUpdateInput = Partial<TInput>>({ handlers, setStoreData, onSuccessMessage, onErrorMessage, closeFormModal, setServerError, setItemToDelete, editingItem, showInactive }: UseEntityActionsProps<TDef, TInput, TUpdateInput>) {
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

  const handleEditSubmit = async (data: TInput | TUpdateInput) => {
    setServerError(null);
    let result;
    if (editingItem) {
      if (!handlers.updateAction) return setServerError('Operación no soportada');
      result = await handlers.updateAction(editingItem.id!, data as TUpdateInput);
    } else {
      if (!handlers.createAction) return setServerError('Operación no soportada');
      result = await handlers.createAction(data as TInput);
    }

    if (!result.success) return setServerError(result.error);

    closeFormModal();
    onSuccessMessage(result.message || 'Operación exitosa');
    invalidateAllCaches();
    syncData();
  };

  const handleDelete = async (id: string) => {
    setItemToDelete(null);
    if (!handlers.deleteAction) return onErrorMessage('Operación no soportada');

    const result = await handlers.deleteAction(id);

    if (!result.success) return onErrorMessage(result.error);

    onSuccessMessage(result.message || 'Operación exitosa');
    invalidateAllCaches();
    syncData();
  };

  const handleToggleActive = async (item: TDef) => {
    if (!handlers.toggleActiveAction) return onErrorMessage('Operación no soportada');

    const nextStatus = !item.isActive;
    const result = await handlers.toggleActiveAction(item.id!, nextStatus);
    if (!result.success) {
      onErrorMessage(result.error);
    } else {
      onSuccessMessage(result.message || 'Operación exitosa');
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
