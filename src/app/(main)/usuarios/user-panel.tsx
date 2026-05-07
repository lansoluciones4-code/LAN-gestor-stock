'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { type UserInput, type UserDef, type UserUpdateInput } from '@/features/user/domain/user.schema';
import { createUserAction, updateUserAction, deleteUserAction, fetchUsers, toggleUserActiveAction } from '@/features/user/actions/user.actions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useUserStore } from '@/features/user/store/user.store';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { getUserColumns } from '@/config/tables/user-columns';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { normalizeForSearch } from '@/lib/utils';
import { UserModal } from '@/features/user/ui/components/user-modal';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';
import { renderUserCard } from '@/config/cards/user-card';

export function UserPanel() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.user?.role);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showInactives, setShowInactives] = useState(false);
  const { users, setUsers, isLoaded } = useUserStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<UserDef>();

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<UserDef, UserInput, UserUpdateInput>({
    handlers: { fetchData: fetchUsers, createAction: createUserAction, updateAction: updateUserAction, deleteAction: deleteUserAction, toggleActiveAction: toggleUserActiveAction },
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
    if (isLoaded) { setInitialLoading(false); return; }
    setInitialLoading(true);
    fetchUsers().then(setUsers).finally(() => setInitialLoading(false));
  }, [isLoaded, setUsers]);

  const filteredUsers = useMemo(() =>
    users
      .filter((u) => {
        const terms = normalizeForSearch(search).split(/\s+/);
        const roleDisplay = u.role === 'admin' ? 'administrador' : 'vendedor';
        const text = [normalizeForSearch(u.username), normalizeForSearch(u.role), normalizeForSearch(roleDisplay)].join(' ');
        return terms.every((w) => text.includes(w)) && (showInactives || u.isActive);
      })
      .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)),
    [users, search, showInactives]
  );

  const columns = getUserColumns({ currentUserId, role, onEdit: openFormModal, onDelete: setItemToDelete, onToggleActive: handleToggleActive });

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar usuarios por nombre o rol...'
        searchPlaceholderMobile='Buscar usuarios...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={
          <ToggleFilter id='showInactives-user' checked={showInactives} onChange={setShowInactives} label='Ver Inactivos' data-testid={TEST_IDS.general.btnVerOcultos} />
        }
        sync={
          <Button variant='secondary' size='icon' onClick={() => syncData(true)} disabled={isPending} title='Sincronizar' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        }
        actions={
          <Button onClick={() => openFormModal()} variant='primary' leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
            <span className='hidden sm:inline'>Crear Credencial</span>
            <span className='sm:hidden'>Crear</span>
          </Button>
        }
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredUsers}
        isLoading={isPending}
        emptyMessage='No se han encontrado usuarios con credenciales activas.'
        renderCard={renderUserCard({ onEdit: openFormModal, onDelete: setItemToDelete, onToggleActive: handleToggleActive, currentUserId })}
      />

      <UserModal isOpen={isModalOpen} onClose={closeFormModal} editingItem={editingItem} onSubmit={handleEditSubmit} isPending={isPending} serverError={serverError} />

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleDelete(itemToDelete as string)}
        title='Eliminar Credencial'
        description='Esta acción retirará todos los permisos de acceso de este usuario. Solo se recomienda si la cuenta nunca registró movimientos.'
        submitLabel='Eliminar Acceso'
        isPending={isPending}
      />
    </div>
  );
}
