import { useState, useEffect } from 'react';
import { CreditCard, Banknote, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { type SalePaymentInput } from '@/features/sale/domain/sale.schema';
import { isValidDecimal } from '@/lib/utils';
import { TEST_IDS } from '@/constants/test-ids';

interface SalePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: SalePaymentInput[]) => void;
  isPending?: boolean;
}

export function SalePaymentModal({ isOpen, onClose, total, onConfirm, isPending }: SalePaymentModalProps) {
  const [payments, setPayments] = useState<SalePaymentInput[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Internal form state
  const [type, setType] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const currentCovered = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = total - currentCovered;

  useEffect(() => {
    if (isOpen) {
      setPayments([]);
      setIsAdding(false);
      setEditingIndex(null);
      setError(null);
      // Auto-start adding if empty
      setIsAdding(true);
      setType('efectivo');
      setAmount(total.toFixed(2).replace('.', ','));
    }
  }, [isOpen, total]);

  const validateAndAdd = () => {
    const normalizedAmount = amount.replace(',', '.');
    const numAmount = Number(normalizedAmount);
    if (isNaN(numAmount) || numAmount < 0 || (numAmount === 0 && total > 0)) {
      setError('Monto inválido');
      return;
    }
    if (!isValidDecimal(normalizedAmount, 2)) {
      setError('El monto no puede tener más de 2 decimales');
      return;
    }

    if (editingIndex !== null) {
      const otherPaymentsTotal = payments.filter((_, i) => i !== editingIndex).reduce((acc, p) => acc + p.amount, 0);
      if (otherPaymentsTotal + numAmount > total + 0.001) {
        // small epsilon
        setError(`El total excede los $${total.toLocaleString('es-AR')}`);
        return;
      }

      const newPayments = [...payments];
      newPayments[editingIndex] = { type, amount: numAmount };
      setPayments(newPayments);
      setEditingIndex(null);
    } else {
      if (currentCovered + numAmount > total + 0.001) {
        setError(`El total excede los $${total.toLocaleString('es-AR')}`);
        return;
      }

      // Check if type already exists (max 2 rule but different types)
      const exists = payments.some((p) => p.type === type);
      if (exists) {
        setError(`Ya existe un pago en ${type}`);
        return;
      }

      setPayments([...payments, { type, amount: numAmount }]);
    }

    setIsAdding(false);
    setError(null);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    const p = payments[index];
    setType(p.type);
    setAmount(p.amount.toFixed(2).replace('.', ','));
    setEditingIndex(index);
    setIsAdding(true);
  };

  const handleConfirm = () => {
    if (Math.abs(total - currentCovered) > 0.001) {
      setError('El total de los pagos debe coincidir exactamente con el total de la venta');
      return;
    }
    onConfirm(payments);
  };

  // Mask logic similar to product form
  const handleAmountChange = (val: string) => {
    if (val === '') {
      setAmount(val);
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

  const remainingFormatted = remaining.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const totalFormatted = total.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title='Método de Pago'
      icon={<CreditCard className='w-5 h-5' />}
      width='md'
    >
      <div className='space-y-6'>
        <div className='bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30'>
          <div className='flex justify-between items-center'>
            <span className='text-xs font-black uppercase text-indigo-400 tracking-widest'>Total a Cobrar</span>
            <span className='text-2xl font-black text-indigo-700 dark:text-indigo-300'>${totalFormatted}</span>
          </div>
          {remaining > 0 && (
            <div className='flex justify-between items-center mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/30'>
              <span className='text-[10px] font-black uppercase text-amber-500 tracking-widest'>Saldo Restante</span>
              <span className='text-lg font-black text-amber-600'>${remainingFormatted}</span>
            </div>
          )}
        </div>

        <div className='space-y-3'>
          <div className='flex justify-between items-center'>
            <h4 className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Detalle de Pagos</h4>
            {payments.length < 2 && !isAdding && (
              <Button
                size='sm'
                variant='secondary'
                onClick={() => {
                  setIsAdding(true);
                  setEditingIndex(null);
                  setType(payments.length > 0 && payments[0].type === 'efectivo' ? 'transferencia' : 'efectivo');
                  setAmount(remaining.toFixed(2).replace('.', ','));
                }}
                leftIcon={<Plus className='w-3 h-3' />}
                data-testid={TEST_IDS.ventas.payment.btnAddAnotherMetodoDePago}
              >
                Añadir Otro
              </Button>
            )}
          </div>

          <div className='space-y-2'>
            {payments.map((p, i) => (
              <div
                key={i}
                className='flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg group'
              >
                <div className='flex items-center gap-3'>
                  <div className={`p-2 rounded-full ${p.type === 'efectivo' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10'}`}>{p.type === 'efectivo' ? <Banknote className='w-4 h-4' /> : <CreditCard className='w-4 h-4' />}</div>
                  <div>
                    <p className='text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100 tracking-tight'>{p.type}</p>
                    <p className='text-sm font-black text-indigo-600'>${p.amount.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <button
                    onClick={() => startEdit(i)}
                    className='p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => removePayment(i)}
                    className='p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>
            ))}

            {isAdding && (
              <div className='p-4 bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-indigo-200 dark:border-indigo-900/30 rounded-xl space-y-4 animate-in fade-in zoom-in-95 duration-200'>
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() => setType('efectivo')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${type === 'efectivo' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' : 'border-transparent bg-white dark:bg-zinc-900 text-zinc-400'}`}
                    data-testid={TEST_IDS.ventas.payment.btnEfectivo}
                  >
                    <Banknote className='w-6 h-6 mb-1' />
                    <span className='text-[10px] font-black uppercase'>Efectivo</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setType('transferencia')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${type === 'transferencia' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700' : 'border-transparent bg-white dark:bg-zinc-900 text-zinc-400'}`}
                    data-testid={TEST_IDS.ventas.payment.btnTranserencia}
                  >
                    <CreditCard className='w-6 h-6 mb-1' />
                    <span className='text-[10px] font-black uppercase'>Transferencia</span>
                  </button>
                </div>

                <div>
                  <label className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5'>Monto del Pago</label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400'>$</span>
                    <input
                      autoFocus
                      type='text'
                      inputMode='decimal'
                      className='w-full pl-7 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold'
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
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
                      data-testid={TEST_IDS.ventas.payment.inputMonto}
                    />
                  </div>
                </div>

                {error && (
                  <div className='flex items-center gap-2 p-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg border border-red-100 dark:border-red-900/30'>
                    <AlertCircle className='w-4 h-4 shrink-0' />
                    <span className='text-[10px] font-bold'>{error}</span>
                  </div>
                )}

                <div className='flex gap-2 pt-2'>
                  <Button
                    fullWidth
                    variant='secondary'
                    onClick={() => {
                      setIsAdding(false);
                      setEditingIndex(null);
                      setError(null);
                    }}
                    data-testid={TEST_IDS.ventas.payment.btnCancelarMetodoDePago}
                  >
                    Cancelar
                  </Button>
                  <Button
                    fullWidth
                    onClick={validateAndAdd}
                    data-testid={TEST_IDS.ventas.payment.btnAddMetodoDePago}
                  >
                    {editingIndex !== null ? 'Actualizar' : 'Añadir'}
                  </Button>
                </div>
              </div>
            )}

            {payments.length === 0 && !isAdding && (
              <div className='py-8 text-center bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800'>
                <p className='text-[10px] font-bold uppercase text-zinc-400 tracking-widest'>Sin métodos de pago añadidos</p>
              </div>
            )}
          </div>
        </div>

        {error && !isAdding && (
          <div className='flex items-center gap-2 p-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg border border-red-100 dark:border-red-900/30'>
            <AlertCircle className='w-4 h-4 shrink-0' />
            <span className='text-[10px] font-bold'>{error}</span>
          </div>
        )}

        <div className='pt-4 flex flex-col gap-3'>
          <Button
            size='lg'
            fullWidth
            onClick={handleConfirm}
            isLoading={isPending}
            disabled={isAdding}
            data-testid={TEST_IDS.ventas.payment.btnFinalizarYFacturar}
          >
            Finalizar y Facturar
          </Button>
          {!isAdding && (
            <button
              onClick={onClose}
              className='text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-600 tracking-widest transition-colors'
              data-testid={TEST_IDS.ventas.payment.btnVolverCarrito}
            >
              Volver al Carrito
            </button>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
