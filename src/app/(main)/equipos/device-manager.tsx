'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, X, MonitorSmartphone, Search, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { deviceSchema, type DeviceInput, type DeviceDef } from '@/schemas/device.schema';
import {
  createDeviceAction,
  updateDeviceAction,
  deleteDeviceAction,
  fetchDevices,
  toggleDeviceActiveAction,
} from '@/server/actions/device.actions';
import { useAuthStore } from '@/stores/auth.store';

export function DeviceManager({ initialData }: { initialData: DeviceDef[] }) {
  const role = useAuthStore((s) => s.user?.role);
  const [devices, setDevices] = useState<DeviceDef[]>(initialData);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeviceDef | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeviceInput>({
    resolver: zodResolver(deviceSchema),
  });

  const loadData = async (inactive = showInactive) => {
    startTransition(async () => {
      const resp = await fetchDevices(inactive, search);
      setDevices(resp);
    });
  };

  const filteredDevices = devices.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (dev?: DeviceDef) => {
    setServerError(null);
    if (dev) {
      setEditingItem(dev);
      reset({ name: dev.name });
    } else {
      setEditingItem(null);
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
    const action = editingItem ? updateDeviceAction(editingItem.id, data) : createDeviceAction(data);
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

  const handleToggleActive = async (item: DeviceDef) => {
    const nextStatus = !item.isActive;
    const result = await toggleDeviceActiveAction(item.id, nextStatus);
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
    const result = await deleteDeviceAction(id);
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
      <div className='flex flex-col sm:flex-row gap-4 mb-6 shrink-0'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
          <input
            type='text'
            placeholder='Buscar modelos de equipos...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors'
          />
        </div>
        
        <div className='flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shrink-0 h-10'>
          <input 
            type='checkbox' 
            id='showInactive' 
            checked={showInactive} 
            onChange={(e) => {
              const val = e.target.checked;
              setShowInactive(val);
              loadData(val);
            }} 
            className='w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300'
          />
          <label htmlFor='showInactive' className='text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none'>
            Inactivos
          </label>
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

      {globalMessage && (
        <div className={`shrink-0 mb-4 p-4 rounded-lg border text-sm shadow-sm ${globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {globalMessage.text}
        </div>
      )}

      <Table headers={['Modelo y Categoría', 'Acciones']} isPending={isPending}>
        {filteredDevices.map((dev) => (
          <tr key={dev.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors'>
            <td className='px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100'>
              <div className='flex items-center gap-2'>
                {dev.name}
                {!dev.isActive && <span className='px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
              </div>
            </td>
            {role === 'admin' && (
              <td className='px-6 py-4 flex gap-2 justify-end'>
                <button 
                  onClick={() => handleToggleActive(dev)} 
                  className={`p-2 rounded-lg transition ${dev.isActive ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'}`} 
                  title={dev.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Plus className={`w-4 h-4 ${dev.isActive ? 'rotate-45' : ''}`} />
                </button>
                <button onClick={() => openModal(dev)} className='p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 rounded-lg transition' title='Editar Ficha'>
                  <Edit className='w-4 h-4' />
                </button>
                <button onClick={() => setItemToDelete(dev.id)} className='p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition' title='Eliminar'>
                  <Trash2 className='w-4 h-4' />
                </button>
              </td>
            )}
          </tr>
        ))}
        {filteredDevices.length === 0 && !isPending && (
          <tr><td colSpan={2} className='px-6 py-12 text-center text-zinc-400'>No hay equipos registrados</td></tr>
        )}
      </Table>

      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4'>
          <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800'>
            <div className='flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50'>
              <h3 className='text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2'>
                <MonitorSmartphone className='w-6 h-6 text-indigo-500' />
                {editingItem ? 'Actualizar Equipo' : 'Nuevo Modelo en Catálogo'}
              </h3>
              <button onClick={closeModal} className='text-zinc-500 hover:text-zinc-800 p-1'><X className='w-6 h-6' /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='p-8 space-y-6'>
              {serverError && <div className='p-4 bg-red-50 text-red-600 text-sm font-bold uppercase rounded-lg border border-red-200'>{serverError}</div>}
              <div>
                <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Nombre / Modelo / Marca</label>
                <input
                  type='text'
                  {...register('name')}
                  autoFocus
                  placeholder='Ej: iPhone 15 Pro Max'
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.name && <p className='text-red-500 text-xs mt-1.5'>{errors.name.message}</p>}
              </div>
              <div className='flex justify-end pt-4 gap-3 border-t border-zinc-200 dark:border-zinc-800 mt-6'>
                <Button variant='ghost' type='button' onClick={closeModal}>Cancelar</Button>
                <Button type='submit' disabled={isPending}>Fichar Equipo</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm'>
          <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 p-6'>
            <div className='flex items-center text-red-500 mb-4'>
              <Trash2 className='w-6 h-6 mr-3' />
              <h3 className='text-lg font-bold'>Eliminar Modelo</h3>
            </div>
            <p className='text-zinc-500 dark:text-zinc-400 text-sm mb-6'>¿Confirmar eliminación física de este catálogo? Esta acción no se puede deshacer.</p>
            <div className='flex justify-end gap-3'>
              <button onClick={() => setItemToDelete(null)} className='px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg'>Cancelar</button>
              <button onClick={confirmDelete} className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium'>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
