'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, ArrowLeft, Trash2, MinusCircle, PlusCircle, X, Search, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { type useCart } from '../hooks/useCart';
import { type usePrintCart } from '../hooks/usePrintCart';
import { DiscountControl } from './discount-control';
import { blockInvalidPriceKey } from '@/lib/utils';
import { TEST_IDS } from '@/constants/test-ids';
import { getPrintKindMeta, formatPrintItemLabel, type PrintKind, type PrintKindExtraField } from '@/lib/print-kinds';

const QUICK_KINDS: PrintKind[] = ['fotocopia', 'impresion', 'ciber', 'anillado_plastificado', 'tramite'];

interface QuickSaleViewProps {
  products: ProductDef[];
  cartProps: ReturnType<typeof useCart>;
  printCartProps: ReturnType<typeof usePrintCart>;
  cartTotal: number;
  isPending: boolean;
  onConfirmSale: () => void;
  onCancel: () => void;
  showMobileCart: boolean;
  setShowMobileCart: (v: boolean) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (v: boolean) => void;
}

interface QuickAddExtra {
  title?: string;
  quantity?: number;
}

/** Botón rápido tipo "Fotocopias"/"Impresiones": al tocar despliega, además del importe, el campo extra que pida `extraField` (nombre de operación para Trámites, cantidad de horas para Ciber). */
function QuickAddButton({ icon, label, extraField, onAdd }: { icon: React.ReactNode; label: string; extraField: PrintKindExtraField; onAdd: (amount: number, extra?: QuickAddExtra) => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');

  const confirm = () => {
    const amountNum = Number((amount || '').replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (extraField === 'title' && !title.trim()) return;

    const hoursNum = Number((hours || '').replace(',', '.'));
    onAdd(amountNum, {
      title: extraField === 'title' ? title.trim() : undefined,
      quantity: extraField === 'hours' && !isNaN(hoursNum) && hoursNum > 0 ? hoursNum : undefined,
    });
    setAmount('');
    setTitle('');
    setHours('');
    setOpen(false);
  };

  return (
    <div className='shrink-0 w-[190px]'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-center gap-2 px-3 py-3.5 rounded-lg border-2 transition-all font-bold text-xs uppercase text-center leading-tight ${open ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shadow-md' : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-sm hover:border-zinc-400 hover:shadow-md'}`}
      >
        {icon}
        <span>{label}</span>
      </button>
      {open && (
        <div className='flex flex-col gap-1.5 mt-2'>
          {extraField === 'title' && (
            <input
              type='text'
              autoFocus
              placeholder='Operación'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirm();
              }}
              className='w-full px-3 py-1.5 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
            />
          )}
          {extraField === 'hours' && (
            <input
              type='text'
              inputMode='decimal'
              autoFocus
              placeholder='Cantidad de horas'
              value={hours}
              onChange={(e) => setHours(e.target.value.replace(/[^0-9.,]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirm();
              }}
              className='w-full px-3 py-1.5 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
            />
          )}
          <div className='flex items-center gap-1.5'>
            <input
              type='text'
              inputMode='decimal'
              autoFocus={extraField === 'none'}
              placeholder='Importe $'
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\./g, ''))}
              onKeyDown={(e) => {
                blockInvalidPriceKey(e);
                if (e.key === 'Enter') confirm();
              }}
              className='w-full px-3 py-1.5 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
            />
            <button
              type='button'
              onClick={confirm}
              className='px-3 py-1.5 text-[10px] font-bold uppercase bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg shrink-0'
            >
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuickSaleView({ products, cartProps, printCartProps, cartTotal, isPending, onConfirmSale, onCancel, showMobileCart, setShowMobileCart, isPaymentModalOpen, setIsPaymentModalOpen }: QuickSaleViewProps) {
  const { cart, addToCart, removeFromCart, updateCartQty, setItemDiscount } = cartProps;
  const { items: printItems, addItem: addPrintItem, removeItem: removePrintItem, setItemDiscount: setPrintItemDiscount } = printCartProps;

  const [search, setSearch] = useState('');

  // Editor de descuento por ítem — clave compuesta `${tipo}:${id}`, mismo patrón que Nueva Venta.
  const [discountEditorFor, setDiscountEditorFor] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState('');

  const totalItems = cart.length + printItems.length;

  const toggleDiscountEditor = (key: string, currentDiscount: number) => {
    if (discountEditorFor === key) {
      setDiscountEditorFor(null);
      return;
    }
    setDiscountEditorFor(key);
    setDiscountInput(currentDiscount > 0 ? String(currentDiscount).replace('.', ',') : '');
  };

  const applyDiscount = (key: string, apply: (val: number) => void) => {
    const value = Math.min(100, Math.max(0, Number((discountInput || '0').replace(',', '.')) || 0));
    apply(value);
    setDiscountEditorFor(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPaymentModalOpen) {
          setIsPaymentModalOpen(false);
          return;
        }
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isPaymentModalOpen, setIsPaymentModalOpen]);

  const filteredProducts = products.filter((p) => {
    if (p.stock <= 0) return false;
    if (!search) return true;
    const terms = search.toLowerCase().trim().split(/\s+/);
    const combinedText = `${p.device?.name || ''} ${p.device?.category || ''} ${p.device?.brand || ''} ${p.description || ''}`.toLowerCase();
    return terms.every((word) => combinedText.includes(word));
  });

  return (
    <div className='flex flex-col h-full space-y-4 animate-in fade-in duration-300 relative overflow-hidden'>
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between shrink-0 px-1 gap-3 sm:gap-0'>
        <Button
          variant='secondary'
          size='sm'
          onClick={onCancel}
          leftIcon={<ArrowLeft className='w-4 h-4' />}
          className='w-full sm:w-auto font-bold border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-900/30 dark:text-zinc-400 dark:hover:bg-zinc-900/20 shadow-md h-10'
          data-testid={TEST_IDS.ventas.pos.btnCancelarCarrito}
        >
          <span className='hidden sm:inline'>Volver Al Listado</span>
          <span className='sm:hidden'>Volver</span>
        </Button>
        <div className='flex items-center justify-center sm:justify-end gap-2 min-w-0 bg-white dark:bg-transparent border border-zinc-200 dark:border-transparent rounded-lg py-2 sm:py-0 shadow-sm sm:shadow-none'>
          <Zap className='w-5 h-5 text-emerald-600 shrink-0' />
          <h2 className='text-base sm:text-lg font-bold truncate'>Venta Rápida — Consumidor Final</h2>
        </div>
      </div>

      <div className='flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden'>
        <div className='lg:col-span-7 flex flex-col min-h-0 space-y-3 px-1 pt-1'>
          <div className='flex gap-3 shrink-0 overflow-x-auto pb-1 -mx-1 px-1'>
            {QUICK_KINDS.map((kind) => {
              const meta = getPrintKindMeta(kind);
              const Icon = meta.icon;
              return (
                <QuickAddButton
                  key={kind}
                  icon={<Icon className='w-4 h-4' />}
                  label={meta.label}
                  extraField={meta.extraField}
                  onAdd={(amount, extra) => addPrintItem(null, amount, kind, extra)}
                />
              );
            })}
          </div>

          <div className='relative shrink-0'>
            <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
            <input
              type='text'
              placeholder='Buscar cualquier producto de stock...'
              className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 dark:text-zinc-100 transition-colors shadow-sm h-10'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid={TEST_IDS.ventas.pos.inputBusquedaProducto}
            />
          </div>

          <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-24 lg:pb-6 font-medium'>
            {filteredProducts.map((p) => (
              <button
                key={`quick-prod-${p.id}`}
                disabled={p.stock <= 0}
                onDoubleClick={() => addToCart(p)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${p.stock <= 0 ? 'opacity-40 bg-zinc-50 cursor-not-allowed border-zinc-200' : 'bg-white dark:bg-zinc-900 border-zinc-200 hover:border-zinc-500 hover:shadow-md'}`}
                data-testid={TEST_IDS.ventas.pos.btnAgregarProductoLista}
              >
                <div className='text-left min-w-0 flex-1 mr-4'>
                  <h4
                    className='font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate'
                    title={p.device?.name}
                  >
                    {p.device?.name}
                  </h4>
                  <p
                    className='text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-tight truncate'
                    title={p.description || '--'}
                  >
                    {p.description || '--'}
                  </p>
                  <span className='text-[10px] font-bold text-zinc-500'>
                    Disp:
                    {p.stock}
                  </span>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-black leading-none text-zinc-600'>${p.salePrice.toLocaleString('es-AR')}</div>
                  <div className='text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1'>Doble click</div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className='py-10 text-center opacity-30 flex flex-col items-center gap-2'>
                <ShoppingCart className='w-8 h-8' />
                <p className='text-[10px] font-bold uppercase tracking-widest'>Sin productos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Carrito — Desktop */}
        <div className='hidden lg:flex lg:col-span-5 flex-col bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-sm'>
          <div className='p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/30 flex justify-between items-center shrink-0'>
            <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Items en Carrito</span>
            <span className='bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded'>{totalItems}</span>
          </div>
          <div className='flex-1 min-h-0 overflow-y-auto p-4 space-y-2 custom-scrollbar'>
            {cart.map((item) => (
              <div
                key={`quick-cart-item-${item.productId}`}
                className='p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 shadow-sm shrink-0'
              >
                <div className='flex justify-between items-start gap-2 overflow-hidden'>
                  <span
                    className='text-xs font-bold uppercase leading-tight truncate'
                    title={item.name}
                  >
                    {item.name}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className='text-zinc-300 hover:text-zinc-500 transition-colors p-1'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
                <DiscountControl
                  discountPercentage={item.discountPercentage}
                  isEditing={discountEditorFor === `product:${item.productId}`}
                  onToggle={() => toggleDiscountEditor(`product:${item.productId}`, item.discountPercentage)}
                  value={discountInput}
                  onValueChange={setDiscountInput}
                  onApply={() => applyDiscount(`product:${item.productId}`, (v) => setItemDiscount(item.productId, v))}
                  onClear={() => {
                    setItemDiscount(item.productId, 0);
                    setDiscountEditorFor(null);
                  }}
                />
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded border border-zinc-200 dark:border-zinc-800'>
                    <button
                      onClick={() => updateCartQty(item.productId, -1)}
                      className='text-zinc-400 hover:text-zinc-800'
                    >
                      <MinusCircle className='w-4 h-4' />
                    </button>
                    <span className='w-6 text-center text-xs font-bold'>{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.productId, 1)}
                      className='text-zinc-400 hover:text-zinc-800'
                    >
                      <PlusCircle className='w-4 h-4' />
                    </button>
                  </div>
                  <span className='font-bold text-sm'>${item.subtotal.toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}

            {printItems.map((item) => (
              <div
                key={`quick-cart-print-${item.id}`}
                className='p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 shadow-sm shrink-0'
              >
                <div className='flex justify-between items-center gap-2 overflow-hidden'>
                  <span className='text-xs font-bold uppercase leading-tight truncate'>{formatPrintItemLabel(item)}</span>
                  <button
                    onClick={() => removePrintItem(item.id)}
                    className='text-zinc-300 hover:text-zinc-500 transition-colors p-1'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
                <DiscountControl
                  discountPercentage={item.discountPercentage}
                  isEditing={discountEditorFor === `print:${item.id}`}
                  onToggle={() => toggleDiscountEditor(`print:${item.id}`, item.discountPercentage)}
                  value={discountInput}
                  onValueChange={setDiscountInput}
                  onApply={() => applyDiscount(`print:${item.id}`, (v) => setPrintItemDiscount(item.id, v))}
                  onClear={() => {
                    setPrintItemDiscount(item.id, 0);
                    setDiscountEditorFor(null);
                  }}
                />
                <div className='flex justify-end items-center'>
                  <span className='font-bold text-sm'>${item.subtotal.toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}

            {totalItems === 0 && (
              <div className='py-10 text-center opacity-30 flex flex-col items-center gap-2'>
                <ShoppingCart className='w-8 h-8' />
                <p className='text-[10px] font-bold uppercase tracking-widest'>Esperando items...</p>
              </div>
            )}
          </div>
          <div className='p-5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-4 rounded-b-xl shrink-0'>
            <div className='flex justify-between items-center pt-2'>
              <span className='text-[10px] text-zinc-400 uppercase font-black'>Total Venta</span>
              <span className='text-3xl text-zinc-600 font-black tracking-tighter'>${cartTotal.toLocaleString('es-AR')}</span>
            </div>
            <Button
              fullWidth
              variant='success'
              onClick={onConfirmSale}
              size='lg'
              disabled={totalItems === 0 || isPending}
              data-testid={TEST_IDS.ventas.pos.btnConfirmarCarrito}
            >
              {isPending ? 'Procesando...' : 'Siguiente: Método de Pago'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile UI elements */}
      {totalItems > 0 && !showMobileCart && (
        <button
          onClick={() => setShowMobileCart(true)}
          className='lg:hidden fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-2xl z-40'
        >
          <div className='relative'>
            <ShoppingCart className='w-6 h-6' />
            <span className='absolute -top-2 -right-2 bg-emerald-500 text-[10px] font-bold px-1.5 rounded-full border-2 border-white'>{totalItems}</span>
          </div>
        </button>
      )}

      {showMobileCart && (
        <div className='lg:hidden fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200'>
          <div className='absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300'>
            <div className='p-4 border-b flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 rounded-t-2xl shrink-0'>
              <h3 className='font-bold flex items-center gap-2'>
                <ShoppingCart className='w-4 h-4' /> Carrito
              </h3>
              <button
                onClick={() => setShowMobileCart(false)}
                className='p-2 text-zinc-400'
              >
                <X className='w-6 h-6' />
              </button>
            </div>
            <div className='flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar'>
              {cart.map((item) => (
                <div
                  key={`quick-cart-mob-${item.productId}`}
                  className='p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 shrink-0'
                >
                  <div className='flex justify-between items-start overflow-hidden'>
                    <span
                      className='text-sm font-bold uppercase leading-tight truncate'
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className='text-zinc-500 p-1'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                  <DiscountControl
                    discountPercentage={item.discountPercentage}
                    isEditing={discountEditorFor === `product-m:${item.productId}`}
                    onToggle={() => toggleDiscountEditor(`product-m:${item.productId}`, item.discountPercentage)}
                    value={discountInput}
                    onValueChange={setDiscountInput}
                    onApply={() => applyDiscount(`product-m:${item.productId}`, (v) => setItemDiscount(item.productId, v))}
                    onClear={() => {
                      setItemDiscount(item.productId, 0);
                      setDiscountEditorFor(null);
                    }}
                  />
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-lg border border-zinc-200'>
                      <button
                        onClick={() => updateCartQty(item.productId, -1)}
                        className='text-zinc-500'
                      >
                        <MinusCircle className='w-5 h-5' />
                      </button>
                      <span className='w-8 text-center text-sm font-bold'>{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.productId, 1)}
                        className='text-zinc-500'
                      >
                        <PlusCircle className='w-5 h-5' />
                      </button>
                    </div>
                    <span className='font-black text-base'>${item.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}

              {printItems.map((item) => (
                <div
                  key={`quick-print-mob-${item.id}`}
                  className='p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 shrink-0'
                >
                  <div className='flex justify-between items-center overflow-hidden'>
                    <span className='text-sm font-bold uppercase leading-tight truncate'>{formatPrintItemLabel(item)}</span>
                    <button
                      onClick={() => removePrintItem(item.id)}
                      className='text-zinc-500 p-1'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                  <DiscountControl
                    discountPercentage={item.discountPercentage}
                    isEditing={discountEditorFor === `print-m:${item.id}`}
                    onToggle={() => toggleDiscountEditor(`print-m:${item.id}`, item.discountPercentage)}
                    value={discountInput}
                    onValueChange={setDiscountInput}
                    onApply={() => applyDiscount(`print-m:${item.id}`, (v) => setPrintItemDiscount(item.id, v))}
                    onClear={() => {
                      setPrintItemDiscount(item.id, 0);
                      setDiscountEditorFor(null);
                    }}
                  />
                  <div className='flex justify-end items-center'>
                    <span className='font-black text-base'>${item.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className='p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 space-y-4 pb-12 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] shrink-0'>
              <div className='flex justify-between items-center pt-2'>
                <span className='text-[10px] text-zinc-400 uppercase font-black'>Total Venta</span>
                <span className='text-zinc-600 text-3xl font-black tracking-tighter'>${cartTotal.toLocaleString('es-AR')}</span>
              </div>
              <Button
                fullWidth
                variant='success'
                onClick={onConfirmSale}
                size='lg'
                disabled={totalItems === 0 || isPending}
              >
                {isPending ? 'Procesando...' : 'Siguiente: Método de Pago'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
