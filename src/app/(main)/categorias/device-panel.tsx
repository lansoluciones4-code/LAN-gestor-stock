'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, MonitorSmartphone, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { deviceCreateSchema, type DeviceInput, type DeviceDef, type DeviceUpdateInput } from '@/features/device/domain/device.schema';
import { createDeviceAction, updateDeviceAction, deleteDeviceAction, fetchDevices, toggleDeviceActiveAction } from '@/features/device/actions/device.actions';
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
    fetchDevices().then(setDevices).finally(() => setInitialLoading(false));
  }, [isLoaded, setDevices]);

  const { register, handleSubmit, reset, formState: { errors, dirtyFields } } = useForm<DeviceInput>({
    resolver: zodResolver(deviceCreateSchema),
  });

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
    reset(item ? { name: item.name } : { name: '' });
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
          <Button onClick={() => handleEditClick()} variant='primary' leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm' data-testid={TEST_IDS.general.btnAgregar}>
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

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingItem ? 'Actualizar Categoría' : 'Nueva Categoría en Catálogo'}
        icon={<MonitorSmartphone className='w-5 h-5 text-indigo-500' />}
        width='sm'
        onSubmit={handleSubmit((data) => {
          if (editingItem) {
             
            const changedData: any = { version: editingItem.version };
            let hasChanges = false;
            Object.keys(dirtyFields).forEach((key) => { changedData[key as keyof DeviceInput] = data[key as keyof DeviceInput]; hasChanges = true; });
            if (!hasChanges) { closeFormModal(); return; }
            handleEditSubmit(changedData);
          } else {
            handleEditSubmit(data);
          }
        })}
        submitLabel={editingItem ? 'Actualizar Categoría' : 'Agregar Categoría'}
        submitTestId={TEST_IDS.general.btnSubmitModal}
        isPending={isPending}
      >
        <ErrorAlert error={serverError} />
        <div className='max-h-[60vh] overflow-y-auto px-1 space-y-4'>
          <div>
            <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Nombre / Modelo / Marca</label>
            <input
              type='text'
              {...register('name')}
              autoFocus
              placeholder='Ej: iPhone 15 Pro Max'
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            />
            {errors.name && <p className='text-red-500 text-xs mt-1.5'>{errors.name.message}</p>}
          </div>
        </div>
      </ResponsiveModal>

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
