'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, Edit, Trash2, X, Store } from 'lucide-react';
import { providerSchema, type ProviderInput } from '@/schemas/provider.schema';
import {
  createProviderAction,
  updateProviderAction,
  deleteProviderAction,
  fetchProviders,
} from '@/server/actions/provider.actions';
import { useAuthStore } from '@/stores/auth.store';

type ProviderDef = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export function ProviderManager({ initialData }: { initialData: ProviderDef[] }) {
  const role = useAuthStore((s) => s.user?.role);
  const [providers, setProviders] = useState<ProviderDef[]>(initialData);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProviderDef | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProviderInput>({
    resolver: zodResolver(providerSchema),
  });

  const loadData = async () => {
    startTransition(async () => {
      const resp = await fetchProviders();
      setProviders(resp as unknown as ProviderDef[]);
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredProviders = providers.filter((p) => {
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || (p.email && p.email.toLowerCase().includes(term)) || (p.phone && p.phone.toLowerCase().includes(term));
  });

  const openModal = (item?: ProviderDef) => {
    setServerError(null);
    if (item) {
      setEditingItem(item);
      reset({ name: item.name, phone: item.phone || '', email: item.email || '' });
    } else {
      setEditingItem(null);
      reset({ name: '', phone: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data: ProviderInput) => {
    setServerError(null);
    const action = editingItem ? updateProviderAction(editingItem.id!, data) : createProviderAction(data);
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

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);

    const result = await deleteProviderAction(id);
    if (!result.success) {
      setGlobalMessage({ type: 'error', text: result.message });
      setTimeout(() => setGlobalMessage(null), 4000);
    } else {
      setGlobalMessage({ type: 'success', text: result.message });
      setTimeout(() => setGlobalMessage(null), 3000);
      loadData();
    }
  };

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <div className='flex flex-col sm:flex-row gap-4 mb-6 shrink-0'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
          <input
            type='text'
            placeholder='Buscar distribuidor...'
            value={search}
            onChange={handleSearch}
            className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors'
          />
        </div>
        {role === 'admin' && (
          <button
            onClick={() => openModal()}
            className='flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap'
          >
            <Plus className='w-5 h-5 mr-2' />
            Alta a Proveedor
          </button>
        )}
      </div>

      {globalMessage && (
        <div className={`shrink-0 mb-4 p-4 rounded-lg flex items-center shadow-sm text-sm border ${globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'}`}>
          {globalMessage.text}
        </div>
      )}

      <div className='relative overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 flex-1 bg-white dark:bg-zinc-900 custom-scrollbar'>
        <table className='w-full text-sm text-left text-zinc-600 dark:text-zinc-400'>
          <thead className='sticky top-0 z-10 text-xs uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'>
            <tr>
              <th scope='col' className='px-6 py-4'>Empresa / Mayorista</th>
              <th scope='col' className='px-6 py-4'>Teléfono</th>
              <th scope='col' className='px-6 py-4'>Correo</th>
              {role === 'admin' && <th scope='col' className='px-6 py-4 text-right'>Acciones</th>}
            </tr>
          </thead>
          <tbody className={`divide-y divide-zinc-200 dark:divide-zinc-800 ${isPending ? 'opacity-50' : ''}`}>
            {filteredProviders.map((p) => (
              <tr key={p.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors'>
                <td className='px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100'>
                  {p.name}
                </td>
                <td className='px-6 py-4 text-zinc-500'>{p.phone || '---'}</td>
                <td className='px-6 py-4 text-zinc-500'>{p.email || '---'}</td>
                {role === 'admin' && (
                  <td className='px-6 py-4 flex gap-2 justify-end'>
                    <button onClick={() => openModal(p)} className='p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition' title='Editar'>
                      <Edit className='w-4 h-4' />
                    </button>
                    <button onClick={() => setItemToDelete(p.id)} className='p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition' title='Eliminar'>
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filteredProviders.length === 0 && !isPending && (
              <tr>
                <td colSpan={role === 'admin' ? 4 : 3} className='px-6 py-8 text-center'>
                  No hay proveedores registrados.
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
                <Store className='w-5 h-5 text-indigo-500'/>
                {editingItem ? 'Editar Proveedor' : 'Nuevo Proveedor Local'}
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
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Razón Social / Identificador</label>
                <input
                  type='text'
                  {...register('name')}
                  placeholder='Ej: Accesorios del Sur SRL'
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.name && <p className='text-red-500 text-xs mt-1.5'>{errors.name.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Línea Telefónica Directa</label>
                <input
                  type='text'
                  {...register('phone')}
                  placeholder='Opcional...'
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.phone ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.phone && <p className='text-red-500 text-xs mt-1.5'>{errors.phone.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Correo Electrónico Comercial</label>
                <input
                  type='email'
                  {...register('email')}
                  placeholder='Opcional...'
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.email && <p className='text-red-500 text-xs mt-1.5'>{errors.email.message}</p>}
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
                  Registrar Firma
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
                <Trash2 className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Eliminar Firma Proveedor</h3>
            </div>
            <p className='text-zinc-500 dark:text-zinc-400 text-sm mb-6'>
              Esta acción no se puede deshacer. Cuidado: fallará si tienes stock activo asociado a este proveedor.
            </p>
            <div className='flex justify-end gap-3'>
              <button onClick={() => setItemToDelete(null)} className='px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors'>
                Cancelar
              </button>
              <button onClick={confirmDelete} className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-sm'>
                Desvincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
