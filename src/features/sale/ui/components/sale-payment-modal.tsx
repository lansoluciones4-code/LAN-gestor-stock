import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Edit2, AlertCircle, Percent } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { type SalePaymentInput } from '@/features/sale/domain/sale.schema';
import { type CardDef } from '@/features/card/domain/card.schema';
import { isValidDecimal, roundToDecimals } from '@/lib/utils';
import { TEST_IDS } from '@/constants/test-ids';
import { PAYMENT_TYPES, getPaymentTypeMeta, type PaymentType } from '@/lib/payment-types';

const PAYMENT_TYPE_TESTIDS: Record<PaymentType, string> = {
  transferencia: TEST_IDS.ventas.payment.btnTranserencia,
  efectivo: TEST_IDS.ventas.payment.btnEfectivo,
  debito: TEST_IDS.ventas.payment.btnDebito,
  credito: TEST_IDS.ventas.payment.btnCredito,
};

interface SalePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Importe sin descontar — el modal aplica el % de descuento internamente. */
  subtotal: number;
  cards: CardDef[];
  /** Restringe qué métodos de pago se muestran. Por defecto, los 4 habituales. */
  allowedTypes?: PaymentType[];
  onConfirm: (payments: SalePaymentInput[], discountPercentage: number) => void;
  isPending?: boolean;
}

