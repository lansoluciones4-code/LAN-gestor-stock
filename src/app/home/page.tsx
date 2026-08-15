import { Metadata } from 'next';
import { fetchLandingProducts } from '@/features/product/actions/public-product.actions';
import { fetchLandingCategories } from '@/features/device/actions/public-device.actions';
import { fetchPublicShowPrices } from '@/features/settings/actions/public-settings.actions';
import { CatalogClient } from './components/catalog-client';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'LAN Soluciones Tecnológicas - Catálogo',
  description: 'Descubre nuestra colección exclusiva de fundas, cargadores, cables y accesorios premium diseñados para tus dispositivos Apple. Calidad superior, envío rápido y la mejor protección.',
  keywords: 'accesorios apple, fundas iphone, cargador magsafe, cables premium, apple watch, airpods, tienda de accesorios, fundas premium',
  icons: {
    icon: '/icon_web.jpeg',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Accesorios Premium para Apple',
    description: 'La mejor colección de accesorios para tu iPhone, iPad y Apple Watch.',
    type: 'website',
  },
};

import { ThemeToggle } from '@/components/ui/theme-toggle';

export default async function HomePage() {
  const [products, categories, showPrices] = await Promise.all([fetchLandingProducts(), fetchLandingCategories(), fetchPublicShowPrices()]);

  return (
    <div className='lg:h-screen lg:overflow-hidden bg-[#F5F5F7] dark:bg-zinc-950 selection:bg-zinc-500/30 flex flex-col'>
      {/* Hero Section */}
      <section className='relative pb-3 md:pb-4 pt-6 md:pt-6 overflow-hidden px-4 sm:px-8 shrink-0 bg-gradient-to-b from-[#0B1F3D] to-[#123465]'>
        <div className='absolute top-3 right-4 z-50'>
          <ThemeToggle className='!bg-white/10 !text-white hover:!text-white' />
        </div>
        <div className='max-w-6xl mx-auto text-center space-y-1.5 md:space-y-2'>
          <div className='w-11 h-11 md:w-14 md:h-14 mx-auto rounded-full overflow-hidden border border-white/20 shadow-lg shadow-sky-500/20'>
            <img
              src='/icon_web.jpeg'
              alt='LAN Soluciones Tecnológicas'
              className='w-full h-full object-cover'
            />
          </div>
          <h1 className='text-2xl md:text-3xl font-black text-white'>LAN</h1>
          <p className='text-[10px] md:text-xs text-sky-300 font-bold uppercase tracking-[0.3em] -mt-1.5 md:-mt-2'>Soluciones Tecnológicas</p>
        </div>
      </section>

      {/* Catalog Section */}
      <div className='flex-1 min-h-0'>
        <CatalogClient
          products={products}
          categories={categories}
          showPrices={showPrices}
        />
      </div>

      {/* Footer - Minimal on desktop to save space */}
      <footer className='shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 text-center text-[14px] text-zinc-500 dark:text-zinc-400 px-6'>
        <p>© {new Date().getFullYear()} LAN Soluciones Tecnológicas. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
