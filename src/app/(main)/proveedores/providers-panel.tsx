'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Store, RefreshCcw } from 'lucide-react';
import { providerSchema, type ProviderInput, type ProviderDef } from '@/schemas/provider.schema';
import { useAuthStore } from '@/stores/auth.store';
import { useProvidersStore } from '@/stores/providers.store';
import { useProductsStore } from '@/stores/products.store';
import { useSalesStore } from '@/stores/sales.store';
import { useStatsStore } from '@/stores/stats.store';
import { fetchProviders, createProviderAction, updateProviderAction, deleteProviderAction, toggleProviderActiveAction } from '@/server/actions/provider.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { DataTable } from '@/components/ui/data-table';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { SearchBar } from '@/components/ui/search-bar';
import { Button } from '@/components/ui/button';
import { getProviderColumns } from '@/config/tables/provider-columns';

export function ProvidersPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const { providers, setProviders, isLoaded } = useProvidersStore();
  const setProductsLoaded = useProductsStore((s) => s.setLoaded);

  const {
    isModalOpen, editingItem, openFormModal, closeFormModal,
    itemToDelete, setItemToDelete,
    serverError, setServerError,
    globalMessage, showGlobalMessage,
    search, setSearch
  } = useEntityManager<ProviderDef>();

  const [showInactive, setShowInactive] = useState(false);

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<ProviderDef, ProviderInput>({
    handlers: {
      fetchData: () => fetchProviders(true),
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
    onAfterSuccess: () => {
      setProductsLoaded(false);
      useSalesStore.getState().setLoaded(false);
      useStatsStore.getState().setLoaded(false);
    },
  });

  useEffect(() => {
    async function loadInitial() {
      if (isLoaded) {
        setInitialLoading(false);
        return;
      }
      setInitialLoading(true);
      const res = await fetchProviders(true);
      setProviders(res);
      setInitialLoading(false);
    }
    loadInitial();
  }, [isLoaded, setProviders]);

  const displayProviders = providers;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProviderInput>({
    resolver: zodResolver(providerSchema),
  });

  const filteredProviders = displayProviders.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(term) || (p.email && p.email.toLowerCase().includes(term)) || (p.phone && p.phone.toLowerCase().includes(term));
    const matchesStatus = showInactive ? true : p.isActive;
    return matchesSearch && matchesStatus;
  });

  const { paginatedData, hasMore, elementRef } = useClientPagination(filteredProviders, 20);

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
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      {initialLoading ? (
        <div className="mt-8 animate-in fade-in duration-500"><TableSkeleton /></div>
      ) : (
      <>
      <div className='flex flex-col sm:flex-row gap-4 mb-6 shrink-0'>
        <div className='flex flex-col sm:flex-row gap-2 flex-1'>
          <SearchBar 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder='Buscar distribuidor por nombre, teléfono o email...'
          />
          <ToggleFilter id='showInactive' checked={showInactive} onChange={setShowInactive} label='Ver Inactivos' />
        </div>

        {role === 'admin' && (
          <div className='flex items-center gap-2 sm:gap-4'>
            <Button variant="secondary" size="icon" onClick={() => syncData()} disabled={isPending} title="Sincronizar Datos">
              <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="primary" onClick={() => handleEditClick()} leftIcon={<Plus className='w-5 h-5' />}>
              Agregar Proveedor
            </Button>
          </div>
        )}
      </div>

      {globalMessage && (
        <div className={`shrink-0 mb-4 p-4 rounded-lg flex items-center shadow-sm text-sm border ${globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'}`}>
          {globalMessage.text}
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={paginatedData} 
        isLoading={isPending} 
        hasMore={hasMore} 
        observerRef={elementRef} 
        emptyMessage="No se han encontrado proveedores."
      />

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingItem ? 'Editar Proveedor' : 'Nuevo Proveedor Local'}
        icon={<Store className='w-5 h-5 text-indigo-500'/>}
        width="md"
        onSubmit={handleSubmit(handleEditSubmit)}
        submitLabel={editingItem ? 'Actualizar Firma' : 'Registrar Proveedor'}
        isPending={isPending}
      >
        {serverError && <div className='p-3 bg-red-50 text-red-600 text-sm font-bold uppercase rounded-lg border border-red-200 mb-6'>{serverError}</div>}
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Razón Social / Identificador</label>
            <input type='text' {...register('name')} placeholder='Ej: Accesorios del Sur SRL' className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`} />
            {errors.name && <p className='text-red-500 text-xs mt-1.5'>{errors.name.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Línea Telefónica Directa</label>
            <input type='text' {...register('phone')} placeholder='+54 9 11 1234-5678' className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.phone ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`} />
            {errors.phone && <p className='text-red-500 text-xs mt-1.5'>{errors.phone.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Correo Electrónico Comercial</label>
            <input type='email' {...register('email')} placeholder='ventas@distribuidora.com' className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`} />
            {errors.email && <p className='text-red-500 text-xs mt-1.5'>{errors.email.message}</p>}
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
