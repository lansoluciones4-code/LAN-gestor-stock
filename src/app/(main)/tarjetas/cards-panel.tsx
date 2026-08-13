'use client';

import { useState, useMemo } from 'react';
import { Plus, CreditCard as CreditCardIcon, RefreshCcw, Percent } from 'lucide-react';
import { type CardInput, type CardDef, type CardUpdateInput } from '@/features/card/domain/card.schema';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCardStore } from '@/features/card/store/card.store';
import { fetchCards, createCardAction, updateCardAction, deleteCardAction, toggleCardActiveAction } from '@/features/card/actions/card.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { useEntityManager } from '@/hooks/use-entity-manager';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { ResponsiveModal, ConfirmModal } from '@/components/ui/responsive-modal';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { Button } from '@/components/ui/button';
import { getCardColumns } from '@/config/tables/card-columns';
import { renderCardCard } from '@/config/cards/credit-options-card';
import { normalizeForSearch, isValidDecimal } from '@/lib/utils';
import { ErrorAlert, GlobalMessage } from '@/components/ui/alert';
import { TEST_IDS } from '@/constants/test-ids';

const INSTALLMENT_OPTIONS = [1, 3, 6, 12] as const;

interface InstallmentFormRow {
  enabled: boolean;
  interestPercentage: string;
}

type InstallmentFormState = Record<(typeof INSTALLMENT_OPTIONS)[number], InstallmentFormRow>;

const emptyInstallmentForm = (): InstallmentFormState => ({
  1: { enabled: false, interestPercentage: '' },
  3: { enabled: false, interestPercentage: '' },
  6: { enabled: false, interestPercentage: '' },
  12: { enabled: false, interestPercentage: '' },
});

