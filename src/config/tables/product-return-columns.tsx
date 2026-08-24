import { type ProductReturnDef } from '@/features/product-return/domain/product-return.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';

export function getProductReturnColumns(): ColumnDef<ProductReturnDef>[] {
  return [
    {
      header: 'Producto',
      cellClassName: 'max-w-[220px]',
      cell: (r) => (
        <div
          className='font-bold text-zinc-900 dark:text-zinc-100 truncate'
          title={r.product?.device?.name || 'Producto eliminado'}
        >
          {r.product?.device?.name || 'Producto eliminado'}
        </div>
      ),
    },
    {
      header: 'Cantidad',
      headerClassName: 'text-center',
      cellClassName: 'text-center font-bold text-zinc-700 dark:text-zinc-300',
      cell: (r) => r.quantity,
    },
    {
      header: 'Motivo',
      cellClassName: 'text-zinc-500 max-w-[220px] truncate',
      cell: (r) => <span title={r.reason}>{r.reason}</span>,
    },
    {
      header: 'Monto',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-bold text-zinc-700 dark:text-zinc-300',
      cell: (r) => `$${r.amount.toLocaleString('es-AR')}`,
    },
    {
      header: 'Usuario',
      cellClassName: 'text-zinc-500 max-w-[140px] truncate',
      cell: (r) => r.user?.username || 'Desconocido',
    },
    {
      header: 'Fecha',
      cellClassName: 'text-zinc-500 whitespace-nowrap',
      cell: (r) => new Date(r.createdAt).toLocaleDateString('es-AR'),
    },
  ];
}
