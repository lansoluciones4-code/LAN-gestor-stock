'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PackageOpen, DollarSign, Upload, Camera, X, ImageIcon } from 'lucide-react';
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
  /** Fotos elegidas para el producto que se está por crear, justo antes de enviarlas. */
  onPhotosReady?: (files: File[]) => void;
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
  onPhotosReady,
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

  const NO_BRAND = '__sin_marca__';
  const [selectedSection, setSelectedSection] = useState<'tech' | 'libreria'>('tech');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  const activeDevices = (d: DeviceDef) => d.isActive || d.id === editingItem?.deviceId;

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    devices
      .filter(activeDevices)
      .filter((d) => d.section === selectedSection)
      .forEach((d) => d.category && set.add(d.category));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((c) => ({ id: c, name: c }));
  }, [devices, selectedSection, editingItem]);

  const brandOptions = useMemo(() => {
    if (!selectedCategory) return [];
    const set = new Set<string>();
    let hasNoBrand = false;
    devices
      .filter(activeDevices)
      .filter((d) => d.section === selectedSection && d.category === selectedCategory)
      .forEach((d) => (d.brand ? set.add(d.brand) : (hasNoBrand = true)));
    const options = Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((b) => ({ id: b, name: b }));
    return hasNoBrand ? [...options, { id: NO_BRAND, name: 'Sin marca' }] : options;
  }, [devices, selectedSection, selectedCategory, editingItem]);

  const modelOptions = useMemo(() => {
    if (!selectedCategory || !selectedBrand) return [];
    return devices
      .filter(activeDevices)
      .filter((d) => d.section === selectedSection && d.category === selectedCategory && (selectedBrand === NO_BRAND ? !d.brand : d.brand === selectedBrand))
      .map((d) => ({ id: d.id, name: d.name }));
  }, [devices, selectedSection, selectedCategory, selectedBrand, editingItem]);

  const [marginPercent, setMarginPercent] = useState('');

  const [pendingPhotos, setPendingPhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const added = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPendingPhotos((prev) => [...prev, ...added]);
  };

  const removePendingPhoto = (index: number) => {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

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
        setSelectedSection((editingItem.device?.section as 'tech' | 'libreria') || 'tech');
        setSelectedCategory(editingItem.device?.category || '');
        setSelectedBrand(editingItem.device?.brand || NO_BRAND);
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
        setSelectedSection('tech');
        setSelectedCategory('');
        setSelectedBrand('');
      }
      setPendingPhotos([]);
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
      onPhotosReady?.(pendingPhotos.map((p) => p.file));
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
          <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Sección</label>
          <div className='flex rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-1'>
            <button
              type='button'
              onClick={() => {
                setSelectedSection('tech');
                setSelectedCategory('');
                setSelectedBrand('');
                setValue('deviceId', '', { shouldValidate: true });
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${selectedSection === 'tech' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            >
              Tech
            </button>
            <button
              type='button'
              onClick={() => {
                setSelectedSection('libreria');
                setSelectedCategory('');
                setSelectedBrand('');
                setValue('deviceId', '', { shouldValidate: true });
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${selectedSection === 'libreria' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            >
              Librería
            </button>
          </div>
        </div>
        <div className='col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div>
            <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Categoría</label>
            <Combobox
              options={categoryOptions}
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setSelectedBrand('');
                setValue('deviceId', '', { shouldValidate: true });
              }}
              placeholder='Elegir categoría'
              emptyMessage='No hay categorías cargadas todavía (agregalas en "Stock").'
            />
          </div>
          <div>
            <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Marca</label>
            <Combobox
              options={brandOptions}
              value={selectedBrand}
              onChange={(val) => {
                setSelectedBrand(val);
                setValue('deviceId', '', { shouldValidate: true });
              }}
              placeholder={selectedCategory ? 'Elegir marca' : 'Elegí una categoría primero'}
              emptyMessage='No hay marcas para esta categoría.'
            />
          </div>
          <div>
            <label className='block text-md font-bold text-zinc-700 dark:text-zinc-300 mb-2'>Modelo</label>
            <Combobox
              options={modelOptions}
              value={selectedDeviceId}
              onChange={(val) => setValue('deviceId', val, { shouldValidate: true })}
              placeholder={selectedBrand ? 'Elegir modelo' : 'Elegí una marca primero'}
              emptyMessage='No hay modelos para esa categoría/marca.'
            />
            {errors.deviceId && <p className='text-zinc-500 text-xs mt-1.5'>{errors.deviceId.message}</p>}
          </div>
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

        {!editingItem && (
          <div className='col-span-1 md:col-span-2'>
            <label className='block text-sm font-medium mb-1.5'>Fotos del producto (opcional)</label>
            <input type='file' accept='image/*' multiple ref={fileInputRef} className='hidden' onChange={handleFilesSelected} />
            <input type='file' accept='image/*' capture='environment' ref={cameraInputRef} className='hidden' onChange={handleFilesSelected} />

            <div className='flex flex-wrap gap-2 mb-3'>
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
              >
                <Upload className='w-4 h-4' /> Seleccionar Archivos
              </button>
              <button
                type='button'
                onClick={() => cameraInputRef.current?.click()}
                className='flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
              >
                <Camera className='w-4 h-4' /> Tomar Foto
              </button>
            </div>

            {pendingPhotos.length > 0 ? (
              <div className='grid grid-cols-3 sm:grid-cols-4 gap-3'>
                {pendingPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className='relative group aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800'
                  >
                    <img src={photo.previewUrl} alt='' className='w-full h-full object-contain p-1' />
                    <button
                      type='button'
                      onClick={() => removePendingPhoto(index)}
                      className='absolute top-1 right-1 p-1.5 bg-zinc-900/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
                      title='Quitar'
                    >
                      <X className='w-3.5 h-3.5' />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-center gap-2 text-xs text-zinc-400 py-2'>
                <ImageIcon className='w-4 h-4' /> Podés elegir varias a la vez, o sacarlas con la cámara del celular. Se suben al confirmar.
              </div>
            )}
          </div>
        )}

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
