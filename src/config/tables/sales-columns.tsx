import { type SaleDef } from '@/features/sale/domain/sale.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { FileText, Trash2 } from 'lucide-react';

interface ColumnActions {
  role?: string;
  onPrint: (s: SaleDef) => void;
  onDelete: (id: string) => void;
}

export function getSalesColumns({ role, onPrint, onDelete }: ColumnActions): ColumnDef<SaleDef>[] {
  return [
    {
      header: 'Fecha de Emisión',
      cellClassName: 'whitespace-nowrap font-bold text-zinc-900 dark:text-zinc-100 truncate',
      cell: (s) => {
        const date = new Date(s.createdAt);
        const dateString = date.toLocaleDateString('es-AR');
        const timeString = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        return (
          <>
            {dateString}
            <span
              title={timeString}
              className='text-indigo-600 dark:text-indigo-400 ml-1 font-bold'
            >
              {timeString}
            </span>
          </>
        );
      },
    },
    {
      header: 'Cliente',
      cellClassName: 'text-zinc-500 max-w-[150px] truncate',
      cell: (s) => <span title={s.customer?.name || 'Consumidor Final'}>{s.customer?.name || 'Consumidor Final'}</span>,
    },
    {
      header: 'Vend.',
      cellClassName: 'max-w-[70px] truncate',
      cell: (s) => (
        <span
          className='px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[13px] font-black rounded uppercase truncate block w-fit'
          title={s.vendor?.username || 'Sistema'}
        >
          {s.vendor?.username || 'Sistema'}
        </span>
      ),
    },
    {
      header: 'Pago',
      cellClassName: 'whitespace-nowrap',
      cell: (s) => (
        <div className='flex gap-1'>
          {s.payments?.map((p, i) => (
            <span
              key={i}
              className={`px-1.5 py-0.5 text-[15px] font-black uppercase rounded ${p.type === 'efectivo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}
            >
              {p.type === 'efectivo' ? 'EF' : 'TR'}
            </span>
          ))}
          {(!s.payments || s.payments.length === 0) && <span className='text-[10px] text-zinc-400 font-bold italic'>--</span>}
        </div>
      ),
    },
    {
      header: 'Desc.',
      headerClassName: 'text-right',
      cellClassName: 'text-right whitespace-nowrap',
      cell: (s) => (
        <div className='flex flex-col items-end gap-0.5 text-[14px] font-bold'>
          {s.discountPercentage > 0 && <span className='text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1 rounded'>-{s.discountPercentage}%</span>}
          {s.discountAmount > 0 && <span className='text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1 rounded'>-${s.discountAmount.toLocaleString('es-AR')}</span>}
          {s.discountPercentage === 0 && s.discountAmount === 0 && <span className='text-zinc-300 dark:text-zinc-700'>--</span>}
        </div>
      ),
    },
    {
      header: 'Total',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-black text-zinc-900 dark:text-zinc-100',
      cell: (s) => `$${s.total.toLocaleString('es-AR')}`,
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      cellClassName: 'flex gap-1 justify-end',
      cell: (s: SaleDef) => (
        <>
          <button
            onClick={() => onPrint(s)}
            className='p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-lg transition-colors'
            title='Imprimir Factura'
          >
            <FileText className='w-4 h-4' />
          </button>
          {role === 'admin' && (
            <button
              onClick={() => onDelete(s.id!)}
              className='p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors'
              title='Anular Venta'
            >
              <Trash2 className='w-4 h-4' />
            </button>
          )}
        </>
      ),
    },
  ];
}
