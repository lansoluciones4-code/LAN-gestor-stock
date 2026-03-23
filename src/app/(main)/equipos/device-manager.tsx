'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, Edit, Trash2, X } from 'lucide-react';
import { deviceSchema, type DeviceInput } from '@/schemas/device.schema';
import {
  createDeviceAction,
  updateDeviceAction,
  deleteDeviceAction,
  fetchDevices,
} from '@/server/actions/device.actions';
import { useAuthStore } from '@/stores/auth.store';

type DeviceDef = {
  id: string;
  name: string;
  createdAt: Date;
};

export function DeviceManager({ initialData }: { initialData: DeviceDef[] }) {
  const role = useAuthStore((s) => s.user?.role);
  const [devices, setDevices] = useState<DeviceDef[]>(initialData);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceDef | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeviceInput>({
    resolver: zodResolver(deviceSchema),
  });

  const loadData = async (query: string = '') => {
    startTransition(async () => {
      const resp = await fetchDevices(query);
      setDevices(resp as unknown as DeviceDef[]);
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    loadData(val);
  };

  const openModal = (dev?: DeviceDef) => {
    setServerError(null);
    if (dev) {
      setEditingDevice(dev);
      reset({ name: dev.name });
    } else {
      setEditingDevice(null);
      reset({ name: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data: DeviceInput) => {
    setServerError(null);

    const action = editingDevice
      ? updateDeviceAction(editingDevice.id, data)
      : createDeviceAction(data);

    const result = await action;
    if (!result.success) {
      setServerError(result.message);
      return;
    }

    closeModal();
    loadData(search); // re-fetch client side state organically matching search
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este modelo? Esta acción es irreversible.')) return;
    const result = await deleteDeviceAction(id);
    if (!result.success) {
      alert(result.message);
    } else {
      loadData(search);
    }
  };

  return (
    <div className='flex flex-col flex-1'>
      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
          <input
            type='text'
            placeholder='Buscar modelo por nombre...'
            value={search}
            onChange={handleSearch}
            className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-zinc-100 transition-colors'
          />
        </div>
        {role === 'admin' && (
          <button
            onClick={() => openModal()}
            className='flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap'
          >
            <Plus className='w-5 h-5 mr-2' />
            Agregar Equipo
          </button>
        )}
      </div>

      <div className='relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 flex-1 bg-white dark:bg-zinc-900'>
        <table className='w-full text-sm text-left text-zinc-600 dark:text-zinc-400'>
          <thead className='text-xs uppercase bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400'>
            <tr>
              <th scope='col' className='px-6 py-4'>
                Modelo
              </th>
              {role === 'admin' && (
                <th scope='col' className='px-6 py-4 text-right'>
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y divide-zinc-200 dark:divide-zinc-800 ${isPending ? 'opacity-50' : ''}`}>
            {devices.map((dev) => (
              <tr key={dev.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors'>
                <td className='px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100'>
                  {dev.name}
                </td>
                {role === 'admin' && (
                  <td className='px-6 py-4 flex gap-2 justify-end'>
                    <button
                      onClick={() => openModal(dev)}
                      className='p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition'
                      title='Editar'
                    >
                      <Edit className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => handleDelete(dev.id)}
                      className='p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition'
                      title='Eliminar'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {devices.length === 0 && !isPending && (
              <tr>
                <td colSpan={role === 'admin' ? 2 : 1} className='px-6 py-8 text-center'>
                  No se han encontrado equipos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
          <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden'>
            <div className='flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800'>
              <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
                {editingDevice ? 'Editar Equipo' : 'Nuevo Equipo'}
              </h3>
              <button onClick={closeModal} className='text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1'>
                <X className='w-5 h-5' />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='p-5 space-y-4'>
              {serverError && (
                <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg'>
                  {serverError}
                </div>
              )}

              <div>
                <label htmlFor='name' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1'>
                  Nombre del Modelo
                </label>
                <input
                  id='name'
                  type='text'
                  {...register('name')}
                  autoFocus
                  placeholder='Ej: iPhone 15 Pro'
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 dark:border-zinc-700'
                  }`}
                />
                {errors.name && <p className='text-red-500 text-xs mt-1'>{errors.name.message}</p>}
              </div>

              <div className='flex justify-end pt-2 gap-3'>
                <button
                  type='button'
                  onClick={closeModal}
                  className='px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-70'
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
