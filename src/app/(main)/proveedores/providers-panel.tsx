'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Store, RefreshCcw } from 'lucide-react';
import { providerCreateSchema, type ProviderInput, type ProviderDef, type ProviderUpdateInput } from '@/features/provider/domain/provider.schema';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useProviderStore } from '@/features/provider/store/provider.store';
import { fetchProviders, createProviderAction, updateProviderAction, deleteProviderAction, toggleProviderActiveAction } from '@/features/provider/actions/provider.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { Button } from '@/components/ui/button';
import { getProviderColumns } from '@/config/tables/provider-columns';
import { normalizeForSearch } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';
import { renderProviderCard } from '@/config/cards/provider-card';

export function ProvidersPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const { providers, setProviders, isLoaded } = useProviderStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<ProviderDef>();

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<ProviderDef, ProviderInput, ProviderUpdateInput>({
    handlers: { fetchData: fetchProviders, createAction: createProviderAction, updateAction: updateProviderAction, deleteAction: deleteProviderAction, toggleActiveAction: toggleProviderActiveAction },
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
    if (isLoaded) { setInitialLoading(false); return; }
    setInitialLoading(true);
    fetchProviders().then(setProviders).finally(() => setInitialLoading(false));
  }, [isLoaded, setProviders]);

  const { register, handleSubmit, reset, formState: { errors, dirtyFields } } = useForm<ProviderInput>({
    resolver: zodResolver(providerCreateSchema),
  });

  const filteredProviders = useMemo(() =>
    providers
      .filter((p) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        const text = [normalizeForSearch(p.name), normalizeForSearch(p.email), normalizeForSearch(p.phone)].join(' ');
        return terms.every((w) => text.includes(w)) && (showInactive || p.isActive);
      })
      .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)),
    [providers, search, showInactive]
  );

  const handleEditClick = (item?: ProviderDef) => {
    openFormModal(item);
    reset(item ? { name: item.name, phone: item.phone || '', email: item.email || '' } : { name: '', phone: '', email: '' });
  };

  const columns = getProviderColumns({ role, onEdit: handleEditClick, onToggleActive: handleToggleActive, onDelete: setItemToDelete });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar distribuidor por nombre, teléfono o email...'
        searchPlaceholderMobile='Buscar proveedores...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={
          <ToggleFilter id='showInactive-provider' checked={showInactive} onChange={setShowInactive} label='Ver Inactivos' data-testid={TEST_IDS.general.btnVerOcultos} />
        }
        sync={role === 'admin' && (
          <Button variant='secondary' size='icon' onClick={() => syncData(true)} disabled={isPending} title='Sincronizar Datos' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        )}
        actions={role === 'admin' && (
          <Button variant='primary' onClick={() => handleEditClick()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
            <span className='hidden sm:inline'>Agregar Proveedor</span>
            <span className='sm:hidden'>Agregar</span>
          </Button>
        )}
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredProviders}
        isLoading={isPending}
        emptyMessage='No se han encontrado proveedores.'
        renderCard={renderProviderCard({ role, onEdit: handleEditClick, onToggleActive: handleToggleActive, onDelete: setItemToDelete })}
      />

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingItem ? 'Editar Proveedor' : 'Nuevo Proveedor Local'}
        icon={<Store className='w-5 h-5 text-indigo-500' />}
        width='md'
        onSubmit={handleSubmit((data) => {
          if (editingItem) {
             
            const changedData: any = { version: editingItem.version };
            let hasChanges = false;
            Object.keys(dirtyFields).forEach((key) => { changedData[key as keyof ProviderInput] = data[key as keyof ProviderInput]; hasChanges = true; });
            if (!hasChanges) { closeFormModal(); return; }
            handleEditSubmit(changedData);
          } else {
            handleEditSubmit(data);
          }
        })}
        submitLabel={editingItem ? 'Actualizar Firma' : 'Registrar Proveedor'}
        isPending={isPending}
      >
        <ErrorAlert error={serverError} />
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Razón Social / Identificador</label>
            <input type='text' {...register('name')} placeholder='Ej: Accesorios del Sur SRL'
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`} />
            {errors.name && <p className='text-red-500 text-xs mt-1.5'>{errors.name.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Línea Telefónica Directa</label>
            <input type='text' {...register('phone')}
              onChange={(e) => { e.target.value = e.target.value.replace(/[^0-9+\s]/g, ''); register('phone').onChange(e); }}
              placeholder='+54 9 11 1234-5678'
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.phone ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`} />
            {errors.phone && <p className='text-red-500 text-xs mt-1.5'>{errors.phone.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Correo Electrónico Comercial</label>
            <input type='email' {...register('email')} placeholder='ventas@distribuidora.com'
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`} />
            {errors.email && <p className='text-red-500 text-xs mt-1.5'>{errors.email.message}</p>}
          </div>
        </div>
      </ResponsiveModal>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleDelete(itemToDelete as string)}
        title='Eliminar Firma Proveedor'
        description='Esta acción es permanente y eliminará el registro físico de la base de datos. Solo recomendado si lo creaste por error y aún no tiene productos asociados.'
        submitLabel='Desvincular'
        isPending={isPending}
      />
    </div>
  );
}
