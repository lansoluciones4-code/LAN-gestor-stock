/* eslint-disable react/display-name */
import { Edit, Trash2, Eye, EyeOff, Camera } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type ProductDef } from '@/features/product/domain/product.schema';

interface ProductCardActionsProps {
  role?: string;
  onEdit: (p: ProductDef) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (p: ProductDef) => void;
  onManagePhotos: (p: ProductDef) => void;
}

function stockLabel(stock: number) {
  const label = `${stock} ${stock === 1 ? 'Unidad' : 'Unidades'}`;
  if (stock > 5) return { text: label, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  if (stock > 0) return { text: label, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  return { text: 'Sin stock', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
}

export function renderProductCard(actions: ProductCardActionsProps) {
  return (product: ProductDef) => {
    const stock = stockLabel(product.stock);
    return (
      <EntityCard
        key={product.id}
        title={product.device?.name ?? '---'}
        subtitle={product.description ?? 'Sin detalle'}
        badges={
          <>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${stock.cls}`}>{stock.text}</span>
            {actions.role === 'admin' && product.showOnLanding && (
              <span className='px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400'>
                En landing
              </span>
            )}
          </>
        }
        details={
          <div className='flex flex-col gap-1 mt-1'>
            <div className='flex justify-between items-center'>
              <span className='text-xs text-zinc-400'>Precio público</span>
              <span className='font-semibold text-zinc-600 dark:text-zinc-400'>
                ${product.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {actions.role === 'admin' && (
              <>
                <div className='flex justify-between items-center'>
                  <span className='text-xs text-zinc-400'>Costo</span>
                  <span className='text-zinc-500'>
                    ${product.purchasePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {product.provider?.name && (
                  <div className='flex justify-between items-center'>
                    <span className='text-xs text-zinc-400'>Proveedor</span>
                    <span className='text-zinc-500 truncate max-w-[140px]' title={product.provider.name}>
                      {product.provider.name}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        }
        actions={
          <>
            {actions.role === 'admin' && (
              <CardAction
                icon={product.showOnLanding ? <Eye className='w-4 h-4' /> : <EyeOff className='w-4 h-4' />}
                label={product.showOnLanding ? 'Ocultar en Landing' : 'Mostrar en Landing'}
                onClick={() => actions.onToggleVisibility(product)}
                variant={product.showOnLanding ? 'success' : 'default'}
              />
            )}
            {actions.role === 'admin' && (
              <CardAction
                icon={<Edit className='w-4 h-4' />}
                label='Editar'
                onClick={() => actions.onEdit(product)}
              />
            )}
            {actions.role === 'admin' && (
              <CardAction
                icon={<Camera className='w-4 h-4' />}
                label='Gestionar Fotos'
                onClick={() => actions.onManagePhotos(product)}
              />
            )}
            <CardAction
              icon={<Trash2 className='w-4 h-4' />}
              label='Eliminar'
              onClick={() => actions.onDelete(product.id!)}
              variant='danger'
            />
          </>
        }
      />
    );
  };
}
