import { useState, useEffect } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { SearchBar } from '@/components/ui/search-bar';
import { DataTable } from '@/components/ui/data-table';
import { type CustomerInput, type CustomerDef } from '@/schemas/customer.schema';
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  fetchCustomers,
  toggleCustomerActiveAction,
} from '@/server/actions/customer.actions';
import { useAuthStore } from '@/stores/auth.store';
import { useCustomersStore } from '@/stores/customers.store';
import { useSalesStore } from '@/stores/sales.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { getCustomerColumns } from '@/config/tables/customer-columns';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useClientPagination } from '@/hooks/use-client-pagination';

import { CustomerModal } from '@/components/modals/customer-modal';

export function CustomerPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const { customers, setCustomers, isLoaded } = useCustomersStore();
  
  const {
    isModalOpen, editingItem, openFormModal, closeFormModal,
    itemToDelete, setItemToDelete,
    serverError, setServerError,
    globalMessage, showGlobalMessage,
    search, setSearch
  } = useEntityManager<CustomerDef>();

  const [showInactive, setShowInactive] = useState(false);

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<CustomerDef, CustomerInput>({
    handlers: {
      fetchData: fetchCustomers,
      createAction: createCustomerAction,
      updateAction: updateCustomerAction,
      deleteAction: deleteCustomerAction,
      toggleActiveAction: toggleCustomerActiveAction,
    },
    setStoreData: setCustomers,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive,
    onAfterSuccess: () => useSalesStore.getState().setLoaded(false),
  });

  useEffect(() => {
    async function loadInitial() {
      if (isLoaded) {
        setInitialLoading(false);
        return;
      }
      setInitialLoading(true);
      const res = await fetchCustomers(showInactive);
      setCustomers(res);
      setInitialLoading(false);
    }
    loadInitial();
  }, [isLoaded, setCustomers, showInactive]);

  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(term) || 
                          (c.email && c.email.toLowerCase().includes(term)) || 
                          (c.phone && c.phone.toLowerCase().includes(term)) || 
                          (c.documentNumber && c.documentNumber.toLowerCase().includes(term));
    const matchesStatus = showInactive ? true : c.isActive;
    return matchesSearch && matchesStatus;
  });

  const { paginatedData, hasMore, elementRef } = useClientPagination(filteredCustomers, 20);

  const handleEditClick = (item?: CustomerDef) => {
    openFormModal(item);
  };

  const columns = getCustomerColumns({
    role,
    onEdit: handleEditClick,
    onToggleActive: handleToggleActive,
  });

  useEffect(() => {
    if (!initialLoading) {
      syncData();
    }
  }, [showInactive]);

  const handleSuccess = (data: any) => {
    useSalesStore.getState().setLoaded(false);
    showGlobalMessage('success', editingItem ? 'Cliente actualizado' : 'Cliente registrado');
    syncData();
  };

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
              placeholder='Buscar clientes por nombre, mail o DNI...' 
              className='h-11'
            />
            <ToggleFilter 
              id='showInactive' 
              checked={showInactive} 
              onChange={setShowInactive} 
              label='Ver Inactivos' 
            />
          </div>
          
          <div className='flex items-center gap-2 sm:gap-4'>
            <Button variant="secondary" size="icon" onClick={syncData} disabled={isPending} title="Sincronizar" className='h-11 w-11'>
              <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => handleEditClick()}
              variant="primary"
              leftIcon={<Plus className='w-5 h-5' />}
              className='h-11'
            >
              Registrar Cliente
            </Button>
          </div>
        </div>

        {globalMessage && (
          <div className={`shrink-0 mb-4 p-4 rounded-lg flex items-center shadow-sm text-sm border ${globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {globalMessage.text}
          </div>
        )}

        <DataTable 
          columns={columns} 
          data={paginatedData} 
          isLoading={isPending} 
          hasMore={hasMore} 
          observerRef={elementRef} 
          emptyMessage="No se han encontrado clientes."
        />

        <CustomerModal 
          isOpen={isModalOpen} 
          onClose={closeFormModal} 
          editingItem={editingItem}
          onSuccess={handleSuccess}
        />
      </>
      )}
    </div>
  );
}
