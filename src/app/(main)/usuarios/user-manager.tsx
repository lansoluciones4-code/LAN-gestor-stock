'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, Edit, Trash2, X, ShieldAlert, UserCog } from 'lucide-react';
import { userSchema, type UserInput, type UserDef } from '@/schemas/user.schema';
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  fetchUsers,
  toggleUserActiveAction,
} from '@/server/actions/user.actions';
import { useAuthStore } from '@/stores/auth.store';


export function UserManager({ initialData }: { initialData: UserDef[] }) {
  const currentSession = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<UserDef[]>(initialData);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showInactive, setShowInactive] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserDef | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'vendedor' },
  });

  const loadData = async (includeInactive = showInactive) => {
    startTransition(async () => {
      const resp = await fetchUsers(includeInactive);
      setUsers(resp);
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return u.username.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
  });

  const openModal = (item?: UserDef) => {
    setServerError(null);
    if (item) {
      setEditingItem(item);
      reset({
        username: item.username,
        role: item.role,
        password: '',
      });
    } else {
      setEditingItem(null);
      reset({
        username: '',
        role: 'vendedor',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data: UserInput) => {
    setServerError(null);
    const action = editingItem ? updateUserAction(editingItem.id, data) : createUserAction(data);
    const result = await action;

    if (!result.success) {
      setServerError(result.message);
      return;
    }

    closeModal();
    setGlobalMessage({ type: 'success', text: result.message });
    setTimeout(() => setGlobalMessage(null), 3000);
    loadData();
  };

  const handleToggleActive = async (item: UserDef) => {
    if (currentSession?.id === item.id) return;
    const nextStatus = !item.isActive;
    const result = await toggleUserActiveAction(item.id, nextStatus);
    if (!result.success) {
      setGlobalMessage({ type: 'error', text: result.message });
      setTimeout(() => setGlobalMessage(null), 4000);
    } else {
      setGlobalMessage({ type: 'success', text: result.message });
      setTimeout(() => setGlobalMessage(null), 3000);
      loadData();
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);

    const result = await deleteUserAction(id);
    if (!result.success) {
      setGlobalMessage({ type: 'error', text: result.message });
      setTimeout(() => setGlobalMessage(null), 5000);
    } else {
      setGlobalMessage({ type: 'success', text: result.message });
      setTimeout(() => setGlobalMessage(null), 3000);
      loadData();
    }
  };

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      {/* Search Header */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6 shrink-0'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
          <input
            type='text'
            placeholder='Buscar usuario por nombre o rol...'
            value={search}
            onChange={handleSearch}
            className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors'
          />
        </div>
        <div className='flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shrink-0'>
          <input 
            type='checkbox' 
            id='showInactive' 
            checked={showInactive} 
            onChange={(e) => {
              const val = e.target.checked;
              setShowInactive(val);
              loadData(val);
            }} 
            className='w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700'
          />
          <label htmlFor='showInactive' className='text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none'>
            Ver Inactivos
          </label>
        </div>
        <button
          onClick={() => openModal()}
          className='flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap'
        >
          <Plus className='w-5 h-5 mr-2' />
          Crear Credencial
        </button>
      </div>

      {globalMessage && (
        <div
          className={`shrink-0 mb-4 p-4 rounded-lg flex items-center shadow-sm text-sm border ${
            globalMessage.type === 'error'
              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30'
              : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'
          }`}
        >
          {globalMessage.text}
        </div>
      )}

      {/* Grid Container */}
      <div className='relative overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 flex-1 bg-white dark:bg-zinc-900 custom-scrollbar'>
        <table className='w-full text-sm text-left text-zinc-600 dark:text-zinc-400'>
          <thead className='sticky top-0 z-10 text-xs uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'>
            <tr>
              <th scope='col' className='px-6 py-4'>Usuario Creado</th>
              <th scope='col' className='px-6 py-4'>Rol Autorizado</th>
              <th scope='col' className='px-6 py-4 text-right'>Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-zinc-200 dark:divide-zinc-800 ${isPending ? 'opacity-50' : ''}`}>
            {filteredUsers.map((u) => (
              <tr key={u.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors'>
                <td className='px-6 py-4'>
                  <div className='font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2'>
                    {u.username}
                    {!u.isActive && <span className='px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase tracking-tighter'>Inactivo</span>}
                    {currentSession?.id === u.id && (
                      <span className='px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] uppercase font-bold ml-2'>
                        Tú
                      </span>
                    )}
                  </div>
                  <div className='text-xs text-zinc-500 mt-1 uppercase font-medium'>
                    ID: {u.id.split('-')[0]}***
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {u.role === 'admin' ? 'Administrador' : 'Vendedor'}
                  </span>
                </td>
                <td className='px-6 py-4 flex gap-2 justify-end items-center'>
                  <button 
                    disabled={currentSession?.id === u.id}
                    onClick={() => handleToggleActive(u)} 
                    className={`p-2 rounded-lg transition ${currentSession?.id === u.id ? 'opacity-20 cursor-not-allowed' : (u.isActive ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10')}`} 
                    title={u.isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
                  >
                    <Plus className={`w-4 h-4 ${u.isActive ? 'rotate-45' : ''}`} />
                  </button>
                  <button onClick={() => openModal(u)} className='p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition' title='Editar Seguridad'>
                    <Edit className='w-4 h-4' />
                  </button>
                  <button onClick={() => setItemToDelete(u.id)} disabled={currentSession?.id === u.id} className={`p-2 rounded-lg transition ${currentSession?.id === u.id ? 'opacity-30 cursor-not-allowed text-zinc-500' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'}`} title='Retirar Acceso'>
                    <Trash2 className='w-4 h-4' />
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && !isPending && (
              <tr>
                <td colSpan={3} className='px-6 py-8 text-center'>
                  No se han encontrado usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 overflow-y-auto'>
          <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 m-auto'>
            <div className='flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50'>
              <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2'>
                <UserCog className='w-5 h-5 text-indigo-500'/>
                {editingItem ? 'Editar Perfil de Seguridad' : 'Nueva Credencial de Acceso'}
              </h3>
              <button onClick={closeModal} className='text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1'>
                <X className='w-5 h-5' />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='p-6 space-y-5'>
              {serverError && (
                <div className='p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/30'>
                  {serverError}
                </div>
              )}

              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Nombre de Usuario</label>
                <input
                  type='text'
                  {...register('username')}
                  placeholder='Ej: juan.perez'
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.username ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.username && <p className='text-red-500 text-xs mt-1.5'>{errors.username.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>
                  Contraseña de Ingreso {editingItem && <span className='text-zinc-500 font-normal'>(Dejar en blanco para no cambiar)</span>}
                </label>
                <input
                  type='password'
                  {...register('password')}
                  placeholder={editingItem ? '******' : 'Escribe una contraseña segura'}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.password ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.password && <p className='text-red-500 text-xs mt-1.5'>{errors.password.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Nivel de Autoridad</label>
                <select
                  {...register('role')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.role ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                >
                  <option value='vendedor'>Vendedor (Acceso Limitado)</option>
                  <option value='admin'>Administrador (Acceso Total)</option>
                </select>
                {errors.role && <p className='text-red-500 text-xs mt-1.5'>{errors.role.message}</p>}
              </div>

              <div className='flex justify-end pt-4 gap-3 border-t border-zinc-200 dark:border-zinc-800 mt-6'>
                <button
                  type='button'
                  onClick={closeModal}
                  className='px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition font-medium'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  className='px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-70 font-medium shadow-sm'
                >
                  Confirmar Credencial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm'>
          <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 p-6'>
            <div className='flex items-center text-red-500 mb-4'>
              <div className='p-2 bg-red-100 dark:bg-red-500/10 rounded-full mr-3'>
                <ShieldAlert className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Inhabilitar Usuario</h3>
            </div>
            <p className='text-zinc-500 dark:text-zinc-400 text-sm mb-6'>
              Esta acción es permanente y eliminará físicamente al usuario. Solo recomendado si nunca operó en el sistema. De lo contrario, usa la opción de desactivar.
            </p>
            <div className='flex justify-end gap-3'>
              <button
                onClick={() => setItemToDelete(null)}
                className='px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors'
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-sm'
              >
                Borrar Acceso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
