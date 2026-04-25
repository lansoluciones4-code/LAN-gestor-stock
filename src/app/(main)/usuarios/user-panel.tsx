'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { SearchBar } from '@/components/ui/search-bar';
import { VirtualizedDataTable } from '@/components/ui/virtualized-data-table';
import { type UserInput, type UserDef, type UserUpdateInput } from '@/schemas/user.schema';
import { createUserAction, updateUserAction, deleteUserAction, fetchUsers, toggleUserActiveAction } from '@/server/actions/user.actions';
import { useAuthStore } from '@/stores/auth.store';
import { useUsersStore } from '@/stores/users.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { getUserColumns } from '@/config/tables/user-columns';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeString } from '@/lib/utils';

import { UserModal } from '@/components/modals/user-modal';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { GlobalMessage } from '@/components/ui/alert';

export function UserPanel() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.user?.role);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const { users, setUsers, isLoaded } = useUsersStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } = useEntityManager<UserDef>();

  const [showInactives, setShowInactives] = useState(false);

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<UserDef, UserInput, UserUpdateInput>({
    handlers: {
      fetchData: fetchUsers,
      createAction: createUserAction,
      updateAction: updateUserAction,
      deleteAction: deleteAction => deleteUserAction(deleteAction),
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

  useEffect(() => {
    async function loadInitial() {
      if (isLoaded) {
        setInitialLoading(false);
        return;
      }
      setInitialLoading(true);
      const res = await fetchUsers();
      setUsers(res);
      setInitialLoading(false);
    }
    loadInitial();
  }, [isLoaded]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const terms = normalizeString(search).split(/\s+/);
        
        // Convert DB roles to Spanish display names for searching
        const roleDisplay = u.role === 'admin' ? 'administrador' : 'vendedor';
        
        const combinedText = [
          normalizeString(u.username),
          normalizeString(u.role),
          normalizeString(roleDisplay)
        ].join(' ');

        const matchesSearch = terms.every(word => combinedText.includes(word));
        const matchesStatus = showInactives ? true : u.isActive;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return 0;
      });
  }, [users, search, showInactives]);

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


  const handleModalSubmit = async (data: UserInput | UserUpdateInput) => {
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
                placeholder="Buscar usuarios por nombre o rol..."
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
                onClick={() => handleEditClick()}
                variant="primary"
                leftIcon={<Plus className="w-5 h-5" />}
                className="h-11"
              >
                Crear Credencial
              </Button>
            </div>
          </div>

          <GlobalMessage message={globalMessage} />

          <VirtualizedDataTable
            columns={columns}
            data={filteredUsers}
            isLoading={isPending}
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
