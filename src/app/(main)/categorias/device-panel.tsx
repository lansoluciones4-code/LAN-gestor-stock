'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { type DeviceInput, type DeviceDef, type DeviceUpdateInput } from '@/features/device/domain/device.schema';
import { createDeviceAction, updateDeviceAction, deleteDeviceAction, fetchDevices, toggleDeviceActiveAction } from '@/features/device/actions/device.actions';
import { DeviceModal } from '@/features/device/ui/components/device-modal';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useDeviceStore } from '@/features/device/store/device.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { getDeviceColumns } from '@/config/tables/device-columns';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeForSearch } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';
import { renderDeviceCard } from '@/config/cards/device-card';

export function DevicePanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const { devices, setDevices, isLoaded } = useDeviceStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<DeviceDef>();

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<DeviceDef, DeviceInput, DeviceUpdateInput>({
    handlers: { fetchData: fetchDevices, createAction: createDeviceAction, updateAction: updateDeviceAction, deleteAction: deleteDeviceAction, toggleActiveAction: toggleDeviceActiveAction },
    setStoreData: setDevices,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive,
  });

  useEffect(() => {
    if (isLoaded) { setInitialLoading(false); return; }
    setInitialLoading(true);
    fetchDevices().then(setDevices).finally(() => setInitialLoading(false));
  }, [isLoaded, setDevices]);



  const filteredDevices = useMemo(() =>
    devices
      .filter((d) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        return terms.every((w) => normalizeForSearch(d.name).includes(w)) && (showInactive || d.isActive);
      })
      .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)),
    [devices, search, showInactive]
  );

  const handleEditClick = (item?: DeviceDef) => {
    openFormModal(item);
  };

  const columns = getDeviceColumns({ role, onEdit: handleEditClick, onToggleActive: handleToggleActive, onDelete: setItemToDelete });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar modelos por marca, versión o nombre...'
        searchPlaceholderMobile='Buscar categorías...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={
          <ToggleFilter id='showInactive-device' checked={showInactive} onChange={setShowInactive} label='Ver Inactivos' data-testid={TEST_IDS.general.btnVerOcultos} />
        }
        sync={role === 'admin' && (
          <Button variant='secondary' size='icon' onClick={() => syncData(true)} disabled={isPending} title='Sincronizar' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        )}
        actions={role === 'admin' && (
          <Button onClick={() => handleEditClick()} variant='primary' leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
            <span className='hidden sm:inline'>Agregar Categoría</span>
            <span className='sm:hidden'>Agregar</span>
          </Button>
        )}
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredDevices}
        isLoading={isPending}
        emptyMessage='No hay categorías registradas.'
        renderCard={renderDeviceCard({ onEdit: handleEditClick, onToggleActive: handleToggleActive, onDelete: setItemToDelete })}
      />

      <DeviceModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        onSubmit={handleEditSubmit}
        editingItem={editingItem}
        serverError={serverError}
        isPending={isPending}
      />

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleDelete(itemToDelete as string)}
        title='Inhabilitar / Eliminar Modelo'
        description='¿Confirmar operación? El modelo no se borrará si tiene inventario existente por cuestiones de seguridad.'
        submitLabel='Eliminar'
        submitTestId={TEST_IDS.general.btnSubmitModal}
        isPending={isPending}
      />
    </div>
  );
}
