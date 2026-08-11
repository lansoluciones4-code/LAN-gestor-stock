'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PackageOpen, DollarSign } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { productCreateSchema, type ProductInput, type ProductDef, type ProductUpdateInput } from '@/features/product/domain/product.schema';
import { type DeviceDef } from '@/features/device/domain/device.schema';
import { type ProviderDef } from '@/features/provider/domain/provider.schema';
import { ErrorAlert } from '@/components/ui/alert';
import { Combobox } from '@/components/ui/combobox';
import { blockInvalidPriceKey, PRICE_BLOCKED_KEYS } from '@/lib/utils';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductInput | ProductUpdateInput) => void;
  editingItem?: ProductDef | null;
  serverError?: string | null;
  isPending?: boolean;
  devices: DeviceDef[];
  suppliers: ProviderDef[];
  role?: string;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
  serverError,
  isPending,
  devices,
  suppliers,
  role,
}: ProductFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ProductInput>({
    resolver: zodResolver(productCreateSchema),
  });

  const selectedDeviceId = watch('deviceId');
  const selectedProviderId = watch('providerId');

  const [marginPercent, setMarginPercent] = useState('');

  // Markup sobre el costo: venta = costo * (1 + %/100). El % es solo una comodidad
  // de carga del lado del cliente, no se valida ni se envía al server.
  const recalcSalePrice = (costStr: string, pctStr: string) => {
    const cost = Number((costStr || '').replace(',', '.'));
    const pct = Number((pctStr || '').replace(',', '.'));
    if (!pctStr || isNaN(cost) || isNaN(pct) || cost <= 0) return;
    const sale = cost * (1 + pct / 100);
    setValue('salePrice', sale.toFixed(2).replace('.', ',') as any, { shouldValidate: true, shouldDirty: true });
  };

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          deviceId: editingItem.deviceId,
          providerId: editingItem.providerId,
          description: editingItem.description || '',
          purchasePrice: editingItem.purchasePrice.toFixed(2).replace('.', ','),
          salePrice: editingItem.salePrice.toFixed(2).replace('.', ','),
          stock: editingItem.stock,
        } as any);
        const impliedMargin = editingItem.purchasePrice > 0 ? ((editingItem.salePrice - editingItem.purchasePrice) / editingItem.purchasePrice) * 100 : 0;
        setMarginPercent(impliedMargin > 0 ? impliedMargin.toFixed(2).replace('.', ',') : '');
      } else {
        reset({
          deviceId: '',
          providerId: '',
          description: '',
          purchasePrice: '0,00',
          salePrice: '0,00',
          stock: 1,
        } as any);
        setMarginPercent('');
      }
    }
  }, [isOpen, editingItem, reset]);

  const handleFormSubmit = (data: ProductInput) => {
    if (editingItem) {
      const changedData: any = {
        version: editingItem.version,
        deviceVersion: editingItem.device?.version,
        providerVersion: editingItem.provider?.version,
      };
      let hasChanges = false;
      Object.keys(dirtyFields).forEach((key) => {
        const k = key as keyof ProductInput;
        if (k === 'stock') {
          changedData.stockDelta = (data.stock ?? 0) - (editingItem.stock ?? 0);
          if (changedData.stockDelta !== 0) hasChanges = true;
        } else {
          changedData[k] = data[k];
          hasChanges = true;
        }
      });
      if (!hasChanges) {
        onClose();
        return;
      }
      onSubmit(changedData as ProductUpdateInput);
    } else {
      onSubmit(data);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Editar Producto / Stock' : 'Añadir Nuevo Lote'}
      icon={<PackageOpen className='w-6 h-6 text-zinc-500' />}
      width='2xl'
      onSubmit={handleSubmit(handleFormSubmit)}
      submitLabel='Confirmar Inventario'
      isPending={isPending}
    >
      <ErrorAlert error={serverError} />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='col-span-1 md:col-span-2'>
          <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Modelo / Equipo</label>
          <Combobox
            options={devices.filter((d) => d.isActive || d.id === editingItem?.deviceId).map((d) => ({ id: d.id, name: d.name }))}
            value={selectedDeviceId}
            onChange={(val) => setValue('deviceId', val, { shouldValidate: true })}
            placeholder='Seleccionar Equipo'
          />
          {errors.deviceId && <p className='text-zinc-500 text-xs mt-1.5'>{errors.deviceId.message}</p>}
        </div>
        <div className='col-span-1 md:col-span-2'>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Proveedor Entrante</label>
            <Combobox
              options={suppliers.filter((s) => s.isActive || s.id === editingItem?.providerId).map((s) => ({ id: s.id, name: s.name }))}
              value={selectedProviderId}
              onChange={(val) => setValue('providerId', val, { shouldValidate: true })}
              placeholder='Seleccionar Proveedor'
            />
            {errors.providerId && <p className='text-zinc-500 text-xs mt-1.5'>{errors.providerId.message}</p>}
          </div>
        <div className='col-span-1 md:col-span-2'>
          <label className='block text-sm font-medium mb-1.5'>Descripción Física (Color, Memoria)</label>
          <input
            type='text'
            {...register('description')}
            placeholder='Ej: Negro, 256GB - Kit Funda'
            className='w-full px-4 py-2 text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700'
          />
        </div>
        <div className='col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Precio de Costo ($)</label>
            <div className='relative'>
              <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
              <input
                type='text'
                inputMode='decimal'
                {...register('purchasePrice', {
                  onChange: (e) => {
                    const cleaned = e.target.value.replace(/\./g, '');
                    setValue('purchasePrice', cleaned as any);
                    recalcSalePrice(cleaned, marginPercent);
                  },
                })}
                onKeyDown={blockInvalidPriceKey}
                placeholder='0,00'
                className={`w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500 ${errors.purchasePrice ? 'border-zinc-500' : ''}`}
              />
            </div>
            {errors.purchasePrice && <p className='text-zinc-500 text-xs mt-1'>{errors.purchasePrice.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>% Ganancia</label>
            <div className='relative'>
              <span className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400 text-sm font-bold'>%</span>
              <input
                type='text'
                inputMode='decimal'
                value={marginPercent}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\./g, '');
                  setMarginPercent(cleaned);
                  recalcSalePrice(getValues('purchasePrice') as unknown as string, cleaned);
                }}
                onKeyDown={blockInvalidPriceKey}
                placeholder='Ej: 30'
                className='w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
              />
            </div>
            <p className='text-zinc-400 text-xs mt-1'>Opcional: calcula el precio de venta solo</p>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1.5'>Precio de Venta ($)</label>
            <div className='relative'>
              <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-zinc-500' />
              <input
                type='text'
                inputMode='decimal'
                {...register('salePrice', { onChange: (e) => setValue('salePrice', e.target.value.replace(/\./g, '') as any) })}
                onKeyDown={blockInvalidPriceKey}
                placeholder='0,00'
                className={`w-full pl-9 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500 ${errors.salePrice ? 'border-zinc-500' : ''}`}
              />
            </div>
            {errors.salePrice && <p className='text-zinc-500 text-xs mt-1'>{errors.salePrice.message}</p>}
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium mb-1.5'>Stock Inicial Lote</label>
          <input
            type='number'
            {...register('stock', { valueAsNumber: true })}
            onKeyDown={(e) => {
              if (PRICE_BLOCKED_KEYS.includes(e.key)) e.preventDefault();
            }}
            min='0'
            step='1'
            placeholder='1'
            className='w-full px-4 py-2 text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-zinc-500'
          />
          {errors.stock && <p className='text-zinc-500 text-xs mt-1'>{errors.stock.message}</p>}
        </div>
      </div>
    </ResponsiveModal>
  );
}
