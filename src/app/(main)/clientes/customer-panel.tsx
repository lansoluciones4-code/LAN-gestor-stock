'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { type CustomerInput, type CustomerDef, type CustomerUpdateInput } from '@/features/customer/domain/customer.schema';
import { createCustomerAction, updateCustomerAction, deleteCustomerAction, fetchCustomers, toggleCustomerActiveAction } from '@/features/customer/actions/customer.actions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { getCustomerColumns } from '@/config/tables/customer-columns';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeForSearch } from '@/lib/utils';
import { CustomerModal } from '@/features/customer/ui/components/customer-modal';
import { GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';
import { renderCustomerCard } from '@/config/cards/customer-card';

export function CustomerPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const { customers, setCustomers, isLoaded } = useCustomerStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<CustomerDef>();

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<CustomerDef, CustomerInput, CustomerUpdateInput>({
    handlers: { fetchData: fetchCustomers, createAction: createCustomerAction, updateAction: updateCustomerAction, deleteAction: deleteCustomerAction, toggleActiveAction: toggleCustomerActiveAction },
    setStoreData: setCustomers,
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
    fetchCustomers().then(setCustomers).finally(() => setInitialLoading(false));
  }, [isLoaded, setCustomers]);

  const filteredCustomers = useMemo(() =>
    customers
      .filter((c) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        const text = [normalizeForSearch(c.name), normalizeForSearch(c.email), normalizeForSearch(c.phone), normalizeForSearch(c.documentNumber)].join(' ');
        return terms.every((w) => text.includes(w)) && (showInactive || c.isActive);
      })
      .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)),
    [customers, search, showInactive]
  );

  const columns = getCustomerColumns({ role, onEdit: openFormModal, onToggleActive: handleToggleActive });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar clientes por nombre, mail o DNI...'
        searchPlaceholderMobile='Buscar clientes...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={
          <ToggleFilter id='showInactive-customer' checked={showInactive} onChange={setShowInactive} label='Ver Inactivos' data-testid={TEST_IDS.general.btnVerOcultos} />
        }
        sync={
          <Button variant='secondary' size='icon' onClick={() => syncData(true)} disabled={isPending} title='Sincronizar' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        }
        actions={
          <Button onClick={() => openFormModal()} variant='primary' leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
            <span className='hidden sm:inline'>Registrar Cliente</span>
            <span className='sm:hidden'>Agregar</span>
          </Button>
        }
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredCustomers}
        isLoading={isPending}
        emptyMessage='No se han encontrado clientes.'
        renderCard={renderCustomerCard({ onEdit: openFormModal, onToggleActive: handleToggleActive })}
      />

      <CustomerModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        editingItem={editingItem}
        onSuccess={() => { showGlobalMessage('success', editingItem ? 'Cliente actualizado' : 'Cliente registrado'); syncData(); }}
      />
    </div>
  );
}
