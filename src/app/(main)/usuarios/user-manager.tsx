'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { SearchBar } from '@/components/ui/search-bar';
import { VirtualizedDataTable } from '@/components/ui/virtualized-data-table';
import { type UserInput, type UserDef } from '@/schemas/user.schema';
import { createUserAction, updateUserAction, deleteUserAction, fetchUsers, toggleUserActiveAction } from '@/server/actions/user.actions';
import { useAuthStore } from '@/stores/auth.store';
import { useUsersStore } from '@/stores/users.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { getUserColumns } from '@/config/tables/user-columns';
import { useEntityManager } from '@/hooks/use-entity-manager';

import { UserModal } from '@/components/modals/user-modal';
import { ConfirmModal } from '@/components/ui/responsive-modal';

export function UserManager() {
  const [showInactives, setShowInactives] = useState(false);
  const [search, setSearch] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  const { users, setUsers, isLoaded, setLoaded } = useUsersStore();

  const { itemToDelete, setItemToDelete, editingItem, openFormModal, closeFormModal, globalMessage, showGlobalMessage, serverError, setServerError } = useEntityManager<UserDef>();

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions({
    handlers: {
      fetchData: (inactive) => fetchUsers(inactive),
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
  });

  const columns = getUserColumns({
    currentUserId: currentUser?.id,
    role: currentUser?.role,
    onEdit: (item) => openFormModal(item),
    onDelete: (id) => setItemToDelete(id),
    onToggleActive: handleToggleActive,
  });

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isLoaded) {
        setInitialLoading(true);
        const data = await fetchUsers(showInactives);
        setUsers(data);
        setLoaded(true);
      }
      setInitialLoading(false);
    }
    load();
  }, [isLoaded, showInactives, setUsers, setLoaded]);

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch = u.username.toLowerCase().includes(term) || u.role.toLowerCase().includes(term) || u.id.toLowerCase().includes(term);
    const matchesStatus = showInactives ? true : u.isActive;
    return matchesSearch && matchesStatus;
  });

  const handleModalSubmit = async (data: UserInput) => {
    await handleEditSubmit(data);
  };

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
                placeholder="Buscar usuarios por ID, nombre o rol..."
                className="h-11"
              />
              <ToggleFilter
                id="showInactives"
                checked={showInactives}
                onChange={setShowInactives}
                label="Ver Inactivos"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => syncData(true)}
                disabled={isPending}
                title="Sincronizar"
                className="h-11 w-11"
              >
                <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="primary"
                onClick={() => openFormModal()}
                leftIcon={<Plus className="w-5 h-5" />}
                className="h-11"
              >
                Ingresar Usuario
              </Button>
            </div>
          </div>

          {globalMessage && <div className={`shrink-0 mb-4 p-4 rounded-lg border text-sm font-bold animate-in slide-in-from-top-2 duration-300 shadow-sm ${globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'}`}>{globalMessage.text}</div>}

          <VirtualizedDataTable
            columns={columns}
            data={filteredUsers}
            isLoading={isPending}
            emptyMessage="No se han encontrado usuarios con credenciales activas."
          />

          <UserModal
            isOpen={isFormModalOpen || !!editingItem}
            onClose={() => {
              setIsFormModalOpen(false);
              closeFormModal();
            }}
            onSubmit={handleModalSubmit}
            editingItem={editingItem || null}
            serverError={serverError}
            isPending={isPending}
          />

          <ConfirmModal
            isOpen={!!itemToDelete}
            onClose={() => setItemToDelete(null)}
            onConfirm={() => handleDelete(itemToDelete as string)}
            title="Retirar Acceso"
            description="¿Estás seguro de que deseas eliminar permanentemente estas credenciales? El usuario perderá acceso inmediato a la plataforma."
            submitLabel="Eliminar Acceso Permanente"
            isPending={isPending}
          />
        </>
      )}
    </div>
  );
}
