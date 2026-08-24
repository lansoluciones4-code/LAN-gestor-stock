'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Undo2, ArrowLeft } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ErrorAlert } from '@/components/ui/alert';
import { productReturnCreateSchema, type ProductReturnInput } from '@/features/product-return/domain/product-return.schema';
import { type ProductDef } from '@/features/product/domain/product.schema';

interface ReturnFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductReturnInput) => void;
  serverError?: string | null;
  isPending?: boolean;
  products: ProductDef[];
}

export function ReturnFormModal({ isOpen, onClose, onSubmit, serverError, isPending, products }: ReturnFormModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductDef | null>(null);
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductReturnInput>({
    resolver: zodResolver(productReturnCreateSchema),
  });

  const handleClose = () => {
    setSelectedProduct(null);
    setSearch('');
    reset({ productId: '', quantity: 1, reason: '', amount: 0 });
    onClose();
  };

  const handleSelectProduct = (p: ProductDef) => {
    setSelectedProduct(p);
    setValue('productId', p.id!, { shouldValidate: true });
    setValue('quantity', 1, { shouldValidate: true });
    setValue('amount', p.salePrice, { shouldValidate: true });
  };

  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const terms = search.toLowerCase().trim().split(/\s+/);
    const combinedText = `${p.device?.name || ''} ${p.device?.category || ''} ${p.device?.brand || ''} ${p.description || ''}`.toLowerCase();
    return terms.every((word) => combinedText.includes(word));
  });

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title='Registrar Devolución'
      icon={<Undo2 className='w-5 h-5 text-zinc-500' />}
      width='lg'
      onSubmit={selectedProduct ? handleSubmit((data) => onSubmit(data)) : undefined}
      submitLabel='Registrar Devolución'
      isPending={isPending}
    >
      <ErrorAlert error={serverError} />

      {!selectedProduct ? (
        <div className='flex flex-col gap-3'>
          <div className='relative shrink-0'>
            <Search className='absolute left-3 top-2.5 h-5 w-5 text-zinc-400' />
            <input
              type='text'
              placeholder='Buscar producto por nombre, categoría, marca o descripción...'
              className='w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 dark:text-zinc-100 transition-colors shadow-sm h-10'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className='flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1'>
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                type='button'
                onClick={() => handleSelectProduct(p)}
                className='w-full flex items-center justify-between p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-500 hover:shadow-md transition-all'
              >
                <div className='text-left min-w-0 flex-1 mr-4'>
                  <h4
                    className='font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate'
                    title={p.device?.name}
                  >
                    {p.device?.name}
                  </h4>
                  <p
                    className='text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-tight truncate'
                    title={p.description || '--'}
                  >
                    {p.description || '--'}
                  </p>
                  <span className='text-[10px] font-bold text-zinc-500'>Disp: {p.stock}</span>
                </div>
                <div className='text-right shrink-0'>
                  <div className='text-lg font-black leading-none text-zinc-600'>${p.salePrice.toLocaleString('es-AR')}</div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && <div className='py-10 text-center text-zinc-400 text-sm font-medium'>No se encontraron productos.</div>}
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950'>
            <div className='min-w-0'>
              <p
                className='font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate'
                title={selectedProduct.device?.name}
              >
                {selectedProduct.device?.name}
              </p>
              <p className='text-[10px] font-bold text-zinc-500'>
                Disp: {selectedProduct.stock} — ${selectedProduct.salePrice.toLocaleString('es-AR')}
              </p>
            </div>
            <button
              type='button'
              onClick={() => setSelectedProduct(null)}
              className='shrink-0 flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
            >
              <ArrowLeft className='w-3.5 h-3.5' />
              Cambiar producto
            </button>
          </div>

          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Cantidad</label>
            <input
              type='number'
              min={1}
              {...register('quantity', { valueAsNumber: true })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.quantity ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            />
            {errors.quantity && <p className='text-zinc-500 text-xs mt-1.5'>{errors.quantity.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Motivo</label>
            <input
              type='text'
              {...register('reason')}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.reason ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            />
            {errors.reason && <p className='text-zinc-500 text-xs mt-1.5'>{errors.reason.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Monto a descontar</label>
            <input
              type='number'
              min={0}
              step='0.01'
              {...register('amount', { valueAsNumber: true })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.amount ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
            />
            {errors.amount && <p className='text-zinc-500 text-xs mt-1.5'>{errors.amount.message}</p>}
          </div>
        </div>
      )}
    </ResponsiveModal>
  );
}
