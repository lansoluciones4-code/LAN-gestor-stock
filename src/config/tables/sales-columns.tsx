import { type SaleDef } from '@/schemas/sale.schema';
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
      cellClassName: 'whitespace-nowrap font-bold text-zinc-900 dark:text-zinc-100',
      cell: (s) => (
        <>
          {new Date(s.createdAt).toLocaleDateString('es-AR')}
          <span className="text-indigo-600 dark:text-indigo-400 ml-1 font-bold">{new Date(s.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
        </>
      ),
    },
    {
      header: 'Cliente',
      cellClassName: 'text-zinc-500',
      cell: (s) => s.customer?.name || 'Consumidor Final',
    },
    {
      header: 'Vendedor',
      cell: (s) => <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[13px] font-bold rounded uppercase">{s.vendor?.username || 'Sistema'}</span>,
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
      cellClassName: 'flex gap-2 justify-end',
      cell: (s: SaleDef) => (
        <>
          <button
            onClick={() => onPrint(s)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
            title="Imprimir Factura"
          >
            <FileText className="w-4 h-4" />
          </button>
          {role === 'admin' && (
            <button
              onClick={() => onDelete(s.id!)}
              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Anular Venta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </>
      ),
    },
  ];
}
