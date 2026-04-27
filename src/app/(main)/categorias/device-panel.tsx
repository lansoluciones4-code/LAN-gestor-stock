'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, MonitorSmartphone, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { SearchBar } from '@/components/ui/search-bar';
import { VirtualizedDataTable } from '@/components/ui/virtualized-data-table';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { deviceSchema, type DeviceInput, type DeviceDef, type DeviceUpdateInput } from '@/schemas/device.schema';
import { createDeviceAction, updateDeviceAction, deleteDeviceAction, fetchDevices, toggleDeviceActiveAction } from '@/server/actions/device.actions';
import { useAuthStore } from '@/stores/auth.store';
import { useDevicesStore } from '@/stores/devices.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { getDeviceColumns } from '@/config/tables/device-columns';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeString } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';


export function DevicePanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const { devices, setDevices, isLoaded } = useDevicesStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } = useEntityManager<DeviceDef>();

  const [showInactive, setShowInactive] = useState(false);

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<DeviceDef, DeviceInput, DeviceUpdateInput>({
    handlers: {
      fetchData: fetchDevices,
      createAction: createDeviceAction,
      updateAction: updateDeviceAction,
      deleteAction: deleteDeviceAction,
      toggleActiveAction: toggleDeviceActiveAction,
    },
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
    async function loadInitial() {
      if (isLoaded) {
        setInitialLoading(false);
        return;
      }
      setInitialLoading(true);
      const res = await fetchDevices();
      setDevices(res);
      setInitialLoading(false);
    }
    loadInitial();
  }, [isLoaded]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<DeviceInput>({
    resolver: zodResolver(deviceSchema),
  });

  const filteredDevices = useMemo(() => {
    return devices
      .filter((d) => {
        const terms = normalizeString(search).split(/\s+/);
        const combinedText = normalizeString(d.name);
        const matchesSearch = terms.every(word => combinedText.includes(word));
        const matchesStatus = showInactive ? true : d.isActive;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return 0;
      });
  }, [devices, search, showInactive]);

  const handleEditClick = (item?: DeviceDef) => {
    openFormModal(item);
    if (item) {
      reset({ name: item.name });
    } else {
      reset({ name: '' });
    }
  };

  const columns = getDeviceColumns({
    role,
    onEdit: handleEditClick,
    onToggleActive: handleToggleActive,
    onDelete: setItemToDelete,
  });


  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {initialLoading ? (
        <div className="mt-8 animate-in fade-in duration-500">
          <TableSkeleton />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <SearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar modelos por marca, versión o nombre..."
                className="h-11"
                data-testid={TEST_IDS.general.inputBusquedaTabla}
              />
              <ToggleFilter
                id="showInactive"
                checked={showInactive}
                onChange={setShowInactive}
                label="Ver Inactivos"
                data-testid={TEST_IDS.general.btnVerOcultos}
              />
            </div>

            {role === 'admin' && (
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => syncData(true)}
                  disabled={isPending}
                  title="Sincronizar"
                  className="h-11 w-11"
                  data-testid={TEST_IDS.general.btnSincronizar}
                >
                  <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={() => handleEditClick()}
                  variant="primary"
                  leftIcon={<Plus className="w-5 h-5" />}
                  className="h-11"
                  data-testid={TEST_IDS.general.btnAgregar}
                >
                  Agregar Categoría
                </Button>
              </div>
            )}
          </div>

          <GlobalMessage message={globalMessage} />

          <VirtualizedDataTable
            columns={columns}
            data={filteredDevices}
            isLoading={isPending}
            emptyMessage="No hay categorías registradas."
          />

          <ResponsiveModal
            isOpen={isModalOpen}
            onClose={closeFormModal}
            title={editingItem ? 'Actualizar Categoría' : 'Nueva Categoría en Catálogo'}
            icon={<MonitorSmartphone className="w-5 h-5 text-indigo-500" />}
            width="sm"
            onSubmit={handleSubmit((data) => {
              if (editingItem) {
                const changedData: any = { version: editingItem.version };
                let hasChanges = false;

                Object.keys(dirtyFields).forEach((key) => {
                  const k = key as keyof DeviceInput;
                  (changedData as any)[k] = data[k];
                  hasChanges = true;
                });

                if (!hasChanges) {
                  closeFormModal();
                  return;
                }
                handleEditSubmit(changedData);
              } else {
                handleEditSubmit(data);
              }
            })}
            submitLabel={editingItem ? 'Actualizar Categoría' : 'Agregar Categoría'}
            isPending={isPending}
          >
            <ErrorAlert error={serverError} />
            <div className="max-h-[60vh] overflow-y-auto px-1 space-y-4">
              <div>
                <label className="block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2">Nombre / Modelo / Marca</label>
                <input
                  type="text"
                  {...register('name')}
                  autoFocus
                  placeholder="Ej: iPhone 15 Pro Max"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
              </div>
            </div>
          </ResponsiveModal>

          <ConfirmModal
            isOpen={!!itemToDelete}
            onClose={() => setItemToDelete(null)}
            onConfirm={() => handleDelete(itemToDelete as string)}
            title="Inhabilitar / Eliminar Modelo"
            description="¿Confirmar operación? El modelo no se borrará si tiene inventario existente por cuestiones de seguridad."
            submitLabel="Eliminar"
            isPending={isPending}
          />
        </>
      )}
    </div>
  );
}
