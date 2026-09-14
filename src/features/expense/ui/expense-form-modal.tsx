'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Receipt, DollarSign } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ErrorAlert } from '@/components/ui/alert';
import { Combobox } from '@/components/ui/combobox';
import { TwoOptionToggle } from '@/components/ui/two-option-toggle';
import { blockInvalidPriceKey } from '@/lib/utils';
import { expenseCreateSchema, type ExpenseInput, type ExpenseUpdateInput } from '@/features/expense/domain/expense.schema';
import type { ExpenseRow } from '@/features/expense/domain/expense-dashboard.types';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import { TEST_IDS } from '@/constants/test-ids';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseInput | ExpenseUpdateInput) => void;
  editingItem?: ExpenseRow | null;
  serverError?: string | null;
  isPending?: boolean;
  providers: ProviderDef[];
}

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Normaliza `date` (Date o string ISO) al valor 'YYYY-MM-DD' que espera un <input type="date">. */
function toDateInputValue(d: string | Date): string {
  const iso = typeof d === 'string' ? d : d.toISOString();
  return iso.slice(0, 10);
}

export function ExpenseFormModal({ isOpen, onClose, onSubmit, editingItem, serverError, isPending, providers }: ExpenseFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseCreateSchema),
  });

  const section = watch('section');
  const providerId = watch('providerId');

  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      reset({
        section: editingItem.section,
        providerId: editingItem.providerId,
        pointOfSale: editingItem.pointOfSale,
        receiptNumber: editingItem.receiptNumber,
        amount: editingItem.amount as any,
        date: toDateInputValue(editingItem.date),
      });
    } else {
      reset({
        section: 'tech',
        providerId: '',
        pointOfSale: '',
        receiptNumber: '',
        amount: '' as any,
        date: todayStr(),
      });
    }
  }, [isOpen, editingItem, reset]);

  const handleFormSubmit = (data: ExpenseInput) => {
    if (editingItem) {
      onSubmit({ ...data, version: editingItem.version } as ExpenseUpdateInput);
    } else {
      onSubmit(data);
    }
  };

  // Comodidad de carga: si el admin tipea menos dígitos de los requeridos, se completa con ceros
  // a la izquierda al salir del campo (formato AFIP real, ej. "1" -> "0001").
  const padOnBlur = (field: 'pointOfSale' | 'receiptNumber', length: number) => (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (/^\d+$/.test(v) && v.length > 0 && v.length < length) {
      setValue(field, v.padStart(length, '0'), { shouldValidate: true });
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Editar Boleta' : 'Ingresar Nueva Boleta'}
      icon={<Receipt className='w-6 h-6 text-zinc-500' />}
      width='md'
      onSubmit={handleSubmit(handleFormSubmit)}
      submitLabel={editingItem ? 'Guardar Cambios' : 'Cargar Boleta'}
      isPending={isPending}
      submitTestId={TEST_IDS.general.btnSubmitModal}
      cancelTestId={TEST_IDS.general.btnCancelModal}
    >
      <ErrorAlert error={serverError} />
      <div className='space-y-5'>
        <TwoOptionToggle
          label='Tipo'
          value={section || 'tech'}
          options={[
            { value: 'tech', label: 'Tech' },
            { value: 'libreria', label: 'Librería' },
          ]}
          onChange={(val) => setValue('section', val, { shouldValidate: true })}
        />

        <div>
          <label className='block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300'>Número de boleta</label>
          <div className='flex items-center gap-2'>
            <input
              type='text'
              inputMode='numeric'
              maxLength={4}
              placeholder='0001'
              {...register('pointOfSale', { onBlur: padOnBlur('pointOfSale', 4) })}
              className='w-24 px-3 py-2 text-center border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
            />
            <span className='text-zinc-400 font-bold'>-</span>
            <input
              type='text'
              inputMode='numeric'
              maxLength={8}
              placeholder='00000001'
              {...register('receiptNumber', { onBlur: padOnBlur('receiptNumber', 8) })}
              className='flex-1 px-3 py-2 text-center border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
            />
          </div>
          {(errors.pointOfSale || errors.receiptNumber) && <p className='text-zinc-500 text-xs mt-1'>{errors.pointOfSale?.message || errors.receiptNumber?.message}</p>}
        </div>

        <div>
          <label className='block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300'>Importe ($)</label>
          <div className='relative'>
            <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
            <input
              type='text'
              inputMode='decimal'
              {...register('amount')}
              onKeyDown={blockInvalidPriceKey}
              className='w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
            />
          </div>
          {errors.amount && <p className='text-zinc-500 text-xs mt-1'>{errors.amount.message}</p>}
        </div>

        <div>
          <label className='block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300'>Fecha</label>
          <input
            type='date'
            {...register('date')}
            className='w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
          />
          {errors.date && <p className='text-zinc-500 text-xs mt-1'>{errors.date.message}</p>}
        </div>

        <div>
          <label className='block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300'>Proveedor</label>
          <Combobox
            options={providers.filter((p) => p.isActive || p.id === editingItem?.providerId).map((p) => ({ id: p.id, name: p.name }))}
            value={providerId || ''}
            onChange={(val) => setValue('providerId', val, { shouldValidate: true })}
            placeholder='Seleccionar proveedor'
            emptyMessage='No hay proveedores cargados todavía.'
          />
          {errors.providerId && <p className='text-zinc-500 text-xs mt-1'>{errors.providerId.message}</p>}
        </div>
      </div>
    </ResponsiveModal>
  );
}
