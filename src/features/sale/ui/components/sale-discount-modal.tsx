import { useState, useEffect } from 'react';
import { Tag, AlertCircle, Percent, DollarSign } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { isValidDecimal } from '@/lib/utils';
import { TEST_IDS } from '@/constants/test-ids';

interface SaleDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  onConfirm: (discounts: { amount: number; percentage: number }) => void;
  isPending?: boolean;
}

export function SaleDiscountModal({ isOpen, onClose, subtotal, onConfirm, isPending }: SaleDiscountModalProps) {
  const [percentage, setPercentage] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPercentage('');
      setAmount('');
      setError(null);
    }
  }, [isOpen, subtotal]);

  // Handle masks
  const handlePercentageChange = (val: string) => {
    if (val === '') {
      setPercentage('');
      setError(null);
      return;
    }

    // No permitimos puntos en el porcentaje
    if (val.includes('.')) return;

    const normalized = val.replace(',', '.');

    // Validar que sea un número válido y que no tenga más de 2 decimales
    if (/^\d*,?\d{0,2}$/.test(val)) {
      const num = Number(normalized);
      if (num >= 0 && num <= 100) {
        setPercentage(val);
        setError(null);
      } else {
        setError('El porcentaje debe estar entre 0 y 100');
      }
    } else {
      // Si llegamos aquí es porque tiene más de 2 decimales o caracteres inválidos
      if (val.includes(',') && val.split(',')[1].length > 2) {
        setError('Máximo 2 decimales');
      } else {
        setError('Formato inválido');
      }
    }
  };

  const handleAmountChange = (val: string) => {
    if (val === '') {
      setAmount('');
      setError(null);
      return;
    }

    // Prohibido el punto
    if (val.includes('.')) return;

    // Solo números y una coma, máximo 2 decimales
    if (/^\d*,?\d{0,2}$/.test(val)) {
      setAmount(val);
      setError(null);
    } else {
      if (val.includes(',') && val.split(',')[1].length > 2) {
        setError('Máximo 2 decimales');
      } else {
        setError('Formato inválido');
      }
    }
  };

  // Derive logic
  const pVal = Number(percentage.replace(/\./g, '').replace(',', '.')) || 0;
  const aVal = Number(amount.replace(/\./g, '').replace(',', '.')) || 0;

  const discountFromPercentage = subtotal * (pVal / 100);
  const totalAfterPercentage = subtotal - discountFromPercentage;
  const finalTotal = totalAfterPercentage - aVal;

  const totalDiscounts = discountFromPercentage + aVal;

  const validateAndConfirm = () => {
    if (percentage === '' && amount === '') {
      setError('Debes ingresar un descuento o usar la opción "Omitir".');
      return;
    }
    if (finalTotal < 0) {
      setError('El descuento total supera al subtotal.');
      return;
    }
    const normalizedP = percentage.replace(',', '.');
    const normalizedA = amount.replace(',', '.');

    if (!isValidDecimal(normalizedP, 2) || !isValidDecimal(normalizedA, 2)) {
      setError('Los descuentos no pueden tener más de 2 decimales.');
      return;
    }
    setError(null);
    onConfirm({ amount: aVal, percentage: pVal });
  };

  const handleSkip = () => {
    onConfirm({ amount: 0, percentage: 0 });
  };

  const finalFormatted = finalTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const subtotalFormatted = subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const discountsFormatted = totalDiscounts.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title='Descuentos'
      icon={<Tag className='w-5 h-5' />}
      width='sm'
    >
      <div className='space-y-6'>
        <div className='bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30'>
          <div className='flex justify-between items-center mb-1'>
            <span className='text-xs font-black uppercase text-zinc-400 tracking-widest'>Subtotal</span>
            <span className='text-sm font-black text-zinc-500'>${subtotalFormatted}</span>
          </div>
          {totalDiscounts > 0 && (
            <div className='flex justify-between items-center mb-2'>
              <span className='text-xs font-black uppercase text-emerald-500 tracking-widest'>Descuentos</span>
              <span className='text-sm font-black text-emerald-600'>-${discountsFormatted}</span>
            </div>
          )}
          <div className='flex justify-between items-center pt-2 border-t border-indigo-100 dark:border-indigo-900/30'>
            <span className='text-xs font-black uppercase text-indigo-400 tracking-widest'>Total a Cobrar</span>
            <span className='text-2xl font-black text-indigo-700 dark:text-indigo-300'>${finalTotal < 0 ? '0,00' : finalFormatted}</span>
          </div>
        </div>

        <div className='space-y-4'>
          <div>
            <label className='flex items-center gap-1 text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5'>
              <Percent className='w-3 h-3' /> Descuento (%)
            </label>
            <div className='relative'>
              <input
                type='text'
                inputMode='decimal'
                className='w-full pl-3 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold'
                value={percentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                data-testid={TEST_IDS.ventas.discount.descuentoPorcentual}
                onKeyDown={(e) => {
                  if (e.key === ',' && e.currentTarget.value.includes(',')) {
                    e.preventDefault();
                    return;
                  }
                  if (!/^[0-9]$/.test(e.key) && e.key !== ',' && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                placeholder='0'
              />
              <span className='absolute right-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400'>%</span>
            </div>
            <p className='text-[9px] text-zinc-500 mt-1 uppercase font-bold tracking-widest'>Max: 100%</p>
          </div>

          <div>
            <label className='flex items-center gap-1 text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5'>
              <DollarSign className='w-3 h-3' /> Descuento Adicional ($)
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400'>$</span>
              <input
                type='text'
                inputMode='decimal'
                className='w-full pl-7 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold'
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                data-testid={TEST_IDS.ventas.discount.descuentoAbsoluto}
                onKeyDown={(e) => {
                  if (e.key === ',' && e.currentTarget.value.includes(',')) {
                    e.preventDefault();
                    return;
                  }
                  if (!/^[0-9]$/.test(e.key) && e.key !== ',' && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                placeholder='0,00'
              />
            </div>
          </div>

          {error || finalTotal < 0 ? (
            <div className='flex items-center gap-2 p-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg border border-red-100 dark:border-red-900/30'>
              <AlertCircle className='w-4 h-4 shrink-0' />
              <span className='text-[10px] font-bold'>{error || 'El descuento total supera al subtotal.'}</span>
            </div>
          ) : null}
        </div>

        <div className='pt-4 flex flex-col gap-3'>
          <Button
            size='md'
            fullWidth
            onClick={validateAndConfirm}
            disabled={isPending || finalTotal < 0}
            data-testid={TEST_IDS.ventas.discount.btnConfirmarDescuento}
          >
            Continuar al Pago
          </Button>
          {(pVal > 0 || aVal > 0) && (
            <button
              onClick={handleSkip}
              className='text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-600 tracking-widest transition-colors mx-auto block'
              data-testid={TEST_IDS.ventas.discount.btnQuitarDescuento}
            >
              Quitar Descuentos
            </button>
          )}
          {pVal === 0 && aVal === 0 && (
            <button
              onClick={handleSkip}
              className='text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-600 tracking-widest transition-colors mx-auto block'
              data-testid={TEST_IDS.ventas.discount.btnOmitirDescuento}
            >
              Omitir Descuentos
            </button>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
