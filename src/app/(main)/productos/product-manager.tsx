'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, Edit, Trash2, X, DollarSign, PackageOpen } from 'lucide-react';
import { productSchema, type ProductInput } from '@/schemas/product.schema';
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  fetchProducts,
} from '@/server/actions/product.actions';
import { useAuthStore } from '@/stores/auth.store';

type EnrichedProduct = {
  id: string;
  description: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  deviceId: string;
  providerId: string;
  device?: { id: string; name: string };
  provider?: { id: string; name: string };
};

type OptionDef = { id: string; name: string };

export function ProductManager({
  initialData,
  devices,
  suppliers,
}: {
  initialData: EnrichedProduct[];
  devices: OptionDef[];
  suppliers: OptionDef[];
}) {
  const role = useAuthStore((s) => s.user?.role);
  const [products, setProducts] = useState<EnrichedProduct[]>(initialData);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EnrichedProduct | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { stock: 1, purchasePrice: 0, salePrice: 0 },
  });

  const loadData = async (query: string = '') => {
    startTransition(async () => {
      const resp = await fetchProducts(query);
      setProducts(resp as unknown as EnrichedProduct[]);
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    loadData(val);
  };

  const openModal = (item?: EnrichedProduct) => {
    setServerError(null);
    if (item) {
      setEditingItem(item);
      reset({
        deviceId: item.deviceId,
        providerId: item.providerId,
        description: item.description || '',
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice,
        stock: item.stock,
      });
    } else {
      setEditingItem(null);
      reset({
        deviceId: '',
        providerId: '',
        description: '',
        purchasePrice: 0,
        salePrice: 0,
        stock: 1,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data: ProductInput) => {
    setServerError(null);
    const action = editingItem ? updateProductAction(editingItem.id!, data) : createProductAction(data);
    const result = await action;

    if (!result.success) {
      setServerError(result.message);
      return;
    }

    closeModal();
    setGlobalMessage({ type: 'success', text: result.message });
    setTimeout(() => setGlobalMessage(null), 3000);
    loadData(search);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);

    const result = await deleteProductAction(id);
    if (!result.success) {
      setGlobalMessage({ type: 'error', text: result.message });
      setTimeout(() => setGlobalMessage(null), 4000);
    } else {
      setGlobalMessage({ type: 'success', text: result.message });
      setTimeout(() => setGlobalMessage(null), 3000);
      loadData(search);
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
            placeholder='Buscar productos por descripción o detalles...'
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
            Ingresar Stock
          </button>
        )}
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
              <th scope='col' className='px-6 py-4'>Equipo y Detalle</th>
              <th scope='col' className='px-6 py-4'>Stock</th>
              <th scope='col' className='px-6 py-4'>Precio Público</th>
              {role === 'admin' && <th scope='col' className='px-6 py-4'>Costo (Admin)</th>}
              <th scope='col' className='px-6 py-4'>Proveedor</th>
              {role === 'admin' && <th scope='col' className='px-6 py-4 text-right'>Acciones</th>}
            </tr>
          </thead>
          <tbody className={`divide-y divide-zinc-200 dark:divide-zinc-800 ${isPending ? 'opacity-50' : ''}`}>
            {products.map((p) => (
              <tr key={p.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors'>
                <td className='px-6 py-4'>
                  <div className='font-bold text-zinc-900 dark:text-zinc-100'>{p.device?.name || '---'}</div>
                  <div className='text-xs text-zinc-500 mt-0.5'>{p.description}</div>
                </td>
                <td className='px-6 py-4'>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.stock > 5 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : p.stock > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {p.stock} Uds
                  </span>
                </td>
                <td className='px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400'>
                  ${p.salePrice}
                </td>
                {role === 'admin' && (
                  <td className='px-6 py-4 font-medium text-zinc-500'>
                    ${p.purchasePrice}
                  </td>
                )}
                <td className='px-6 py-4 text-zinc-500'>
                  {p.provider?.name || '---'}
                </td>
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
            {products.length === 0 && !isPending && (
              <tr>
                <td colSpan={role === 'admin' ? 6 : 4} className='px-6 py-8 text-center'>
                  No hay productos registrados en el inventario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 overflow-y-auto'>
          <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 m-auto'>
            <div className='flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50'>
              <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2'>
                <PackageOpen className='w-5 h-5 text-indigo-500'/>
                {editingItem ? 'Editar Producto / Stock' : 'Añadir Nuevo Lote de Stock'}
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

              <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                <div className='col-span-1 md:col-span-2'>
                  <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Modelo / Equipo</label>
                  <select
                    {...register('deviceId')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${
                      errors.deviceId ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    <option value=''>-- Seleccionar Equipo Matrix --</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {errors.deviceId && <p className='text-red-500 text-xs mt-1.5'>{errors.deviceId.message}</p>}
                </div>

                <div className='col-span-1 md:col-span-2'>
                  <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Proveedor Entrante</label>
                  <select
                    {...register('providerId')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${
                      errors.providerId ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    <option value=''>-- Seleccionar Proveedor --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.providerId && <p className='text-red-500 text-xs mt-1.5'>{errors.providerId.message}</p>}
                </div>

                <div className='col-span-1 md:col-span-2'>
                  <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Descripción Física (Color, Memoria)</label>
                  <input
                    type='text'
                    {...register('description')}
                    placeholder='Ej: 256GB - Color Titanio Negro'
                    className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Precio de Costo ($)</label>
                  <div className='relative'>
                    <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
                    <input
                      type='number'
                      step='0.01'
                      {...register('purchasePrice', { valueAsNumber: true })}
                      className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.purchasePrice ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                    />
                  </div>
                  {errors.purchasePrice && <p className='text-red-500 text-xs mt-1.5'>{errors.purchasePrice.message}</p>}
                </div>

                <div>
                  <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Precio de Venta ($)</label>
                  <div className='relative'>
                    <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-emerald-500' />
                    <input
                      type='number'
                      step='0.01'
                      {...register('salePrice', { valueAsNumber: true })}
                      className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.salePrice ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                    />
                  </div>
                  {errors.salePrice && <p className='text-red-500 text-xs mt-1.5'>{errors.salePrice.message}</p>}
                </div>

                <div>
                  <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Stock Inicial Lote</label>
                  <input
                    type='number'
                    {...register('stock', { valueAsNumber: true })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.stock ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                  />
                  {errors.stock && <p className='text-red-500 text-xs mt-1.5'>{errors.stock.message}</p>}
                </div>
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
                  Confirmar Inventario
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
              <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Borrar Inventario</h3>
            </div>
            <p className='text-zinc-500 dark:text-zinc-400 text-sm mb-6'>
              ¿Deseas eliminar físicamente este lote del inventario? Toda la trazabilidad de esta ID se perderá.
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
                Purgar Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
