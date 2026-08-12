import { ContactButtons } from '@/components/contact/contact-buttons';

interface ProductInfoProps {
  deviceName: string;
  category?: string | null;
  brand?: string | null;
  salePrice: number;
  description?: string | null;
  isOutOfStock: boolean;
  showPrice: boolean;
}

export function ProductInfo({ deviceName, category, brand, salePrice, description, isOutOfStock, showPrice }: ProductInfoProps) {
  return (
    <div className='flex flex-col justify-center max-w-xl'>
      <div className='space-y-6 mb-12'>
        <div className='space-y-2'>
          {(category || brand) && (
            <p className='text-sm font-bold uppercase tracking-widest text-zinc-400'>{[category, brand].filter(Boolean).join(' · ')}</p>
          )}
          <h1 className='text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white'>{deviceName}</h1>
        </div>

        <div className='flex items-center gap-4'>
          {showPrice ? (
            <span className='text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100'>${salePrice.toLocaleString('es-AR')}</span>
          ) : (
            <span className='text-xl font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>Consultar precio</span>
          )}
          {!isOutOfStock && <span className='text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-500/10 px-3 py-1 rounded-full uppercase tracking-wider'>En Stock</span>}
        </div>

        <div className='pt-6 border-t border-zinc-100 dark:border-zinc-800'>
          <h3 className='text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3'>Descripción</h3>
          <p className='text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium mb-8'>{description || 'Este accesorio ha sido diseñado meticulosamente para complementar la estética y funcionalidad de tus dispositivos Apple, utilizando materiales de la más alta calidad.'}</p>

          <div className='w-full lg:max-w-md'>
            <ContactButtons
              product={{ category, brand, model: deviceName, inStock: !isOutOfStock }}
              size='lg'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
