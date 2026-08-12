import { useState } from 'react';
import { Printer, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type PrintCartItem } from '../hooks/usePrintCart';
import { SaleCustomerPicker, isCustomerSelectionValid, type SaleCustomerSelection } from './sale-customer-picker';
import { blockInvalidPriceKey } from '@/lib/utils';

interface PrintSaleViewProps {
  items: PrintCartItem[];
  addItem: (pages: number, colorMode: 'color' | 'blanco_y_negro', unitPrice: number) => void;
  removeItem: (id: string) => void;
  printTotal: number;
  customerSelection: SaleCustomerSelection;
  setCustomerSelection: (v: SaleCustomerSelection) => void;
  isPending: boolean;
  onConfirmSale: () => void;
  onCancel: () => void;
}

export function PrintSaleView({ items, addItem, removeItem, printTotal, setCustomerSelection, isPending, onConfirmSale, onCancel }: PrintSaleViewProps) {
  const [pages, setPages] = useState('');
  const [colorMode, setColorMode] = useState<'color' | 'blanco_y_negro'>('blanco_y_negro');
  const [unitPrice, setUnitPrice] = useState('');
  const [customerSelectionState, setCustomerSelectionState] = useState<SaleCustomerSelection>({ mode: 'final' });

  const handleAdd = () => {
    const pagesNum = Math.floor(Number((pages || '').replace(',', '.')));
    const priceNum = Number((unitPrice || '').replace(',', '.'));
    if (!pagesNum || pagesNum <= 0 || isNaN(priceNum) || priceNum < 0) return;
    addItem(pagesNum, colorMode, priceNum);
    setPages('');
    setUnitPrice('');
  };

  const handleCustomerChange = (selection: SaleCustomerSelection) => {
    setCustomerSelectionState(selection);
    setCustomerSelection(selection);
  };

  return (
    <div className='flex flex-col h-full space-y-4 animate-in fade-in duration-300 relative overflow-hidden'>
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between shrink-0 px-1 gap-3 sm:gap-0'>
        <Button
          variant='secondary'
          size='sm'
          onClick={onCancel}
          leftIcon={<ArrowLeft className='w-4 h-4' />}
          className='w-full sm:w-auto font-bold border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-900/30 dark:text-zinc-400 dark:hover:bg-zinc-900/20 shadow-md h-10'
        >
          <span className='hidden sm:inline'>Volver Al Listado</span>
          <span className='sm:hidden'>Volver</span>
        </Button>
        <div className='flex items-center justify-center sm:justify-end gap-2 min-w-0 bg-white dark:bg-transparent border border-zinc-200 dark:border-transparent rounded-lg py-2 sm:py-0 shadow-sm sm:shadow-none'>
          <Printer className='w-5 h-5 text-zinc-600 shrink-0' />
          <h2 className='text-base sm:text-lg font-bold truncate'>Facturar Impresión</h2>
        </div>
      </div>

      <div className='flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto custom-scrollbar px-1 pb-6'>
        <div className='lg:col-span-7 space-y-4'>
          <div className='p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4'>
            <h3 className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Nueva Impresión</h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-medium mb-1.5'>Cantidad de Hojas</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={pages}
                  onChange={(e) => setPages(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder='Ej: 50'
                  className='w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
                />
              </div>
              <div>
                <label className='block text-xs font-medium mb-1.5'>Precio por Hoja ($)</label>
                <input
                  type='text'
                  inputMode='decimal'
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value.replace(/\./g, ''))}
                  onKeyDown={blockInvalidPriceKey}
                  placeholder='0,00'
                  className='w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
                />
              </div>
            </div>
            <div>
              <label className='block text-xs font-medium mb-1.5'>Modo de Impresión</label>
              <div className='grid grid-cols-2 gap-3'>
                <button
                  type='button'
                  onClick={() => setColorMode('blanco_y_negro')}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all font-bold text-xs uppercase ${colorMode === 'blanco_y_negro' ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 text-zinc-700' : 'border-transparent bg-zinc-50 dark:bg-zinc-950 text-zinc-400'}`}
                >
                  Blanco y Negro
                </button>
                <button
                  type='button'
                  onClick={() => setColorMode('color')}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all font-bold text-xs uppercase ${colorMode === 'color' ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 text-zinc-700' : 'border-transparent bg-zinc-50 dark:bg-zinc-950 text-zinc-400'}`}
                >
                  Color
                </button>
              </div>
            </div>
            <Button
              fullWidth
              variant='secondary'
              onClick={handleAdd}
              leftIcon={<Plus className='w-4 h-4' />}
            >
              Agregar a la Venta
            </Button>
          </div>

          <div>
            <label className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2'>Cliente</label>
            <SaleCustomerPicker onChange={handleCustomerChange} />
          </div>
        </div>

        <div className='lg:col-span-5 flex flex-col bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-sm'>
          <div className='p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/30 flex justify-between items-center shrink-0'>
            <span className='text-[10px] font-black uppercase text-zinc-400 tracking-widest'>Impresiones Cargadas</span>
            <span className='bg-zinc-600 text-white text-[10px] font-bold px-2 py-0.5 rounded'>{items.length}</span>
          </div>
          <div className='flex-1 min-h-0 overflow-y-auto p-4 space-y-2 custom-scrollbar'>
            {items.map((item) => (
              <div
                key={item.id}
                className='p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 shadow-sm'
              >
                <div className='min-w-0'>
                  <p className='text-xs font-bold uppercase truncate'>
                    {item.pages} hojas · {item.colorMode === 'color' ? 'Color' : 'B&N'}
                  </p>
                  <p className='text-[10px] text-zinc-400'>${item.unitPrice.toLocaleString('es-AR')} c/u</p>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <span className='font-bold text-sm'>${item.subtotal.toLocaleString('es-AR')}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className='text-zinc-300 hover:text-zinc-500 transition-colors p-1'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className='py-10 text-center opacity-30 flex flex-col items-center gap-2'>
                <Printer className='w-8 h-8' />
                <p className='text-[10px] font-bold uppercase tracking-widest'>Esperando impresiones...</p>
              </div>
            )}
          </div>
          <div className='p-5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-4 rounded-b-xl shrink-0'>
            <div className='flex justify-between items-center pt-2'>
              <span className='text-[10px] text-zinc-400 uppercase font-black'>Total Venta</span>
              <span className='text-3xl text-zinc-600 font-black tracking-tighter'>${printTotal.toLocaleString('es-AR')}</span>
            </div>
            <Button
              fullWidth
              onClick={onConfirmSale}
              size='lg'
              disabled={items.length === 0 || !isCustomerSelectionValid(customerSelectionState) || isPending}
            >
              {isPending ? 'Procesando...' : 'Siguiente: Descuentos'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
