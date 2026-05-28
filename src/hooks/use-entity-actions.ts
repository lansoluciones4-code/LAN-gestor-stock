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
      const resp = await handlers.fetchData(showInactive);
      setStoreData(resp);

      if (manual) {
        onSuccessMessage('Datos sincronizados con éxito.');
      }
    });
  };

  const handleEditSubmit = (data: TInput | TUpdateInput) => {
    setServerError(null);
    startTransition(async () => {
      let result;
      if (editingItem) {
        if (!handlers.updateAction) { setServerError('Operación no soportada'); return; }
        result = await handlers.updateAction(editingItem.id!, data as TUpdateInput);
      } else {
        if (!handlers.createAction) { setServerError('Operación no soportada'); return; }
        result = await handlers.createAction(data as TInput);
      }

      if (!result.success) { setServerError(result.error); return; }

      closeFormModal();
      onSuccessMessage(result.message || 'Operación exitosa');
      invalidateAllCaches();
      const resp = await handlers.fetchData(showInactive);
      setStoreData(resp);
    });
  };

  const handleDelete = (id: string) => {
    setItemToDelete(null);
    startTransition(async () => {
      if (!handlers.deleteAction) { onErrorMessage('Operación no soportada'); return; }

      const result = await handlers.deleteAction(id);

      if (!result.success) { onErrorMessage(result.error); return; }

      onSuccessMessage(result.message || 'Operación exitosa');
      invalidateAllCaches();
      const resp = await handlers.fetchData(showInactive);
      setStoreData(resp);
    });
  };

  const handleToggleActive = (item: TDef) => {
    startTransition(async () => {
      if (!handlers.toggleActiveAction) { onErrorMessage('Operación no soportada'); return; }

      const nextStatus = !item.isActive;
      const result = await handlers.toggleActiveAction(item.id!, nextStatus);
      if (!result.success) {
        onErrorMessage(result.error);
      } else {
        onSuccessMessage(result.message || 'Operación exitosa');
        invalidateAllCaches();
        const resp = await handlers.fetchData(showInactive);
        setStoreData(resp);
      }
    });
  };

  return {
    isPending,
    syncData,
    handleEditSubmit,
    handleDelete,
    handleToggleActive,
  };
}
