import { type ProductDef } from '@/features/product/domain/product.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { PackageX, Edit, Trash2, Eye, EyeOff, Camera } from 'lucide-react';

interface ColumnActions {
  role?: string;
  onLoss: (p: ProductDef) => void;
  onEdit: (p: ProductDef) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (p: ProductDef) => void;
  onManagePhotos: (p: ProductDef) => void;
}

export function getProductColumns({ role, onLoss, onEdit, onDelete, onToggleVisibility, onManagePhotos }: ColumnActions): ColumnDef<ProductDef>[] {
  return [
    {
      header: 'Equipo y Detalle',
      cellClassName: 'max-w-[250px]',
      cell: (p) => (
        <div className='flex flex-col min-w-0'>
          <div
            className='font-bold text-zinc-900 dark:text-zinc-100 truncate'
            title={p.device?.name || '---'}
          >
            {p.device?.name || '---'}
          </div>
          <div
            className='text-xs text-zinc-500 mt-0.5 truncate'
            title={p.description || ''}
          >
            {p.description || 'Sin detalle'}
          </div>
        </div>
      ),
    },
    {
      header: 'Stock',
      cell: (p) => <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.stock > 5 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : p.stock > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>{p.stock} Uds</span>,
    },
    {
      header: 'Precio Público',
      cellClassName: 'font-semibold text-emerald-600 dark:text-emerald-400',
      cell: (p) => `$${p.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    },
    ...(role === 'admin'
      ? [
          {
            header: 'Costo',
            cellClassName: 'font-medium text-zinc-500',
            cell: (p: ProductDef) => `$${p.purchasePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          },
        ]
      : []),
    ...(role === 'admin'
      ? [
          {
            header: 'Proveedor',
            cellClassName: 'text-zinc-500 max-w-[150px] truncate',
            cell: (p: ProductDef) => <span title={p.provider?.name || '---'}>{p.provider?.name || '---'}</span>,
          },
        ]
      : []),
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      cellClassName: 'flex gap-0 xl:gap-2 justify-end',
      cell: (p: ProductDef) => (
        <>
          {role === 'admin' && (
            <button
              onClick={() => onToggleVisibility(p)}
              className={`p-1.5 rounded-lg transition ${p.showOnLanding ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10' : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-500/10'}`}
              title={p.showOnLanding ? 'Ocultar en Landing' : 'Mostrar en Landing'}
            >
              {p.showOnLanding ? <Eye className='w-4 h-4' /> : <EyeOff className='w-4 h-4' />}
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={() => onLoss(p)}
              className='p-1.5 text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition'
              title='Registrar Pérdida'
            >
              <PackageX className='w-4 h-4' />
            </button>
          )}
          {role === 'admin' ? (
            <button
              onClick={() => onEdit(p)}
              className='p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition'
              title='Editar'
            >
              <Edit className='w-4 h-4' />
            </button>
          ) : null}
          {role === 'admin' ? (
            <button
              onClick={() => onManagePhotos(p)}
              className='p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition'
              title='Gestionar Fotos'
            >
              <Camera className='w-4 h-4' />
            </button>
          ) : null}
          <button
            onClick={() => onDelete(p.id!)}
            className='p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition'
            title='Eliminar'
          >
            <Trash2 className='w-4 h-4' />
          </button>
        </>
      ),
    },
  ];
}
