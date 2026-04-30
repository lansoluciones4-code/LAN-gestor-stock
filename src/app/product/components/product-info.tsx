import { ShieldCheck, Truck, Clock } from 'lucide-react';
import { ContactButtons } from '@/components/contact/contact-buttons';

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className='flex items-start gap-4'>
      <div className='w-12 h-12 shrink-0 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800'>{icon}</div>
      <div>
        <h4 className='text-sm font-bold text-zinc-900 dark:text-white'>{title}</h4>
        <p className='text-xs text-zinc-500 mt-1'>{description}</p>
      </div>
    </div>
  );
}

interface ProductInfoProps {
  deviceName: string;
  salePrice: number;
  description?: string | null;
  isOutOfStock: boolean;
}

export function ProductInfo({ deviceName, salePrice, description, isOutOfStock }: ProductInfoProps) {
  return (
    <div className='flex flex-col justify-center max-w-xl'>
      <div className='space-y-6 mb-12'>
        <div className='space-y-2'>
          <h1 className='text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white'>{deviceName}</h1>
        </div>

        <div className='flex items-center gap-4'>
          <span className='text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100'>${salePrice.toLocaleString('es-AR')}</span>
          {!isOutOfStock && <span className='text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider'>En Stock</span>}
        </div>

        <div className='pt-6 border-t border-zinc-100 dark:border-zinc-800'>
          <h3 className='text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3'>Descripción</h3>
          <p className='text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium mb-8'>{description || 'Este accesorio ha sido diseñado meticulosamente para complementar la estética y funcionalidad de tus dispositivos Apple, utilizando materiales de la más alta calidad.'}</p>

          {!isOutOfStock && (
            <div className='w-full lg:max-w-md'>
              <ContactButtons
                product={{ name: deviceName, description }}
                size='lg'
              />
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-zinc-100 dark:border-zinc-800'>
        <FeatureItem
          icon={<ShieldCheck className='w-6 h-6 text-indigo-600 dark:text-indigo-400' />}
          title='Calidad Garantizada'
          description='6 meses de garantía directa con nosotros.'
        />
        <FeatureItem
          icon={<Clock className='w-6 h-6 text-indigo-600 dark:text-indigo-400' />}
          title='Protección Inmediata'
          description='Recibí tu accesorio y protegé tu equipo hoy mismo.'
        />
      </div>
    </div>
  );
}
