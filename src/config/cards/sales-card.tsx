/* eslint-disable react/display-name */
import { FileText, Trash2 } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type SaleDef } from '@/features/sale/domain/sale.schema';

interface SaleCardActionsProps {
  role?: string;
  onPrint: (s: SaleDef) => void;
  onDelete: (id: string) => void;
}

function formatDate(raw: string | Date) {
  const d = new Date(raw);
  return {
    date: d.toLocaleDateString('es-AR'),
    time: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function renderSaleCard(actions: SaleCardActionsProps) {
  return (sale: SaleDef) => {
    const { date, time } = formatDate(sale.createdAt);

    return (
      <EntityCard
        key={sale.id}
        title={
          <span>
            {date}{' '}
            <span className='text-indigo-600 dark:text-indigo-400 font-bold'>{time}</span>
          </span>
        }
        subtitle={sale.customer?.name ?? 'Consumidor Final'}
        badges={
          <div className='flex flex-wrap gap-1'>
            {sale.payments?.map((p, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 text-xs font-black uppercase rounded ${p.type === 'efectivo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}
              >
                {p.type === 'efectivo' ? 'Efectivo' : 'Transferencia'}
              </span>
            ))}
          </div>
        }
        details={
          <div className='flex flex-col gap-1 mt-1'>
            <div className='flex justify-between items-center'>
              <span className='text-xs text-zinc-400'>Vendedor</span>
              <span className='px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-black rounded uppercase'>
                {sale.vendor?.username ?? 'Sistema'}
              </span>
            </div>
            {(sale.discountPercentage > 0 || sale.discountAmount > 0) && (
              <div className='flex justify-between items-center'>
                <span className='text-xs text-zinc-400'>Descuento</span>
                <span className='text-emerald-600 dark:text-emerald-400 font-bold text-sm'>
                  {sale.discountPercentage > 0 ? `-${sale.discountPercentage}%` : `-$${sale.discountAmount.toLocaleString('es-AR')}`}
                </span>
              </div>
            )}
            <div className='flex justify-between items-center'>
              <span className='text-xs text-zinc-400'>Total</span>
              <span className='font-black text-zinc-900 dark:text-zinc-100 text-base'>
                ${sale.total.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        }
        actions={
          <>
            <CardAction
              icon={<FileText className='w-4 h-4' />}
              label='Imprimir Factura'
              onClick={() => actions.onPrint(sale)}
            />
            {actions.role === 'admin' && (
              <CardAction
                icon={<Trash2 className='w-4 h-4' />}
                label='Anular Venta'
                onClick={() => actions.onDelete(sale.id!)}
                variant='danger'
              />
            )}
          </>
        }
      />
    );
  };
}
