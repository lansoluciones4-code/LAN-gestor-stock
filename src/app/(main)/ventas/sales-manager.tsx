'use client';

import { useState, useTransition, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  ShoppingCart, 
  User, 
  FileText, 
  Printer, 
  ArrowLeft,
  Package,
  CheckCircle2,
  ChevronRight,
  MonitorSmartphone,
  Plus,
  MinusCircle,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
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
  const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // --- New Sale State ---
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [saleSearch, setSaleSearch] = useState('');
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<SaleDef | null>(null);

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
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setGlobalMessage({ type: 'error', text: `Stock máximo alcanzado (${product.stock})` });
          setTimeout(() => setGlobalMessage(null), 3000);
          return prev;
        }
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
          name: `${product.device?.name || 'Equipo'} ${product.description || ''}`,
          max: product.stock
        }
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          const newQty = i.quantity + delta;
          if (newQty > i.max) {
             setGlobalMessage({ type: 'error', text: `Stock insuficiente. Máximo: ${i.max}` });
             setTimeout(() => setGlobalMessage(null), 3000);
             return i;
          }
          if (newQty < 1) return i;
          return { ...i, quantity: newQty, subtotal: newQty * i.unitPrice };
        }
        return i;
      })
    );
  };

  const cartTotal = cart.reduce((acc, i) => acc + i.subtotal, 0);

  const handleCreateSale = async () => {
    if (cart.length === 0) return;
    startTransition(async () => {
      const result = await createSaleAction({
        customerId: selectedCustomerId || undefined,
        items: cart.map(({ name, max, ...rest }) => ({
          ...rest,
          unitPrice: rest.unitPrice.toString(),
          subtotal: rest.subtotal.toString()
        })) as any,
        total: cartTotal as any, // Schema converts to string
      });

      if (result.success) {
        setGlobalMessage({ type: 'success', text: result.message });
        setCart([]);
        setSelectedCustomerId('');
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

  const filteredSales = sales.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (s.customer?.name || 'Mostrador').toLowerCase().includes(term) || 
           (s.vendor?.username || '').toLowerCase().includes(term);
  });

  if (selectedSaleForPrint) {
    return (
      <div className='flex flex-col h-full space-y-4 animate-in fade-in duration-300'>
        <button onClick={() => setSelectedSaleForPrint(null)} className='flex items-center text-zinc-500 hover:text-indigo-600 transition-colors py-1 font-bold text-xs gap-2'>
           <ArrowLeft className='w-4 h-4'/> Volver al listado
        </button>
        <div className='flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8 rounded-lg border border-zinc-200 dark:border-zinc-800'>
            <div id='print-area' className='max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-8 sm:p-12 border border-zinc-200 dark:border-zinc-800 shadow-md rounded-lg print:border-none print:shadow-none'>
                <div className='flex justify-between items-start mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-8'>
                  <div>
                    <h2 className='text-3xl font-black text-indigo-600 dark:text-indigo-400'>STOCK APP</h2>
                    <p className='text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1'>Comprobante de Operación</p>
                  </div>
                  <div className='text-right font-mono'>
                    <div className='text-xs font-bold text-zinc-900 dark:text-zinc-100'>ID: #{selectedSaleForPrint.id.substring(0,8).toUpperCase()}</div>
                    <div className='text-[10px] text-zinc-400'>{new Date(selectedSaleForPrint.createdAt).toLocaleDateString('es-AR')} {new Date(selectedSaleForPrint.createdAt).toLocaleTimeString('es-AR')}</div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-8 mb-10'>
                   <div>
                     <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Cliente</span>
                     <p className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>{selectedSaleForPrint.customer?.name || 'Venta a Consumidor Final'}</p>
                   </div>
                   <div className='text-right'>
                     <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Atendido por</span>
                     <p className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>{selectedSaleForPrint.vendor?.username || 'Sistema'}</p>
                   </div>
                </div>

                <table className='w-full mb-10'>
                  <thead>
                    <tr className='border-b border-zinc-200 dark:border-zinc-800 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>
                      <th className='py-3'>Detalle</th>
                      <th className='py-3 text-center'>Cant</th>
                      <th className='py-3 text-right'>Unitario</th>
                      <th className='py-3 text-right'>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-zinc-50 dark:divide-zinc-800'>
                    {selectedSaleForPrint.items?.map((item: any) => (
                      <tr key={item.id} className='text-sm'>
                        <td className='py-4 font-bold text-zinc-900 dark:text-zinc-100'>
                          {item.product?.device?.name}
                          <span className='block text-[10px] font-normal text-zinc-400 uppercase'>{item.product?.description}</span>
                        </td>
                        <td className='py-4 text-center font-mono'>{item.quantity}</td>
                        <td className='py-4 text-right font-mono'>${item.unitPrice.toLocaleString('es-AR')}</td>
                        <td className='py-4 text-right font-mono font-bold'>${item.subtotal.toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className='flex justify-end pt-6 border-t-2 border-zinc-900 dark:border-zinc-100'>
                  <div className='flex items-center gap-12'>
                    <span className='text-xl font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-tighter'>NETO TOTAL</span>
                    <span className='text-3xl font-black font-mono text-zinc-900 dark:text-zinc-100'>${selectedSaleForPrint.total.toLocaleString('es-AR')}</span>
                  </div>
                </div>
                
                <div className='mt-20 pt-10 border-t border-zinc-100 dark:border-zinc-800 text-center'>
                    <p className='text-[10px] text-zinc-400 italic'>Este documento sirve como constancia de entrega de equipos y compromiso comercial.</p>
                </div>
            </div>
        </div>
        <div className='flex justify-center p-4 gap-4'>
           <button 
                onClick={() => window.print()} 
                className='flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors'
           >
             <Printer className='w-5 h-5'/> Exportar PDF / Imprimir
           </button>
        </div>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <div className='flex flex-col h-full space-y-4 animate-in fade-in duration-300'>
        <div className='flex items-center justify-between shrink-0 mb-2'>
          <button onClick={() => setView('list')} className='flex items-center text-zinc-500 hover:text-zinc-900 transition-colors uppercase text-xs font-bold gap-1'>
             <ArrowLeft className='w-4 h-4'/> Volver
          </button>
          <div className='flex items-center gap-2'>
            <ShoppingCart className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
            <h2 className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>Nueva Venta</h2>
          </div>
        </div>

        <div className='flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden'>
          {/* List Products */}
          <div className='lg:col-span-7 flex flex-col min-h-0 space-y-4'>
             <div className='relative shrink-0'>
               <Search className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
               <input
                 type='text'
                 placeholder='Buscar por modelo o descripción...'
                 className='w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500'
                 value={saleSearch}
                 onChange={(e) => setSaleSearch(e.target.value)}
               />
             </div>
             <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-4'>
               {filteredProducts.map(p => (
                 <button 
                  key={p.id} 
                  disabled={p.stock <= 0}
                  onClick={() => addToCart(p)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                    p.stock <= 0 ? 'opacity-40 bg-zinc-50 grayscale cursor-not-allowed shadow-none' : 'bg-white dark:bg-zinc-900 border-zinc-200 hover:border-indigo-500 hover:shadow-sm'
                  }`}
                 >
                   <div className='text-left'>
                     <h4 className='font-bold text-zinc-900 dark:text-zinc-100'>{p.device?.name}</h4>
                     <p className='text-[10px] text-zinc-400 uppercase font-black tracking-widest'>{p.description || 'Sin descripción'}</p>
                     <span className={`text-[10px] font-bold ${p.stock < 3 ? 'text-amber-500' : 'text-zinc-400'}`}>Q. Disponible: {p.stock}</span>
                   </div>
                   <div className='text-right'>
                      <div className='text-lg font-black font-mono leading-none'>${p.salePrice.toLocaleString('es-AR')}</div>
                      <div className='text-[10px] text-zinc-400 uppercase font-bold tracking-tighter mt-1'>Añadir Item</div>
                   </div>
                 </button>
               ))}
             </div>
          </div>

          {/* Cart */}
          <div className='lg:col-span-5 flex flex-col bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shrink-0'>
            <div className='p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center'>
              <span className='text-xs font-light uppercase text-zinc-500'>Ticket de Salida</span>
              <span className='bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded'>{cart.length} ITEMS</span>
            </div>
            <div className='flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar min-h-[150px]'>
              {cart.map(item => (
                <div key={item.productId} className='p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 shadow-sm'>
                   <div className='flex justify-between items-start gap-2'>
                     <span className='text-[11px] font-bold leading-tight uppercase'>{item.name}</span>
                     <button onClick={() => removeFromCart(item.productId)} className='text-zinc-300 hover:text-red-500 transition-colors p-1'><Trash2 className='w-4 h-4' /></button>
                   </div>
                   <div className='flex justify-between items-center mt-1'>
                      <div className='flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded border'>
                        <button onClick={() => updateCartQty(item.productId, -1)} className='text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'><MinusCircle className='w-4 h-4'/></button>
                        <span className='w-6 text-center text-xs font-mono font-bold'>{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.productId, 1)} className='text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'><PlusCircle className='w-4 h-4'/></button>
                      </div>
                      <span className='font-bold font-mono text-sm'>${item.subtotal.toLocaleString('es-AR')}</span>
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
                <label className='text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest'>Cliente a Facturar</label>
                <select className='w-full p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm' value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                    <option value=''>Cliente Mostrador Final</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className='flex justify-between items-center text-2xl font-black gap-2'>
                 <span className='text-sm text-zinc-400 uppercase font-bold tracking-tighter'>Neto</span>
                 <span className='text-emerald-600 dark:text-emerald-500 font-mono'>${cartTotal.toLocaleString('es-AR')}</span>
              </div>
              <button 
                onClick={handleCreateSale} 
                disabled={cart.length === 0 || isPending} 
                className='w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 transition-colors shadow-sm uppercase text-sm'
              >
                {isPending ? 'Validando stock...' : 'Finalizar Operación'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      {/* Header Search & CTA */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6 shrink-0'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
          <input
            type='text'
            placeholder='Filtrar por cliente, documento o vendedor...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 dark:text-zinc-100 transition-colors'
          />
        </div>
        <button
          onClick={() => setView('new')}
          className='flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap'
        >
          <Plus className='w-5 h-5 mr-2' />
          Nueva Venta
        </button>
      </div>

      {globalMessage && (
        <div className={`shrink-0 mb-4 p-4 rounded-lg flex items-center border text-sm animate-in fade-in duration-300 ${
          globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'
        }`}>
          {globalMessage.text}
        </div>
      )}

      {/* Table Historial */}
      <div className='relative overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 flex-1 bg-white dark:bg-zinc-900 custom-scrollbar'>
        <table className='w-full text-sm text-left text-zinc-600 dark:text-zinc-400'>
          <thead className='sticky top-0 z-10 text-xs font-bold uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'>
            <tr>
              <th scope='col' className='px-6 py-4'>Fecha</th>
              <th scope='col' className='px-6 py-4'>Cliente</th>
              <th scope='col' className='px-6 py-4'>Operador</th>
              <th scope='col' className='px-6 py-4 text-right'>Importe</th>
              <th scope='col' className='px-6 py-4 text-right'>Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-zinc-200 dark:divide-zinc-800 ${isPending ? 'opacity-50' : ''}`}>
            {filteredSales.map((sale) => (
              <tr key={sale.id} className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors'>
                <td className='px-6 py-4 font-mono font-bold text-zinc-900 dark:text-zinc-100'>
                   {new Date(sale.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className='px-6 py-4'>
                  <div className='font-bold text-zinc-700 dark:text-zinc-300'>{sale.customer?.name || 'Venta Mostrador'}</div>
                </td>
                <td className='px-6 py-4 font-medium'>
                  <span className='px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded uppercase tracking-tighter'>
                    {sale.vendor?.username || 'Sistema'}
                  </span>
                </td>
                <td className='px-6 py-4 text-right font-black text-zinc-900 dark:text-zinc-100 font-mono'>
                    ${sale.total.toLocaleString('es-AR')}
                </td>
                <td className='px-6 py-4 flex gap-2 justify-end'>
                  <button 
                    onClick={() => setSelectedSaleForPrint(sale)}
                    className='p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-lg transition-colors'
                    title='Ver Comprobante'
                  >
                    <FileText className='w-4 h-4' />
                  </button>
                  {role === 'admin' && (
                    <button 
                      onClick={() => {
                        if(confirm('¿Seguro que deseas anular esta venta? El stock será devuelto automáticamente.')) {
                             startTransition(async () => {
                                 const res = await deleteSaleAction(sale.id);
                                 setGlobalMessage({ type: res.success ? 'success' : 'error', text: res.message });
                                 if(res.success) loadData();
                                 setTimeout(() => setGlobalMessage(null), 3500);
                             });
                        }
                      }}
                      className='p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors'
                      title='Anular Venta'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && !isPending && (
              <tr><td colSpan={5} className='px-6 py-12 text-center text-zinc-400'>No se registran movimientos de caja</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
