import { type ProductDef } from '@/features/product/domain/product.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Edit, Trash2, Eye, EyeOff, Camera } from 'lucide-react';

interface ColumnActions {
  role?: string;
  onEdit: (p: ProductDef) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (p: ProductDef) => void;
  onManagePhotos: (p: ProductDef) => void;
}

export function getProductColumns({ role, onEdit, onDelete, onToggleVisibility, onManagePhotos }: ColumnActions): ColumnDef<ProductDef>[] {
  return [
    {
      header: 'Equipo y Detalle',
      cellClassName: 'max-w-[250px]',
      cell: (p) => {
        const categoryBrand = [p.device?.category, p.device?.brand].filter(Boolean).join(' · ');
        return (
          <div className='flex flex-col min-w-0'>
            {categoryBrand && (
              <div
                className='text-[10px] font-bold uppercase tracking-wide text-zinc-400 truncate'
                title={categoryBrand}
              >
                {categoryBrand}
              </div>
            )}
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
        );
      },
    },
    {
      header: 'Stock',
      cell: (p) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            p.stock > 5
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : p.stock > 0
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {p.stock > 0 ? `${p.stock} Uds` : 'Sin stock'}
        </span>
      ),
    },
    {
      header: 'Precio Público',
      cellClassName: 'font-semibold text-zinc-600 dark:text-zinc-400',
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
              className={`p-1.5 rounded-lg transition ${p.showOnLanding ? 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-500/10' : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-500/10'}`}
              title={p.showOnLanding ? 'Ocultar en Landing' : 'Mostrar en Landing'}
            >
              {p.showOnLanding ? <Eye className='w-4 h-4' /> : <EyeOff className='w-4 h-4' />}
            </button>
          )}
          {role === 'admin' ? (
            <button
              onClick={() => onEdit(p)}
              className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-500/10 rounded-lg transition'
              title='Editar'
            >
              <Edit className='w-4 h-4' />
            </button>
          ) : null}
          {role === 'admin' ? (
            <button
              onClick={() => onManagePhotos(p)}
              className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-500/10 rounded-lg transition'
              title='Gestionar Fotos'
            >
              <Camera className='w-4 h-4' />
            </button>
          ) : null}
          <button
            onClick={() => onDelete(p.id!)}
            className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-500/10 rounded-lg transition'
            title='Eliminar'
          >
            <Trash2 className='w-4 h-4' />
          </button>
        </>
      ),
    },
  ];
}
