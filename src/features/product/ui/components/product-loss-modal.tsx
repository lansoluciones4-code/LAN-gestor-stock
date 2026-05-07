'use client';

import { useState, useEffect } from 'react';
import { PackageX } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { ErrorAlert } from '@/components/ui/alert';
import { PRICE_BLOCKED_KEYS } from '@/lib/utils';

interface ProductLossModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quantity: number, reason: string) => void;
  product: ProductDef | null;
  serverError?: string | null;
  isPending?: boolean;
}

export function ProductLossModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  serverError,
  isPending,
}: ProductLossModalProps) {
  const [lossQuantity, setLossQuantity] = useState('1');
  const [lossReason, setLossReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLossQuantity('1');
      setLossReason('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(lossQuantity);
    onSubmit(qty, lossReason);
  };

  if (!product) return null;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title='Registrar Pérdida'
      icon={<PackageX className='w-5 h-5 text-amber-500' />}
      width='md'
      onSubmit={handleSubmit}
      submitLabel='Confirmar Pérdida'
      isPending={isPending}
    >
      <ErrorAlert error={serverError} />
      <div className='p-3 mb-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg'>
        <p className='text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1'>Producto</p>
        <p
          className='text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate'
          title={`${product.device?.name} - ${product.description}`}
        >
          {product.device?.name} - {product.description}
        </p>
        <p className='text-xs text-zinc-500 mt-1'>Stock actual: {product.stock} Uds</p>
      </div>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1.5'>Cantidad perdida</label>
          <input
            type='number'
            value={lossQuantity}
            onChange={(e) => setLossQuantity(e.target.value)}
            onKeyDown={(e) => {
              if (PRICE_BLOCKED_KEYS.includes(e.key)) e.preventDefault();
            }}
            min='1'
            step='1'
            placeholder='Ej: 1'
            className='w-full px-4 py-2 text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-indigo-500'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1.5'>Motivo / Razón</label>
          <textarea
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value)}
            placeholder='Ej: Pantalla rota al desembalar'
            className='w-full px-4 py-2 sm:text-base placeholder:text-xs sm:placeholder:text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-indigo-500 min-h-[100px] text-sm'
          />
        </div>
      </div>
    </ResponsiveModal>
  );
}
