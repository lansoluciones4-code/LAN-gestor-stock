'use client';

import { useState, useTransition, useMemo } from 'react';
import { 
  Trash2, 
  ShoppingCart, 
  FileText, 
  Printer, 
  ArrowLeft,
  Plus,
  MinusCircle,
  PlusCircle,
  X,
  Search,
  Calendar
} from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { type SaleDef } from '@/schemas/sale.schema';
import { type CustomerDef } from '@/schemas/customer.schema';
import { type ProductDef } from '@/schemas/product.schema';
import { createSaleAction, deleteSaleAction, fetchSales } from '@/server/actions/sale.actions';
import { fetchProducts } from '@/server/actions/product.actions';
import { useAuthStore } from '@/stores/auth.store';

interface SalesManagerProps {
  initialSales: SaleDef[];
  initialCustomers: CustomerDef[];
  initialProducts: ProductDef[];
}

export function SalesManager({ initialSales, initialCustomers, initialProducts }: SalesManagerProps) {
  const role = useAuthStore((s) => s.user?.role);
  const [view, setView] = useState<'list' | 'new'>('list');
  const [sales, setSales] = useState<SaleDef[]>(initialSales);
  const [customers] = useState<CustomerDef[]>(initialCustomers);
  const [products, setProducts] = useState<ProductDef[]>(initialProducts);
  
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // --- New Sale State ---
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomers.find((c) => c.name.toLowerCase() === 'mostrador')?.id || ''
  );
  const [saleSearch, setSaleSearch] = useState('');
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<SaleDef | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);

  const loadData = async () => {
    startTransition(async () => {
      const [updatedS, updatedP] = await Promise.all([
        fetchSales(),
        fetchProducts()
      ]);
      setSales(updatedS);
      setProducts(updatedP);
    });
  };

  const addToCart = (product: ProductDef) => {
    if (product.stock <= 0) return;
    setCart((prev: any[]) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.productId === product.id 
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } 
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          quantity: 1,
          unitPrice: product.salePrice,
          subtotal: product.salePrice,
          name: `${product.device?.name || 'Equipo'}`,
          desc: product.description || '',
          max: product.stock
        }
      ];
    });
  };

  const removeFromCartItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          const newQty = i.quantity + delta;
          if (newQty > i.max || newQty < 1) return i;
          return { ...i, quantity: newQty, subtotal: newQty * i.unitPrice };
        }
        return i;
      })
    );
  };

  const cartTotal = cart.reduce((acc, i) => acc + i.subtotal, 0);

  const handleCreateSale = async () => {
    if (cart.length === 0 || !selectedCustomerId) return;
    startTransition(async () => {
      const result = await createSaleAction({
        customerId: selectedCustomerId || undefined,
        items: cart.map(({ name, desc, max, ...rest }) => ({
          ...rest,
          unitPrice: rest.unitPrice.toString(),
          subtotal: rest.subtotal.toString()
        })) as any,
        total: cartTotal.toString(),
      });

      if (result.success) {
        setGlobalMessage({ type: 'success', text: result.message });
        setCart([]);
        setSelectedCustomerId(initialCustomers.find((c) => c.name.toLowerCase() === 'mostrador')?.id || initialCustomers[0]?.id || '');
        setShowMobileCart(false);
        setView('list');
        loadData();
      } else {
        setGlobalMessage({ type: 'error', text: result.message });
      }
      setTimeout(() => setGlobalMessage(null), 4000);
    });
  };

  const filteredProducts = products.filter((p) => {
    const term = saleSearch.toLowerCase();
    return p.device?.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term));
  });

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
       const term = searchTerm.toLowerCase();
       const matchesSearch = (s.customer?.name || 'Consumidor Final').toLowerCase().includes(term) || (s.vendor?.username || '').toLowerCase().includes(term);
       const saleTime = new Date(s.createdAt).getTime();

       let matchesStart = true;
       if (startDate) {
          const start = new Date(startDate + 'T00:00:00');
          matchesStart = saleTime >= start.getTime();
       }
       
       let matchesEnd = true;
       if (endDate) {
          const end = new Date(endDate + 'T23:59:59');
          matchesEnd = saleTime <= end.getTime();
       }
       
       return matchesSearch && matchesStart && matchesEnd;
    });
  }, [sales, searchTerm, startDate, endDate]);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);

    startTransition(async () => {
      const result = await deleteSaleAction(id);
      if (result.success) {
        setGlobalMessage({ type: 'success', text: result.message });
        loadData();
      } else {
        setGlobalMessage({ type: 'error', text: result.message });
      }
      setTimeout(() => setGlobalMessage(null), 4000);
    });
  };

  if (selectedSaleForPrint) {
    return (
      <div className='flex flex-col h-full space-y-4 animate-in fade-in duration-300 overflow-hidden bg-zinc-50 dark:bg-zinc-950 px-1'>
        <div className='flex items-center justify-between sticky top-4 bg-white dark:bg-zinc-900 px-4 py-3 z-30 border-b border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl mx-2'>
          <Button variant='ghost' size='sm' onClick={() => setSelectedSaleForPrint(null)} leftIcon={<ArrowLeft className='w-4 h-4'/>}>
             Volver
          </Button>
          <div className='flex gap-2 shrink-0'>
            <Button size='sm' variant='secondary' onClick={() => window.print()} leftIcon={<Printer className='w-4 h-4'/>}>
               Imprimir Comprobante
            </Button>
          </div>
        </div>
        
        <div className='flex-1 overflow-auto p-4 sm:p-10 custom-scrollbar'>
            <div id='print-area-wrapper' className='bg-white p-4 sm:p-12 border border-zinc-200 rounded-xl shadow-lg max-w-2xl mx-auto'>
                <div className='flex justify-between items-start mb-12 border-b-2 border-indigo-50 pb-8'>
                  <div>
                    <h2 className='text-3xl font-black text-indigo-600'>STOCK APP</h2>
                    <p className='text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1'>Registro Comercial</p>
                  </div>
                  <div className='text-right'>
                    <div className='text-[11px] font-bold text-zinc-900 uppercase'>ID: {selectedSaleForPrint.id.substring(0,8).toUpperCase()}</div>
                    <div className='text-[10px] text-zinc-500 font-medium'>{new Date(selectedSaleForPrint.createdAt).toLocaleDateString('es-AR')}</div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-10 mb-16'>
                    <div>
                      <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Cliente</span>
                      <p className='text-sm font-bold text-zinc-800'>{selectedSaleForPrint.customer?.name || 'Consumidor Final'}</p>
                    </div>
                    <div className='text-right'>
                      <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Vendedor</span>
                      <p className='text-sm font-bold text-zinc-800'>{selectedSaleForPrint.vendor?.username || 'SISTEMA'}</p>
                    </div>
                </div>

                <table className='w-full mb-16'>
                  <thead>
                    <tr className='border-b-2 border-zinc-900 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest'>
                      <th className='py-5'>Producto</th>
                      <th className='py-5 text-center'>Cant</th>
                      <th className='py-5 text-right'>Precio</th>
                      <th className='py-5 text-right'>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-zinc-100'>
                    {selectedSaleForPrint.items?.map((item: any) => (
                      <tr key={item.id} className='text-[13px]'>
                        <td className='py-5 font-bold text-zinc-900'>
                          {item.product?.device?.name}
                          <span className='block text-[10px] font-normal text-zinc-500 uppercase mt-0.5'>{item.product?.description}</span>
                        </td>
                        <td className='py-5 text-center font-bold'>{item.quantity}</td>
                        <td className='py-5 text-right'>${item.unitPrice.toLocaleString('es-AR')}</td>
                        <td className='py-5 text-right font-black'>${item.subtotal.toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className='flex justify-end pt-10 border-t-2 border-zinc-900'>
                  <div className='flex items-center gap-10'>
                    <span className='text-lg font-black uppercase text-zinc-900'>Total</span>
                    <span className='text-3xl font-black text-indigo-700'>${selectedSaleForPrint.total.toLocaleString('es-AR')}</span>
                  </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <div className='flex flex-col h-full space-y-4 animate-in fade-in duration-300 relative overflow-hidden'>
        <div className='flex items-center justify-between shrink-0 px-1'>
          <Button 
            variant='secondary' 
            size='sm' 
            onClick={() => setView('list')} 
            leftIcon={<ArrowLeft className='w-4 h-4'/>}
            className='font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/20 shadow-md'
          >
            Volver Al Listado
          </Button>
          <div className='flex items-center gap-2'>
            <ShoppingCart className='w-5 h-5 text-indigo-600' />
            <h2 className='text-lg font-bold'>Facturar Venta</h2>
          </div>
        </div>

        <div className='flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden'>
          {/* List Products */}
          <div className='lg:col-span-7 flex flex-col min-h-0 space-y-4 px-1'>
             <div className='relative shrink-0'>
                <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
                <input
                  type='text'
                  placeholder='Buscar productos...'
                  className='w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors shadow-sm'
                  value={saleSearch}
                  onChange={(e) => setSaleSearch(e.target.value)}
                />
             </div>
             
             <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-24 lg:pb-6 font-medium'>
               {filteredProducts.map(p => (
                 <button 
                  key={p.id} 
                  disabled={p.stock <= 0}
                  onClick={() => addToCart(p)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    p.stock <= 0 ? 'opacity-40 bg-zinc-50 cursor-not-allowed border-zinc-200' : 'bg-white dark:bg-zinc-900 border-zinc-200 hover:border-indigo-500 hover:shadow-md'
                  }`}
                 >
                   <div className='text-left'>
                     <h4 className='font-bold text-zinc-900 dark:text-zinc-100 text-sm'>{p.device?.name}</h4>
                     <p className='text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-tight'>{p.description || '--'}</p>
                     <span className={`text-[10px] font-bold ${p.stock < 5 ? 'text-amber-500' : 'text-zinc-500'}`}>Disp: {p.stock}</span>
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
            <div className='p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center'>
              <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Resumen de Items</span>
              <span className='bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded'>{cart.length}</span>
            </div>
            <div className='flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar'>
              {cart.map(item => (
                <div key={item.productId} className='p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 shadow-sm'>
                   <div className='flex justify-between items-start gap-2'>
                     <span className='text-xs font-bold uppercase leading-tight'>{item.name}</span>
                     <button onClick={() => removeFromCartItem(item.productId)} className='text-zinc-300 hover:text-red-500 transition-colors p-1'><Trash2 className='w-4 h-4' /></button>
                   </div>
                   <div className='flex justify-between items-center'>
                      <div className='flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded border border-zinc-200 dark:border-zinc-800'>
                        <button onClick={() => updateCartQty(item.productId, -1)} className='text-zinc-400 hover:text-zinc-800'><MinusCircle className='w-4 h-4'/></button>
                        <span className='w-6 text-center text-xs font-bold'>{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.productId, 1)} className='text-zinc-400 hover:text-zinc-800'><PlusCircle className='w-4 h-4'/></button>
                      </div>
                      <span className='font-bold text-sm'>${item.subtotal.toLocaleString('es-AR')}</span>
                   </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className='py-20 text-center opacity-30 flex flex-col items-center gap-2'>
                  <ShoppingCart className='w-8 h-8' />
                  <p className='text-[10px] font-bold uppercase tracking-widest'>Esperando items...</p>
                </div>
              )}
            </div>
            <div className='p-5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Cliente</label>
                <select 
                  className='w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors text-sm font-medium' 
                  value={selectedCustomerId} 
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className='flex justify-between items-center pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800'>
                 <span className='text-[10px] text-zinc-400 uppercase font-black'>Total</span>
                 <span className='text-2xl text-emerald-600 font-black tracking-tighter'>${cartTotal.toLocaleString('es-AR')}</span>
              </div>
              <Button fullWidth onClick={handleCreateSale} disabled={cart.length === 0 || !selectedCustomerId || isPending}>
                 {isPending ? 'Facturando...' : 'Finalizar Venta'}
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
                <div className='p-4 border-b flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 rounded-t-2xl'>
                   <h3 className='font-bold flex items-center gap-2'><ShoppingCart className='w-4 h-4' /> Carrito</h3>
                   <button onClick={() => setShowMobileCart(false)} className='p-2 text-zinc-400'><X className='w-6 h-6'/></button>
                </div>
                <div className='flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar'>
                   {cart.map(item => (
                    <div key={item.productId} className='p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2'>
                       <div className='flex justify-between items-start'>
                         <span className='text-sm font-bold uppercase leading-tight'>{item.name}</span>
                         <button onClick={() => removeFromCartItem(item.productId)} className='text-red-500 p-1'><Trash2 className='w-4 h-4' /></button>
                       </div>
                       <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-lg border border-zinc-200'>
                            <button onClick={() => updateCartQty(item.productId, -1)} className='text-zinc-500'><MinusCircle className='w-5 h-5'/></button>
                            <span className='w-8 text-center text-sm font-bold'>{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.productId, 1)} className='text-zinc-500'><PlusCircle className='w-5 h-5'/></button>
                          </div>
                          <span className='font-black text-base'>${item.subtotal.toLocaleString('es-AR')}</span>
                       </div>
                    </div>
                  ))}
                </div>
                <div className='p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 space-y-4 pb-10'>
                    <div className='space-y-1.5'>
                      <label className='text-[10px] font-black uppercase text-zinc-400 tracking-widest block'>Cliente Seleccionado</label>
                      <select 
                        className='w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500'
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                      >
                         {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className='flex justify-between items-center text-2xl font-black pt-2'>
                      <span className='text-[10px] text-zinc-400 uppercase tracking-widest'>Total</span>
                      <span className='text-emerald-600 font-black'>${cartTotal.toLocaleString('es-AR')}</span>
                    </div>
                    <Button fullWidth onClick={handleCreateSale} disabled={cart.length === 0 || !selectedCustomerId || isPending}>
                       {isPending ? '...' : 'Confirmar Venta'}
                    </Button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden animate-in fade-in duration-300'>
      <div className='flex flex-col lg:flex-row gap-4 mb-6 shrink-0'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
          <input
            type='text'
            placeholder='Filtrar ventas...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors font-medium shadow-sm'
          />
        </div>
        
        <DateRangePicker 
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />

        <button
          onClick={() => setView('new')}
          className='flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap'
        >
          <Plus className='w-5 h-5 mr-2' />
          Nueva Venta
        </button>
      </div>

      {globalMessage && (
        <div className={`shrink-0 mb-4 p-4 rounded-lg border text-sm font-bold animate-in slide-in-from-top-2 duration-300 shadow-sm ${
          globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {globalMessage.text}
        </div>
      )}

      <Table headers={['Fecha', 'Cliente', 'Vendedor', 'Total', 'Acciones']} isPending={isPending}>
        {filteredSales.map((sale) => (
          <tr key={sale.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors font-medium'>
            <td className='px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 text-sm'>
               {new Date(sale.createdAt).toLocaleDateString('es-AR')}
            </td>
            <td className='px-6 py-4 text-sm'>
               {sale.customer?.name || 'Consumidor Final'}
            </td>
            <td className='px-6 py-4'>
              <span className='px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[13px] font-bold rounded uppercase'>
                {sale.vendor?.username || 'Sistema'}
              </span>
            </td>
            <td className='px-6 py-4 text-right font-black text-zinc-900 dark:text-zinc-100'>
                ${sale.total.toLocaleString('es-AR')}
            </td>
            <td className='px-6 py-4 flex gap-2 justify-end'>
              <button 
                onClick={() => setSelectedSaleForPrint(sale)}
                className='p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-lg transition-colors'
              >
                <FileText className='w-4 h-4' />
              </button>
              {role === 'admin' && (
                <button 
                  onClick={() => setItemToDelete(sale.id)}
                  className='p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>

      {/* Delete Modal */}
      {itemToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm'>
          <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 p-6'>
            <div className='flex items-center text-red-500 mb-4'>
              <div className='p-2 bg-red-100 dark:bg-red-500/10 rounded-full mr-3'>
                <Trash2 className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Anular Venta</h3>
            </div>
            <p className='text-zinc-500 dark:text-zinc-400 text-sm mb-6'>
              ¿Deseas anular esta venta? El stock de los productos asociados será repuesto automáticamente. Esta acción no se puede deshacer.
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
                {isPending ? '...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
