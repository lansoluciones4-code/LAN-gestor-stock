'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Store, RefreshCcw } from 'lucide-react';
import { providerSchema, type ProviderInput, type ProviderDef, type ProviderUpdateInput } from '@/schemas/provider.schema';
import { useAuthStore } from '@/stores/auth.store';
import { useProvidersStore } from '@/stores/providers.store';
import { fetchProviders, createProviderAction, updateProviderAction, deleteProviderAction, toggleProviderActiveAction } from '@/server/actions/provider.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { VirtualizedDataTable } from '@/components/ui/virtualized-data-table';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { SearchBar } from '@/components/ui/search-bar';
import { Button } from '@/components/ui/button';
import { getProviderColumns } from '@/config/tables/provider-columns';
import { normalizeForSearch } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';

export function ProvidersPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const { providers, setProviders, isLoaded } = useProvidersStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } = useEntityManager<ProviderDef>();

  const [showInactive, setShowInactive] = useState(false);

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<ProviderDef, ProviderInput, ProviderUpdateInput>({
    handlers: {
      fetchData: () => fetchProviders(),
      createAction: createProviderAction,
      updateAction: updateProviderAction,
      deleteAction: deleteProviderAction,
      toggleActiveAction: toggleProviderActiveAction,
    },
    setStoreData: setProviders,
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
      const res = await fetchProviders();
      setProviders(res);
      setInitialLoading(false);
    }
    loadInitial();
  }, [isLoaded, setProviders]);

  const displayProviders = providers;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ProviderInput>({
    resolver: zodResolver(providerSchema),
  });

  const filteredProviders = useMemo(() => {
    return displayProviders
      .filter((p) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        const combinedText = [
          normalizeForSearch(p.name),
          normalizeForSearch(p.email),
          normalizeForSearch(p.phone)
        ].join(' ');

        const matchesSearch = terms.every(word => combinedText.includes(word));
        const matchesStatus = showInactive ? true : p.isActive;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return 0;
      });
  }, [displayProviders, search, showInactive]);

  const handleEditClick = (item?: ProviderDef) => {
    openFormModal(item);
    if (item) {
      reset({ name: item.name, phone: item.phone || '', email: item.email || '' });
    } else {
      reset({ name: '', phone: '', email: '' });
    }
  };

  const columns = getProviderColumns({
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
                placeholder="Buscar distribuidor por nombre, teléfono o email..."
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
                  title="Sincronizar Datos"
                  data-testid={TEST_IDS.general.btnSincronizar}
                >
                  <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleEditClick()}
                  leftIcon={<Plus className="w-5 h-5" />}
                  data-testid={TEST_IDS.general.btnAgregar}
                >
                  Agregar Proveedor
                </Button>
              </div>
            )}
          </div>

          <GlobalMessage message={globalMessage} />

          <VirtualizedDataTable
            columns={columns}
            data={filteredProviders}
            isLoading={isPending}
            emptyMessage="No se han encontrado proveedores."
          />

          <ResponsiveModal
            isOpen={isModalOpen}
            onClose={closeFormModal}
            title={editingItem ? 'Editar Proveedor' : 'Nuevo Proveedor Local'}
            icon={<Store className="w-5 h-5 text-indigo-500" />}
            width="md"
            onSubmit={handleSubmit((data) => {
              if (editingItem) {
                const changedData: any = { version: editingItem.version };
                let hasChanges = false;

                Object.keys(dirtyFields).forEach((key) => {
                  const k = key as keyof ProviderInput;
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
            submitLabel={editingItem ? 'Actualizar Firma' : 'Registrar Proveedor'}
            isPending={isPending}
          >
            <ErrorAlert error={serverError} />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Razón Social / Identificador</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Ej: Accesorios del Sur SRL"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Línea Telefónica Directa</label>
                <input
                  type="text"
                  {...register('phone')}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9\+\s]/g, '');
                    e.target.value = val;
                    register('phone').onChange(e);
                  }}
                  placeholder="+54 9 11 1234-5678"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.phone ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Correo Electrónico Comercial</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="ventas@distribuidora.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>
            </div>
          </ResponsiveModal>

          <ConfirmModal
            isOpen={!!itemToDelete}
            onClose={() => setItemToDelete(null)}
            onConfirm={() => handleDelete(itemToDelete as string)}
            title="Eliminar Firma Proveedor"
            description="Esta acción es permanente y eliminará el registro físico de la base de datos. Solo recomendado si lo creaste por error y aún no tiene productos asociados."
            submitLabel="Desvincular"
            isPending={isPending}
          />
        </>
      )}
    </div>
  );
}
