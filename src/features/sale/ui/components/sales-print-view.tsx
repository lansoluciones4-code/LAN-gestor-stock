import { useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { type SaleDef } from '@/features/sale/domain/sale.schema';
import { Button } from '@/components/ui/button';
import { getPaymentTypeMeta } from '@/lib/payment-types';

export function SalesPrintView({ sale, onClose }: { sale: SaleDef; onClose: () => void }) {
  const itemsSubtotal = (sale.items?.reduce((acc, item) => acc + item.subtotal, 0) || 0) + (sale.printItems?.reduce((acc, item) => acc + item.subtotal, 0) || 0) + (sale.serviceItems?.reduce((acc, item) => acc + item.subtotal, 0) || 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className='flex flex-col h-full space-y-4 animate-in fade-in duration-300 overflow-hidden bg-zinc-50 dark:bg-zinc-950 px-1'>
      <div className='flex items-center justify-between sticky top-4 bg-white dark:bg-zinc-900 px-4 py-3 z-30 border-b border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl mx-2 no-print'>
        <Button
          variant='secondary'
          size='sm'
          onClick={onClose}
          leftIcon={<ArrowLeft className='w-4 h-4' />}
          className='font-bold border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-900/30 dark:text-zinc-400 dark:hover:bg-zinc-900/20 shadow-md'
        >
          Volver
        </Button>
        <div className='flex gap-2 shrink-0'>
          <Button
            size='sm'
            variant='secondary'
            onClick={() => window.print()}
            leftIcon={<Printer className='w-4 h-4' />}
          >
            Imprimir Comprobante
          </Button>
        </div>
      </div>

      <div className='flex-1 overflow-auto p-4 sm:p-10 custom-scrollbar'>
        <div
          id='print-area-wrapper'
          className='bg-white text-zinc-900 p-4 sm:p-12 border border-zinc-200 rounded-xl shadow-lg max-w-2xl mx-auto'
        >
          <div className='grid grid-cols-3 items-start mb-12 border-b-2 border-zinc-50 pb-8'>
            <div>
              <h2 className='text-5xl font-black text-zinc-600'>LAN</h2>
              <p className='text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1'>Soluciones Tecnológicas</p>
            </div>
            <div className='flex justify-center'>
              <img
                src='/LAN_icono.jpg'
                alt='LAN Soluciones Tecnológicas'
                className='w-28 h-28 rounded-full object-cover border border-zinc-200 shadow-sm shrink-0'
              />
            </div>
            <div className='text-right'>
              <div className='text-[11px] font-bold text-zinc-900 uppercase'>
                ID:
                {sale.id.substring(0, 8).toUpperCase()}
              </div>
              <div className='text-[10px] text-zinc-500 font-medium'>{new Date(sale.createdAt).toLocaleDateString('es-AR')}</div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-10 mb-16'>
            <div>
              <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Cliente</span>
              <p className='text-sm font-bold text-zinc-800'>{sale.customer?.name || 'Consumidor Final'}</p>
            </div>
            <div className='text-right'>
              <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Vendedor</span>
              <p className='text-sm font-bold text-zinc-800'>{sale.vendor?.username || 'SISTEMA'}</p>
            </div>
          </div>

          {sale.items && sale.items.length > 0 && (
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
                {sale.items.map((item: any) => (
                  <tr
                    key={item.id}
                    className='text-[13px] text-zinc-900'
                  >
                    <td className='py-5 font-bold text-zinc-900'>
                      {item.product?.device?.name}
                      <span className='block text-[10px] font-normal text-zinc-500 uppercase mt-0.5'>{item.product?.description}</span>
                    </td>
                    <td className='py-5 text-center font-bold text-zinc-900'>{item.quantity}</td>
                    <td className='py-5 text-right text-zinc-900'>${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className='py-5 text-right font-black text-zinc-900'>${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {sale.printItems && sale.printItems.length > 0 && (
            <table className='w-full mb-16'>
              <thead>
                <tr className='border-b-2 border-zinc-900 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest'>
                  <th className='py-5'>Modo</th>
                  <th className='py-5 text-right'>Importe</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-zinc-100'>
                {sale.printItems.map((item: any) => (
                  <tr
                    key={item.id}
                    className='text-[13px] text-zinc-900'
                  >
                    <td className='py-5 font-bold text-zinc-900 uppercase'>{item.colorMode === 'color' ? 'Color' : 'Blanco y Negro'}</td>
                    <td className='py-5 text-right font-black text-zinc-900'>${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {sale.serviceItems && sale.serviceItems.length > 0 && (
            <table className='w-full mb-16'>
              <thead>
                <tr className='border-b-2 border-zinc-900 text-left text-[10px] font-bold text-zinc-900 uppercase tracking-widest'>
                  <th className='py-5'>Servicio</th>
                  <th className='py-5 text-center'>Cant</th>
                  <th className='py-5 text-right'>Valor</th>
                  <th className='py-5 text-right'>Subtotal</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-zinc-100'>
                {sale.serviceItems.map((item: any) => (
                  <tr
                    key={item.id}
                    className='text-[13px] text-zinc-900'
                  >
                    <td className='py-5 font-bold text-zinc-900'>{item.technicalService?.name ?? 'Servicio técnico'}</td>
                    <td className='py-5 text-center font-bold text-zinc-900'>{item.quantity}</td>
                    <td className='py-5 text-right text-zinc-900'>${item.unitValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className='py-5 text-right font-black text-zinc-900'>${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className='flex justify-between items-start pt-8 border-t-2 border-zinc-900 mt-8 gap-8'>
            <div className='flex flex-col gap-2 flex-1'>
              <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>Información de Pago</span>
              <div className='flex flex-col gap-1'>
                {sale.payments?.map((p: any, i: number) => (
                  <div
                    key={i}
                    className='flex flex-col text-[11px] font-bold text-zinc-700 max-w-[220px]'
                  >
                    <div className='flex justify-between items-center'>
                      <span className='uppercase'>
                        {getPaymentTypeMeta(p.type).label}
                        {p.card?.name && ` · ${p.card.name}`}
                      </span>
                      <span>${p.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {p.installments > 1 && (
                      <span className='text-[9px] font-medium text-zinc-500 normal-case'>
                        {p.installments} cuotas de ${(p.amount / p.installments).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} c/u
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className='flex flex-col items-end gap-2 flex-1 min-w-[250px]'>
              {((sale.discountAmount ?? 0) > 0 || (sale.discountPercentage ?? 0) > 0) && (
                <>
                  <div className='flex justify-between w-full text-xs font-bold text-zinc-500 border-b border-zinc-100 pb-2'>
                    <span className='uppercase tracking-widest'>Subtotal</span>
                    <span>${itemsSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {sale.discountPercentage! > 0 && (
                    <div className='flex justify-between w-full text-[11px] font-bold text-zinc-600 mt-1'>
                      <span className='uppercase'>Descuento ({sale.discountPercentage}%)</span>
                      <span>-${(itemsSubtotal * (sale.discountPercentage! / 100)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {sale.discountAmount! > 0 && (
                    <div className='flex justify-between w-full text-[11px] font-bold text-zinc-600'>
                      <span className='uppercase'>Descuento en Monto</span>
                      <span>-${sale.discountAmount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </>
              )}
              <div className='flex justify-between w-full items-center mt-2'>
                <span className='text-xl font-black uppercase text-zinc-900 pt-2'>Total</span>
                <span className='text-3xl font-black text-zinc-700 forced-color-black animate-in fade-in zoom-in duration-500 delay-300'>${sale.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className='print-footer mt-10 pt-4 border-t border-zinc-100 text-center'>
            <p className='text-[15px] text-zinc-400 font-medium leading-relaxed'>
              LAN Soluciones Tecnológicas de Franco BISSIO · CUIT 20-31923402-1
              <br />
              Avenida Guillermo Hudson 196 · Rawson - Chubut · CEL: 2804777200
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
