import { useState, useEffect } from 'react';
import { ShoppingCart, ArrowLeft, Trash2, MinusCircle, PlusCircle, X, Search } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { type CustomerDef } from '@/features/customer/domain/customer.schema';
import { type CartItem } from '../hooks/useCart';
import { CustomerModal } from '@/features/customer/ui/components/customer-modal';
import { TEST_IDS } from '@/constants/test-ids';

interface SalesPOSViewProps {
  products: ProductDef[];
  customers: CustomerDef[];
  setCustomers: (items: CustomerDef[]) => void;
  cart: CartItem[];
  addToCart: (p: ProductDef) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, delta: number) => void;
  cartTotal: number;
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  isPending: boolean;
  onConfirmSale: () => void;
  onCancel: () => void;
  showMobileCart: boolean;
  setShowMobileCart: (v: boolean) => void;
  setGlobalMessage: (msg: any) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (v: boolean) => void;
}

export function SalesPOSView({ products, customers, setCustomers, cart, addToCart, removeFromCart, updateCartQty, cartTotal, selectedCustomerId, setSelectedCustomerId, isPending, onConfirmSale, onCancel, showMobileCart, setShowMobileCart, setGlobalMessage, isPaymentModalOpen, setIsPaymentModalOpen }: SalesPOSViewProps) {
  const [saleSearch, setSaleSearch] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCustomerModalOpen) {
          setIsCustomerModalOpen(false);
          return;
        }
        if (isPaymentModalOpen) {
          setIsPaymentModalOpen(false);
          return;
        }
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isPaymentModalOpen, setIsPaymentModalOpen, isCustomerModalOpen]);

  const filteredProducts = products.filter((p) => {
    if (p.stock <= 0) return false;
    if (!saleSearch) return true;

    const terms = saleSearch.toLowerCase().trim().split(/\s+/);
    const combinedText = `${p.device?.name || ''} ${p.description || ''}`.toLowerCase();

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
          className='w-full sm:w-auto font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/20 shadow-md h-10'
          data-testid={TEST_IDS.ventas.pos.btnCancelarCarrito}
        >
          <span className='hidden sm:inline'>Volver Al Listado</span>
          <span className='sm:hidden'>Volver</span>
        </Button>
        <div className='flex items-center justify-center sm:justify-end gap-2 min-w-0 bg-white dark:bg-transparent border border-zinc-200 dark:border-transparent rounded-lg py-2 sm:py-0 shadow-sm sm:shadow-none'>
          <ShoppingCart className='w-5 h-5 text-indigo-600 shrink-0' />
          <h2 className='text-base sm:text-lg font-bold truncate'>Facturar Venta</h2>
        </div>
      </div>

      <div className='flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden'>
        {/* List Products */}
        <div className='lg:col-span-7 flex flex-col min-h-0 space-y-4 px-1 pt-1'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0 pb-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
              <input
                type='text'
                placeholder='Buscar productos...'
                className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors shadow-sm h-10'
                value={saleSearch}
                onChange={(e) => setSaleSearch(e.target.value)}
                data-testid={TEST_IDS.ventas.pos.inputBusquedaProducto}
              />
            </div>
            <div className='w-full'>
              <Combobox
                options={customers
                  .filter((c) => c.isActive)
                  .map((c) => ({
                    id: c.id,
                    name: c.name,
                  }))}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                placeholder='Cliente de la operación...'
                addNewLabel='+ Nuevo Cliente'
                onAddNew={() => setIsCustomerModalOpen(true)}
                data-testid={TEST_IDS.ventas.pos.comboClienteVenta}
                searchTestId={TEST_IDS.ventas.pos.inputBusquedaCliente}
              />
            </div>
          </div>

          <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-24 lg:pb-6 font-medium'>
            {filteredProducts.map((p) => (
              <button
                key={`pos-prod-${p.id}`}
                disabled={p.stock <= 0}
                onClick={() => addToCart(p)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${p.stock <= 0 ? 'opacity-40 bg-zinc-50 cursor-not-allowed border-zinc-200' : 'bg-white dark:bg-zinc-900 border-zinc-200 hover:border-indigo-500 hover:shadow-md'}`}
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
                  <span className={`text-[10px] font-bold ${p.stock < 5 ? 'text-amber-500' : 'text-zinc-500'}`}>
                    Disp:
                    {p.stock}
                  </span>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-black leading-none text-indigo-600'>${p.salePrice.toLocaleString('es-AR')}</div>
                  <div className='text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1'>Agregar</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Cart */}
        <div className='hidden lg:flex lg:col-span-5 flex-col bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-sm'>
          <div className='p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/30 flex justify-between items-center shrink-0'>
            <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Items en Carrito</span>
            <span className='bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded'>{cart.length}</span>
          </div>
          <div className='flex-1 min-h-0 overflow-y-auto p-4 space-y-2 custom-scrollbar'>
            {cart.map((item) => (
              <div
                key={`cart-item-${item.productId}`}
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
                    className='text-zinc-300 hover:text-red-500 transition-colors p-1'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
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
            {cart.length === 0 && (
              <div className='py-10 text-center opacity-30 flex flex-col items-center gap-2'>
                <ShoppingCart className='w-8 h-8' />
                <p className='text-[10px] font-bold uppercase tracking-widest'>Esperando items...</p>
              </div>
            )}
          </div>
          <div className='p-5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-4 rounded-b-xl shrink-0'>
            <div className='flex justify-between items-center pt-2'>
              <span className='text-[10px] text-zinc-400 uppercase font-black'>Total Venta</span>
              <span className='text-3xl text-emerald-600 font-black tracking-tighter'>${cartTotal.toLocaleString('es-AR')}</span>
            </div>
            <Button
              fullWidth
              onClick={onConfirmSale}
              size='lg'
              disabled={cart.length === 0 || !selectedCustomerId || isPending}
              data-testid={TEST_IDS.ventas.pos.btnConfirmarCarrito}
            >
              {isPending ? 'Procesando...' : 'Siguiente: Descuentos'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile UI elements */}
      {cart.length > 0 && !showMobileCart && (
        <button
          onClick={() => setShowMobileCart(true)}
          className='lg:hidden fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-2xl z-40'
        >
          <div className='relative'>
            <ShoppingCart className='w-6 h-6' />
            <span className='absolute -top-2 -right-2 bg-red-500 text-[10px] font-bold px-1.5 rounded-full border-2 border-white'>{cart.length}</span>
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
                  key={`cart-mob-${item.productId}`}
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
                      className='text-red-500 p-1'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
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
            </div>
            <div className='p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 space-y-4 pb-12 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] shrink-0'>
              <div className='flex justify-between items-center pt-2'>
                <span className='text-[10px] text-zinc-400 uppercase font-black'>Total Venta</span>
                <span className='text-emerald-600 text-3xl font-black tracking-tighter'>${cartTotal.toLocaleString('es-AR')}</span>
              </div>
              <Button
                fullWidth
                onClick={onConfirmSale}
                size='lg'
                disabled={cart.length === 0 || !selectedCustomerId || isPending}
              >
                {isPending ? 'Procesando...' : 'Siguiente: Descuentos'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={(newC: CustomerDef, message?: string) => {
          // Robust update: If id exists (reactivation case), replace it. Otherwise append.
          const exists = customers.some((c) => c.id === newC.id);
          const updatedList = exists ? customers.map((c) => (c.id === newC.id ? newC : c)) : [...customers, newC];

          setCustomers(updatedList);
          setSelectedCustomerId(newC.id);
          setGlobalMessage({ type: 'success', text: message || 'Cliente registrado y seleccionado.' });
          setTimeout(() => setGlobalMessage(null), 4000);
        }}
      />
    </div>
  );
}
