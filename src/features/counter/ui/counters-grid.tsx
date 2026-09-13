'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Minus, ClipboardList } from 'lucide-react';
import { counterCreateSchema, type CounterInput, type CounterDef, type CounterUpdateInput } from '@/features/counter/domain/counter.schema';
import { useCounterStore } from '@/features/counter/store/counter.store';
import { fetchCounters, createCounterAction, updateCounterAction, deleteCounterAction, decrementCounterAction } from '@/features/counter/actions/counter.actions';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';

interface CountersGridProps {
  /** 'manage': Estadísticas (admin) — crear/editar/borrar. 'decrement': Stock (admin/vendedor) — solo restar. */
  mode: 'manage' | 'decrement';
}

/**
 * "Anotadores": recordatorios simples de título + cantidad, sin vínculo a ninguna otra tabla.
 * Un mismo componente para las dos vistas — el modo lo decide la página que lo usa, no el rol.
 */
export function CountersGrid({ mode }: CountersGridProps) {
  const canManage = mode === 'manage';
  const { counters, setCounters, isLoaded } = useCounterStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage } = useEntityManager<CounterDef>();

  const { isPending, handleEditSubmit, handleDelete } = useEntityActions<CounterDef, CounterInput, CounterUpdateInput>({
    handlers: { fetchData: fetchCounters, createAction: createCounterAction, updateAction: updateCounterAction, deleteAction: deleteCounterAction },
    setStoreData: setCounters,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive: false,
  });

  useAutoSync({ isLoaded, sync: () => fetchCounters().then(setCounters) });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<CounterInput>({ resolver: zodResolver(counterCreateSchema) });

  const handleEditClick = (item?: CounterDef) => {
    openFormModal(item);
    reset(item ? { title: item.title, quantity: item.quantity } : { title: '', quantity: 0 });
  };

  // Flujo de "restar cantidad" (vendedor/admin en Stock): confirmación + cantidad a restar.
  const [decrementTarget, setDecrementTarget] = useState<CounterDef | null>(null);
  const [decrementAmount, setDecrementAmount] = useState('');
  const [decrementError, setDecrementError] = useState<string | null>(null);
  const [decrementPending, startDecrementTransition] = useTransition();

  const openDecrement = (item: CounterDef) => {
    setDecrementTarget(item);
    setDecrementAmount('');
    setDecrementError(null);
  };

  const confirmDecrement = () => {
    if (!decrementTarget) return;
    const amount = parseInt(decrementAmount, 10);
    if (!amount || amount <= 0) {
      setDecrementError('Ingresá una cantidad válida.');
      return;
    }
    setDecrementError(null);
    startDecrementTransition(async () => {
      const result = await decrementCounterAction({ id: decrementTarget.id!, amount });
      if (!result.success) {
        setDecrementError(result.error);
        return;
      }
      showGlobalMessage('success', result.message || 'Anotador actualizado.');
      setDecrementTarget(null);
      const resp = await fetchCounters();
      setCounters(resp);
    });
  };

  // El vendedor no debe ver una sección vacía; el admin sí, para poder crear el primero.
  if (!canManage && counters.length === 0) return null;

  return (
    <div className='shrink-0 pt-4 mt-3 border-t border-zinc-200 dark:border-zinc-800'>
      <h3 className='text-sm font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2'>
        <ClipboardList className='w-4 h-4' /> Anotadores
      </h3>

      <GlobalMessage message={globalMessage} />

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4'>
        {counters.map((c) => (
          <div key={c.id} className='relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 h-32 flex flex-col'>
            <span className='absolute top-3 left-3 max-w-[65%] text-[14.4px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 truncate' title={c.title}>
              {c.title}
            </span>

            {canManage && (
              <div className='absolute top-2 right-2 flex items-center gap-1'>
                <button
                  onClick={() => handleEditClick(c)}
                  className='p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
                  title='Editar'
                >
                  <Pencil className='w-3.5 h-3.5' />
                </button>
                <button
                  onClick={() => setItemToDelete(c.id!)}
                  className='p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
                  title='Eliminar'
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </button>
              </div>
            )}

            <div className='flex-1 flex items-center justify-center'>
              <span className='text-6xl font-black text-zinc-900 dark:text-zinc-100'>{c.quantity}</span>
            </div>

            {!canManage && (
              <button
                onClick={() => openDecrement(c)}
                className='absolute bottom-2 right-2 p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors'
                title='Restar cantidad'
              >
                <Minus className='w-4 h-4' />
              </button>
            )}
          </div>
        ))}

        {canManage && (
          <button
            onClick={() => handleEditClick()}
            className='h-32 flex items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors'
            title='Nuevo anotador'
          >
            <Plus className='w-8 h-8' />
          </button>
        )}
      </div>

      {canManage && (
        <>
          <ResponsiveModal
            isOpen={isModalOpen}
            onClose={closeFormModal}
            title={editingItem ? 'Editar Anotador' : 'Nuevo Anotador'}
            icon={<ClipboardList className='w-5 h-5 text-zinc-500' />}
            width='sm'
            onSubmit={handleSubmit((data) => {
              if (editingItem) {
                const changedData: any = { version: editingItem.version };
                let hasChanges = false;
                Object.keys(dirtyFields).forEach((key) => {
                  changedData[key as keyof CounterInput] = data[key as keyof CounterInput];
                  hasChanges = true;
                });
                if (!hasChanges) {
                  closeFormModal();
                  return;
                }
                handleEditSubmit(changedData);
              } else {
                handleEditSubmit(data);
              }
            })}
            submitLabel={editingItem ? 'Actualizar' : 'Crear'}
            isPending={isPending}
          >
            <ErrorAlert error={serverError} />
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Nombre</label>
                <input
                  type='text'
                  placeholder='Nombre'
                  {...register('title')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.title ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.title && <p className='text-zinc-500 text-xs mt-1.5'>{errors.title.message}</p>}
              </div>
              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Cantidad</label>
                <input
                  type='number'
                  min={0}
                  {...register('quantity')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.quantity ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
                {errors.quantity && <p className='text-zinc-500 text-xs mt-1.5'>{errors.quantity.message}</p>}
              </div>
            </div>
          </ResponsiveModal>

          <ConfirmModal
            isOpen={!!itemToDelete}
            onClose={() => setItemToDelete(null)}
            onConfirm={() => handleDelete(itemToDelete as string)}
            title='Eliminar Anotador'
            description='Esta acción es permanente y eliminará el anotador.'
            submitLabel='Eliminar'
            isPending={isPending}
          />
        </>
      )}

      {!canManage && (
        <ConfirmModal
          isOpen={!!decrementTarget}
          onClose={() => setDecrementTarget(null)}
          onConfirm={confirmDecrement}
          title={`Restar de "${decrementTarget?.title ?? ''}"`}
          description={
            <div className='space-y-3'>
              <p>
                Cantidad disponible: <strong>{decrementTarget?.quantity ?? 0}</strong>
              </p>
              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>¿Cuánto querés restar?</label>
                <input
                  type='number'
                  min={1}
                  autoFocus
                  value={decrementAmount}
                  onChange={(e) => setDecrementAmount(e.target.value)}
                  className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 transition-colors'
                />
              </div>
              {decrementError && <p className='text-red-600 dark:text-red-400 text-xs font-medium'>{decrementError}</p>}
            </div>
          }
          submitLabel='Restar'
          isPending={decrementPending}
        />
      )}
    </div>
  );
}
