import { Metadata } from 'next';
import { fetchLandingProducts } from '@/features/product/actions/product.actions';
import { fetchLandingCategories } from '@/features/device/actions/device.actions';
import { CatalogClient } from './components/catalog-client';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'ArgenStock - Catálogo',
  description: 'Descubre nuestra colección exclusiva de fundas, cargadores, cables y accesorios premium diseñados para tus dispositivos Apple. Calidad superior, envío rápido y la mejor protección.',
  keywords: 'accesorios apple, fundas iphone, cargador magsafe, cables premium, apple watch, airpods, tienda de accesorios, fundas premium',
  icons: {
    icon: '/icon.svg',
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
  const [products, categories] = await Promise.all([fetchLandingProducts(), fetchLandingCategories()]);

  return (
    <div className='lg:h-screen lg:overflow-hidden bg-[#F5F5F7] dark:bg-zinc-950 selection:bg-indigo-500/30 flex flex-col'>
      {/* Hero Section */}
      <section className='relative pb-4 md:pb-10 pt-16 md:pt-12 overflow-hidden px-4 sm:px-8 shrink-0'>
        <div className='absolute top-4 right-4 z-50'>
          <ThemeToggle />
        </div>
        <div className='max-w-6xl mx-auto text-center space-y-4 md:space-y-6'>
          <h1 className='text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white'>ArgenStock</h1>
        </div>
      </section>

      {/* Catalog Section */}
      <div className='flex-1 min-h-0'>
        <CatalogClient
          products={products}
          categories={categories}
        />
      </div>

      {/* Footer - Minimal on desktop to save space */}
      <footer className='shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 text-center text-[14px] text-zinc-500 dark:text-zinc-400 px-6'>
        <p>© {new Date().getFullYear()} ArgenStock. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