export function SalePaymentModal({ isOpen, onClose, subtotal, cards, allowedTypes = PAYMENT_TYPES, onConfirm, isPending }: SalePaymentModalProps) {
  const [payments, setPayments] = useState<SalePaymentInput[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Internal form state
  const [type, setType] = useState<PaymentType | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [installments, setInstallments] = useState<1 | 3 | 6 | 12>(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const pVal = Math.min(100, Math.max(0, Number((discountPercentage || '0').replace(',', '.')) || 0));
  const total = roundToDecimals(subtotal * (1 - pVal / 100));

  const currentCovered = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = total - currentCovered;
  // Al editar un pago ya agregado, su propio monto ya está sumado en currentCovered — hay que
  // devolverlo al "saldo a cubrir" para no subestimar la base sobre la que aplicar el recargo.
  const coverageBase = editingIndex !== null ? remaining + payments[editingIndex].amount : remaining;

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  const applyInstallmentOption = (opt: { installments: number; interestPercentage: number }) => {
    setInstallments(opt.installments as 1 | 3 | 6 | 12);
    const computed = roundToDecimals(Math.max(coverageBase, 0) * (1 + opt.interestPercentage / 100));
    setAmount(computed.toFixed(2).replace('.', ','));
    setError(null);
  };

  // Mientras se compone un pago nuevo (no se está editando uno existente), recalcula el monto
  // sugerido al saldo restante actualizado cada vez que cambia el % de descuento.
  const refillAmountForNewPayment = (newPct: number) => {
    if (!isAdding || editingIndex !== null) return;
    const newTotal = roundToDecimals(subtotal * (1 - newPct / 100));
    setAmount(Math.max(newTotal - currentCovered, 0).toFixed(2).replace('.', ','));
  };

  const handleDiscountChange = (val: string) => {
    if (val === '') {
      setDiscountPercentage('');
      setError(null);
      refillAmountForNewPayment(0);
      return;
    }
    if (val.includes('.')) return;
    if (/^\d*,?\d{0,2}$/.test(val)) {
      const num = Number(val.replace(',', '.'));
      if (num >= 0 && num <= 100) {
        setDiscountPercentage(val);
        setError(null);
        refillAmountForNewPayment(num);
      } else {
        setError('El descuento debe estar entre 0 y 100');
      }
    } else if (val.includes(',') && val.split(',')[1].length > 2) {
      setError('Máximo 2 decimales');
    } else {
      setError('Formato inválido');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPayments([]);
      setIsAdding(false);
      setEditingIndex(null);
      setError(null);
      setDiscountPercentage('');
      // Auto-start adding if empty
      setIsAdding(true);
      setType(null);
      setInstallments(1);
      setSelectedCardId(null);
      setAmount(subtotal.toFixed(2).replace('.', ','));
    }
  }, [isOpen, subtotal]);

  const validateAndAdd = () => {
    if (!type) {
      setError('Elegí un método de pago');
      return;
    }
    if (type === 'credito' && !selectedCardId) {
      setError('Elegí una tarjeta');
      return;
    }
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
    // En cuotas, se permite exceder el total (recargo por interés); en pago único, no.
    const allowExceed = type === 'credito' && installments > 1;
    if (allowExceed && numAmount < total - 0.001) {
      setError(`En ${installments} cuotas, el monto no puede ser menor al total de la venta ($${total.toLocaleString('es-AR')})`);
      return;
    }

    if (editingIndex !== null) {
      const otherPaymentsTotal = payments.filter((_, i) => i !== editingIndex).reduce((acc, p) => acc + p.amount, 0);
      if (!allowExceed && otherPaymentsTotal + numAmount > total + 0.001) {
        // small epsilon
        setError(`El total excede los $${total.toLocaleString('es-AR')}`);
        return;
      }

      const newPayments = [...payments];
      newPayments[editingIndex] = { type, amount: numAmount, installments: type === 'credito' ? installments : 1, cardId: type === 'credito' ? selectedCardId : null };
      setPayments(newPayments);
      setEditingIndex(null);
    } else {
      if (!allowExceed && currentCovered + numAmount > total + 0.001) {
        setError(`El total excede los $${total.toLocaleString('es-AR')}`);
        return;
      }

      // Check if type already exists (max 2 rule but different types)
      const exists = payments.some((p) => p.type === type);
      if (exists) {
        setError(`Ya existe un pago en ${getPaymentTypeMeta(type).label}`);
        return;
      }

      setPayments([...payments, { type, amount: numAmount, installments: type === 'credito' ? installments : 1, cardId: type === 'credito' ? selectedCardId : null }]);
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
    setInstallments((p.installments as 1 | 3 | 6 | 12) || 1);
    setSelectedCardId(p.cardId ?? null);
    setEditingIndex(index);
    setIsAdding(true);
  };

  const handleConfirm = () => {
    // El total cubierto no puede quedar por debajo del total de la venta. Sí puede superarlo
    // (recargo por interés en cuotas de Crédito), ya validado al cargar ese pago.
    if (currentCovered < total - 0.001) {
      setError('El total de los pagos debe cubrir el total de la venta');
      return;
    }
    onConfirm(payments, pVal);
  };

  // Mask logic similar to product form
  const handleAmountChange = (val: string) => {
    if (val === '') {
      setAmount(val);
      setError(null);
      return;
    }

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
  const subtotalFormatted = subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title='Método de Pago'
      icon={<CreditCard className='w-5 h-5' />}
      width='md'
    >
      <div className='space-y-6'>
        <div className='bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900/30 space-y-2'>
          <div className='flex justify-between items-center'>
            <span className='text-xs font-black uppercase text-zinc-400 tracking-widest'>Subtotal</span>
            <span className='text-sm font-black text-zinc-500'>${subtotalFormatted}</span>
          </div>
          <div className='flex justify-between items-center gap-3'>
            <span className='flex items-center gap-1 text-xs font-black uppercase text-zinc-400 tracking-widest'>
              <Percent className='w-3 h-3' /> Descuento
            </span>
            <div className='relative w-24'>
              <input
                type='text'
                inputMode='decimal'
                value={discountPercentage}
                onChange={(e) => handleDiscountChange(e.target.value)}
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
                className='w-full pl-2 pr-6 py-1 text-sm text-right font-bold border rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-zinc-500'
                data-testid={TEST_IDS.ventas.discount.descuentoPorcentual}
              />
              <span className='absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400'>%</span>
            </div>
          </div>
          <div className='flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-900/30'>
            <span className='text-xs font-black uppercase text-zinc-400 tracking-widest'>Total a Cobrar</span>
            <span className='text-2xl font-black text-zinc-700 dark:text-zinc-300'>${totalFormatted}</span>
          </div>
          {remaining > 0 && (
            <div className='flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-900/30'>
              <span className='text-[10px] font-black uppercase text-zinc-500 tracking-widest'>Saldo Restante</span>
              <span className='text-lg font-black text-zinc-600'>${remainingFormatted}</span>
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
                  setType(null);
                  setInstallments(1);
                  setSelectedCardId(null);
                  setAmount(Math.max(remaining, 0).toFixed(2).replace('.', ','));
                }}
                leftIcon={<Plus className='w-3 h-3' />}
                data-testid={TEST_IDS.ventas.payment.btnAddAnotherMetodoDePago}
              >
                Añadir Otro
              </Button>
            )}
          </div>

          <div className='space-y-2'>
            {payments.map((p, i) => {
              const meta = getPaymentTypeMeta(p.type);
              const Icon = meta.icon;
              const cardName = p.cardId ? cards.find((c) => c.id === p.cardId)?.name : undefined;
              return (
              <div
                key={i}
                className='flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg group'
              >
                <div className='flex items-center gap-3'>
                  <div className={`p-2 rounded-full ${meta.badge}`}><Icon className='w-4 h-4' /></div>
                  <div>
                    <p className='text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100 tracking-tight'>
                      {meta.label}
                      {cardName && <span className='text-zinc-400 font-medium normal-case'> · {cardName}</span>}
                      {p.installments > 1 && <span className='text-zinc-400 font-medium normal-case'> · {p.installments} cuotas</span>}
                    </p>
                    <p className='text-sm font-black text-zinc-600'>${p.amount.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <button
                    onClick={() => startEdit(i)}
                    className='p-1.5 text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 rounded-md transition-colors'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => removePayment(i)}
                    className='p-1.5 text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 rounded-md transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>
              );
            })}

            {isAdding && (
              <div className='p-4 bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-900/30 rounded-xl space-y-4 animate-in fade-in zoom-in-95 duration-200'>
                <div className='grid grid-cols-2 gap-3'>
                  {allowedTypes.map((t) => {
                    const meta = getPaymentTypeMeta(t);
                    const Icon = meta.icon;
                    const isSelected = type === t;
                    return (
                      <button
                        key={t}
                        type='button'
                        onClick={() => {
                          setType(t);
                          if (t !== 'credito') {
                            setInstallments(1);
                            setSelectedCardId(null);
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors duration-100 ease-out ${isSelected ? meta.selected : `border-transparent ${meta.resting}`} ${meta.hover}`}
                        data-testid={PAYMENT_TYPE_TESTIDS[t]}
                      >
                        <Icon className='w-6 h-6 mb-1' />
                        <span className='text-[10px] font-black uppercase'>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>

                {type === 'credito' && (
                  <div>
                    <label className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5'>{selectedCard ? 'Cuotas' : 'Tarjeta'}</label>
                    {!selectedCard ? (
                      cards.filter((c) => c.isActive).length === 0 ? (
                        <p className='text-xs text-zinc-500 p-3 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg'>
                          No hay tarjetas registradas. Pedile a un administrador que cargue una en &quot;Alta de tarjetas&quot;.
                        </p>
                      ) : (
                        <div className='grid grid-cols-2 gap-2'>
                          {cards
                            .filter((c) => c.isActive)
                            .map((c) => (
                              <button
                                key={c.id}
                                type='button'
                                onClick={() => setSelectedCardId(c.id)}
                                className='py-2 px-3 rounded-lg border-2 border-transparent bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors truncate'
                              >
                                {c.name}
                              </button>
                            ))}
                        </div>
                      )
                    ) : (
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-xs font-bold text-zinc-700 dark:text-zinc-300'>{selectedCard.name}</span>
                          <button
                            type='button'
                            onClick={() => {
                              setSelectedCardId(null);
                              setInstallments(1);
                            }}
                            className='text-[10px] font-black text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 uppercase'
                          >
                            Cambiar tarjeta
                          </button>
                        </div>
                        {selectedCard.installments.length === 0 ? (
                          <p className='text-xs text-zinc-500 p-3 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg'>Esta tarjeta no tiene cuotas habilitadas.</p>
                        ) : (
                          <div className='grid grid-cols-4 gap-2'>
                            {[...selectedCard.installments]
                              .sort((a, b) => a.installments - b.installments)
                              .map((opt) => (
                                <button
                                  key={opt.id}
                                  type='button'
                                  onClick={() => applyInstallmentOption(opt)}
                                  className={`py-2 rounded-lg border-2 text-[11px] font-black transition-colors duration-100 ease-out ${installments === opt.installments ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 text-zinc-700 dark:text-zinc-300' : 'border-transparent bg-white dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                >
                                  {opt.installments}x{opt.interestPercentage > 0 ? ` +${opt.interestPercentage}%` : ''}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1.5'>Monto del Pago</label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400'>$</span>
                    <input
                      autoFocus
                      type='text'
                      inputMode='decimal'
                      className='w-full pl-7 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 font-bold'
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
                      data-testid={TEST_IDS.ventas.payment.inputMonto}
                    />
                  </div>
                  {type === 'credito' && installments > 1 && (Number(amount.replace(',', '.')) || 0) > 0 && (
                    <p className='text-[10px] text-zinc-500 mt-1.5 font-bold'>
                      {installments} cuotas de ${(Number(amount.replace(',', '.')) / installments).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} c/u
                    </p>
                  )}
                </div>

                {error && (
                  <div className='flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 rounded-lg border border-zinc-100 dark:border-zinc-900/30'>
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
          <div className='flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 rounded-lg border border-zinc-100 dark:border-zinc-900/30'>
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