export function CardsPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [showInactive, setShowInactive] = useState(false);
  const { cards, setCards, isLoaded } = useCardStore();

  const { isModalOpen, editingItem, openFormModal, closeFormModal, itemToDelete, setItemToDelete, serverError, setServerError, globalMessage, showGlobalMessage, search, setSearch } =
    useEntityManager<CardDef>();

  const { isPending, syncData, handleEditSubmit, handleDelete, handleToggleActive } = useEntityActions<CardDef, CardInput, CardUpdateInput>({
    handlers: { fetchData: fetchCards, createAction: createCardAction, updateAction: updateCardAction, deleteAction: deleteCardAction, toggleActiveAction: toggleCardActiveAction },
    setStoreData: setCards,
    onSuccessMessage: (msg) => showGlobalMessage('success', msg),
    onErrorMessage: (msg) => showGlobalMessage('error', msg),
    closeFormModal,
    setServerError,
    setItemToDelete,
    editingItem,
    showInactive,
  });

  const { initialLoading } = useAutoSync({ isLoaded, sync: () => fetchCards().then(setCards) });

  const [name, setName] = useState('');
  const [installmentForm, setInstallmentForm] = useState<InstallmentFormState>(emptyInstallmentForm());
  const [formError, setFormError] = useState<string | null>(null);

  const filteredCards = useMemo(
    () =>
      cards
        .filter((c) => {
          const terms = normalizeForSearch(search).split(/\s+/);
          const text = normalizeForSearch(c.name);
          return terms.every((w) => text.includes(w)) && (showInactive || c.isActive);
        })
        .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)),
    [cards, search, showInactive]
  );

  const handleEditClick = (item?: CardDef) => {
    openFormModal(item);
    setFormError(null);
    setName(item?.name ?? '');
    const next = emptyInstallmentForm();
    if (item) {
      for (const i of item.installments) {
        if (i.installments in next) {
          next[i.installments as keyof InstallmentFormState] = { enabled: true, interestPercentage: String(i.interestPercentage).replace('.', ',') };
        }
      }
    }
    setInstallmentForm(next);
  };

  const columns = getCardColumns({ role, onEdit: handleEditClick, onToggleActive: handleToggleActive, onDelete: setItemToDelete });

  const handleSubmit = () => {
    setFormError(null);
    if (name.trim().length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    const enabledCounts = INSTALLMENT_OPTIONS.filter((n) => installmentForm[n].enabled);
    if (enabledCounts.length === 0) {
      setFormError('Debés habilitar al menos una cantidad de cuotas');
      return;
    }

    const installments: CardInput['installments'] = [];
    for (const n of enabledCounts) {
      const raw = installmentForm[n].interestPercentage.replace(',', '.');
      const value = Number(raw);
      if (raw === '' || isNaN(value) || value < 0) {
        setFormError(`El porcentaje de ${n} cuotas es inválido`);
        return;
      }
      if (!isValidDecimal(raw, 2)) {
        setFormError(`El porcentaje de ${n} cuotas no puede tener más de 2 decimales`);
        return;
      }
      installments.push({ installments: n, interestPercentage: value });
    }

    if (editingItem) {
      handleEditSubmit({ version: editingItem.version, name, installments } as CardUpdateInput);
    } else {
      handleEditSubmit({ name, installments } as CardInput);
    }
  };

  if (initialLoading) return <div className='mt-8 animate-in fade-in duration-500'><TableSkeleton /></div>;

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder='Buscar tarjeta por nombre...'
        searchPlaceholderMobile='Buscar tarjetas...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={<ToggleFilter id='showInactive-card' checked={showInactive} onChange={setShowInactive} label='Ver Inactivos' data-testid={TEST_IDS.general.btnVerOcultos} />}
        sync={
          role === 'admin' && (
            <Button variant='secondary' size='icon' onClick={() => syncData(true)} disabled={isPending} title='Sincronizar Datos' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
              <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
            </Button>
          )
        }
        actions={
          role === 'admin' && (
            <Button variant='primary' onClick={() => handleEditClick()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
              <span className='hidden sm:inline'>Nueva tarjeta</span>
              <span className='sm:hidden'>Nueva</span>
            </Button>
          )
        }
      />

      <GlobalMessage message={globalMessage} />

      <ResponsivePanelView
        columns={columns}
        data={filteredCards}
        isLoading={isPending}
        emptyMessage='No se han encontrado tarjetas.'
        renderCard={renderCardCard({ role, onEdit: handleEditClick, onToggleActive: handleToggleActive, onDelete: setItemToDelete })}
      />

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingItem ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
        icon={<CreditCardIcon className='w-5 h-5 text-zinc-500' />}
        width='md'
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        submitLabel={editingItem ? 'Actualizar Tarjeta' : 'Registrar Tarjeta'}
        isPending={isPending}
      >
        <ErrorAlert error={serverError} />
        {formError && <p className='text-zinc-500 text-xs mb-2'>{formError}</p>}
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Nombre de tarjeta</label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors border-zinc-300 dark:border-zinc-700'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Cuotas habilitadas y recargo (%)</label>
            <div className='space-y-2'>
              {INSTALLMENT_OPTIONS.map((n) => {
                const row = installmentForm[n];
                return (
                  <div
                    key={n}
                    className='flex items-center gap-3 p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950'
                  >
                    <label className='flex items-center gap-2 shrink-0 w-24 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={row.enabled}
                        onChange={(e) => setInstallmentForm((prev) => ({ ...prev, [n]: { ...prev[n], enabled: e.target.checked } }))}
                        className='w-4 h-4'
                      />
                      <span className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>
                        {n} {n === 1 ? 'pago' : 'cuotas'}
                      </span>
                    </label>
                    {row.enabled && (
                      <div className='relative flex-1'>
                        <input
                          type='text'
                          inputMode='decimal'
                          placeholder='0'
                          value={row.interestPercentage}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9,]/g, '');
                            setInstallmentForm((prev) => ({ ...prev, [n]: { ...prev[n], interestPercentage: val } }));
                          }}
                          className='w-full pl-3 pr-8 py-1.5 border rounded-lg bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm'
                        />
                        <Percent className='absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400' />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ResponsiveModal>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleDelete(itemToDelete as string)}
        title='Eliminar Tarjeta'
        description='Esta acción es permanente y eliminará el registro de la base de datos.'
        submitLabel='Eliminar'
        isPending={isPending}
      />
    </div>
  );
}
