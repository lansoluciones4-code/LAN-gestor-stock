'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Wrench, RefreshCcw, DollarSign } from 'lucide-react';
import { technicalServiceCreateSchema, type TechnicalServiceInput, type TechnicalServiceDef, type TechnicalServiceUpdateInput } from '@/features/technical-service/domain/technical-service.schema';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useTechnicalServiceStore } from '@/features/technical-service/store/technical-service.store';
import { fetchTechnicalServices, createTechnicalServiceAction, updateTechnicalServiceAction, deleteTechnicalServiceAction, toggleTechnicalServiceActiveAction } from '@/features/technical-service/actions/technical-service.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { Button } from '@/components/ui/button';
import { getTechnicalServiceColumns } from '@/config/tables/technical-service-columns';
import { renderTechnicalServiceCard } from '@/config/cards/technical-service-card';
import { normalizeForSearch, blockInvalidPriceKey } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';

export function TechnicalServicesPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [showInactive, setShowInactive] = useState(false);
  const { technicalServices, setTechnicalServices, isLoaded } = useTechnicalServiceStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<TechnicalServiceDef>();

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<TechnicalServiceDef, TechnicalServiceInput, TechnicalServiceUpdateInput>({
    handlers: {
      fetchData: fetchTechnicalServices,
      createAction: createTechnicalServiceAction,
      updateAction: updateTechnicalServiceAction,
      deleteAction: deleteTechnicalServiceAction,
      toggleActiveAction: toggleTechnicalServiceActiveAction,
    },
    setStoreData: setTechnicalServices,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive,
  });

  const { initialLoading } = useAutoSync({ isLoaded, sync: () => fetchTechnicalServices().then(setTechnicalServices) });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<TechnicalServiceInput>({
    resolver: zodResolver(technicalServiceCreateSchema),
  });

  const filteredServices = useMemo(
    () =>
      technicalServices
        .filter((s) => {
          const terms = normalizeForSearch(search).split(/\s+/);
          const text = [normalizeForSearch(s.name), normalizeForSearch(s.description || '')].join(' ');
          return terms.every((w) => text.includes(w)) && (showInactive || s.isActive);
        })
        .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)),
    [technicalServices, search, showInactive]
  );

  const handleEditClick = (item?: TechnicalServiceDef) => {
    openFormModal(item);
    reset(item ? { name: item.name, description: item.description || '', value: item.value } : { name: '', description: '', value: undefined });
  };

  const columns = getTechnicalServiceColumns({ role, onEdit: handleEditClick, onToggleActive: handleToggleActive, onDelete: setItemToDelete });

  if (initialLoading) {
    return (
      <div className='mt-8 animate-in fade-in duration-500'>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar servicio por nombre o descripción...'
        searchPlaceholderMobile='Buscar servicios...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={<ToggleFilter id='showInactive-technical-service' checked={showInactive} onChange={setShowInactive} label='Ver Inactivos' data-testid={TEST_IDS.general.btnVerOcultos} />}
        sync={
          role === 'admin' && (
            <Button
              variant='secondary'
              size='icon'
              onClick={() => syncData(true)}
              disabled={isPending}
              title='Sincronizar Datos'
              className='h-11 w-11 flex-none'
              data-testid={TEST_IDS.general.btnSincronizar}
            >
              <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
            </Button>
          )
        }
        actions={
          role === 'admin' && (
            <Button
              variant='primary'
              onClick={() => handleEditClick()}
              leftIcon={<Plus className='w-5 h-5' />}
              className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base'
              data-testid={TEST_IDS.general.btnAgregar}
            >
              <span className='hidden sm:inline'>Nuevo Serv. técnico</span>
              <span className='sm:hidden'>Nuevo</span>
            </Button>
          )
        }
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredServices}
        isLoading={isPending}
        emptyMessage='No se han encontrado servicios técnicos.'
        renderCard={renderTechnicalServiceCard({ role, onEdit: handleEditClick, onToggleActive: handleToggleActive, onDelete: setItemToDelete })}
      />

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingItem ? 'Editar Servicio Técnico' : 'Nuevo Servicio Técnico'}
        icon={<Wrench className='w-5 h-5 text-zinc-500' />}
        width='md'
        onSubmit={handleSubmit((data) => {
          if (editingItem) {
            const changedData: any = { version: editingItem.version };
            let hasChanges = false;
            Object.keys(dirtyFields).forEach((key) => {
              changedData[key as keyof TechnicalServiceInput] = data[key as keyof TechnicalServiceInput];
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
        submitLabel={editingItem ? 'Actualizar Servicio' : 'Registrar Servicio'}
        isPending={isPending}
      >
        <ErrorAlert error={serverError} />
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Nombre</label>
            <input
              type='text'
              {...register('name')}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            />
            {errors.name && <p className='text-zinc-500 text-xs mt-1.5'>{errors.name.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Descripción</label>
            <textarea
              rows={3}
              {...register('description')}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors resize-none ${errors.description ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            />
            {errors.description && <p className='text-zinc-500 text-xs mt-1.5'>{errors.description.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Valor ($)</label>
            <div className='relative'>
              <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
              <input
                type='text'
                inputMode='decimal'
                {...register('value', {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\./g, '');
                  },
                })}
                onKeyDown={blockInvalidPriceKey}
                className={`w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors ${errors.value ? 'border-zinc-500' : ''}`}
              />
            </div>
            {errors.value && <p className='text-zinc-500 text-xs mt-1.5'>{errors.value.message}</p>}
          </div>
        </div>
      </ResponsiveModal>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleDelete(itemToDelete as string)}
        title='Eliminar Servicio Técnico'
        description='Esta acción es permanente y eliminará el registro de la base de datos.'
        submitLabel='Eliminar'
        isPending={isPending}
      />
    </div>
  );
}
