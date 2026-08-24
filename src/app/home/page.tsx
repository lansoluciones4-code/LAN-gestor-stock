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
    <div className='bg-[#F5F5F7] dark:bg-zinc-950 selection:bg-zinc-500/30 flex flex-col'>
      {/* Hero Section */}
      <section
        className='relative overflow-hidden shrink-0 w-full aspect-[1774/887] max-h-40 sm:max-h-48 md:max-h-56 lg:max-h-64 bg-[#050a14] bg-[url(/banner_LAN.jpeg)] bg-cover bg-center'
        role='img'
        aria-label='LAN Soluciones Tecnológicas'
      >
        <div className='absolute top-3 right-4 z-50'>
          <ThemeToggle className='!bg-white/10 !text-white hover:!text-white' />
        </div>
      </section>

      {/* Catalog Section */}
      <div>
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
