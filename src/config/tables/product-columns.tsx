import { type ProductDef } from '@/schemas/product.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { PackageX, Edit, Trash2 } from 'lucide-react';

interface ColumnActions {
  role?: string;
  onLoss: (p: ProductDef) => void;
  onEdit: (p: ProductDef) => void;
  onDelete: (id: string) => void;
}

export function getProductColumns({ role, onLoss, onEdit, onDelete }: ColumnActions): ColumnDef<ProductDef>[] {
  return [
    {
      header: 'Equipo y Detalle',
      cell: (p) => (
        <>
          <div className="font-bold text-zinc-900 dark:text-zinc-100">{p.device?.name || '---'}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{p.description}</div>
        </>
      ),
    },
    {
      header: 'Stock',
      cell: (p) => <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.stock > 5 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : p.stock > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>{p.stock} Uds</span>,
    },
    {
      header: 'Precio Público',
      cellClassName: 'font-semibold text-emerald-600 dark:text-emerald-400',
      cell: (p) => `$${p.salePrice}`,
    },
    ...(role === 'admin'
      ? [
          {
            header: 'Costo',
            cellClassName: 'font-medium text-zinc-500',
            cell: (p: ProductDef) => `$${p.purchasePrice}`,
          },
        ]
      : []),
    {
      header: 'Proveedor',
      cellClassName: 'text-zinc-500',
      cell: (p) => p.provider?.name || '---',
    },
    ...(role === 'admin'
      ? [
          {
            header: 'Acciones',
            headerClassName: 'text-right',
            cellClassName: 'flex gap-2 justify-end',
            cell: (p: ProductDef) => (
              <>
                <button
                  onClick={() => onLoss(p)}
                  className="p-2 text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition"
                  title="Registrar Pérdida"
                >
                  <PackageX className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(p)}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(p.id!)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ),
          },
        ]
      : []),
  ];
}
