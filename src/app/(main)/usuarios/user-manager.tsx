'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { SearchBar } from '@/components/ui/search-bar';
import { DataTable } from '@/components/ui/data-table';
import { type UserInput, type UserDef } from '@/schemas/user.schema';
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  fetchUsers,
  toggleUserActiveAction,
} from '@/server/actions/user.actions';
import { useAuthStore } from '@/stores/auth.store';
import { useUsersStore } from '@/stores/users.store';
import { useSalesStore } from '@/stores/sales.store';
import { useLogsStore } from '@/stores/logs.store';
import { useStatsStore } from '@/stores/stats.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { getUserColumns } from '@/config/tables/user-columns';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useClientPagination } from '@/hooks/use-client-pagination';

import { UserModal } from '@/components/modals/user-modal';
import { ConfirmModal } from '@/components/ui/responsive-modal';

export function UserManager() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const { users, setUsers, isLoaded } = useUsersStore();
  
  const {
    isModalOpen, editingItem, openFormModal, closeFormModal,
    itemToDelete, setItemToDelete,
    serverError, setServerError,
    globalMessage, showGlobalMessage,
    search, setSearch
  } = useEntityManager<UserDef>();

  const [showInactives, setShowInactives] = useState(false);

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<UserDef, UserInput>({
    handlers: {
      fetchData: fetchUsers,
      createAction: createUserAction,
      updateAction: updateUserAction,
      deleteAction: deleteUserAction,
      toggleActiveAction: toggleUserActiveAction,
    },
    setStoreData: setUsers,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive: showInactives,
    onAfterSuccess: () => {
      useSalesStore.getState().setLoaded(false);
      useLogsStore.getState().setLoaded(false);
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
      const res = await fetchUsers(showInactives);
      setUsers(res);
      setInitialLoading(false);
    }
    loadInitial();
  }, [isLoaded, setUsers, showInactives]);

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch = u.username.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
    const matchesStatus = showInactives ? true : u.isActive;
    return matchesSearch && matchesStatus;
  });

  const { paginatedData, hasMore, elementRef } = useClientPagination(filteredUsers, 20);

  const handleEditClick = (item?: UserDef) => {
    openFormModal(item);
  };

  const columns = getUserColumns({
    currentUserId,
    role,
    onEdit: handleEditClick,
    onDelete: (id) => setItemToDelete(id),
    onToggleActive: handleToggleActive,
  });

  // Re-fetch when inactive filter changes
  useEffect(() => {
    if (!initialLoading) {
      syncData();
    }
  }, [showInactives]);

  const handleModalSubmit = async (data: UserInput) => {
    await handleEditSubmit(data);
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
              placeholder='Buscar usuarios por ID, nombre o rol...' 
              className='h-11'
            />
            <ToggleFilter 
              id='showInactives' 
              checked={showInactives} 
              onChange={setShowInactives} 
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
              Crear Credencial
            </Button>
          </div>
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
          emptyMessage="No se han encontrado usuarios con credenciales activas."
        />

        <UserModal 
          isOpen={isModalOpen} 
          onClose={closeFormModal} 
          editingItem={editingItem}
          onSubmit={handleModalSubmit}
          isPending={isPending}
          serverError={serverError}
        />

        <ConfirmModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={() => handleDelete(itemToDelete as string)}
          title="Eliminar Credencial"
          description="Esta acción retirará todos los permisos de acceso de este usuario. Solo se recomienda si la cuenta nunca registró movimientos."
          submitLabel="Eliminar Acceso"
          isPending={isPending}
        />
      </>
      )}
    </div>
  );
}
