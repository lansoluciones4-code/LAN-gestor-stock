import { Metadata } from 'next';
import { fetchLandingProducts } from '@/features/product/actions/public-product.actions';
import { fetchLandingCategories } from '@/features/device/actions/public-device.actions';
import { fetchPublicShowPrices } from '@/features/settings/actions/public-settings.actions';
import { CatalogClient } from './components/catalog-client';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'LAN Soluciones Tecnológicas - Catálogo',
  description: 'Descubre nuestra colección exclusiva de tecnología, desde perifericos, hasta cargadores, joysticks, componentes para tu PC y mucho más.',
  keywords: 'tecnologia, lan, LAN, teclado, mouse, componentes, cable, cargador, hdmi, HDMI, usb, parlante,',
  icons: {
    icon: '/icon_web.jpeg',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Catálogo web | LAN Soluciones Tecnológicas',
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
        className='relative overflow-hidden shrink-0 w-full aspect-[4128/860] bg-[#050a14] bg-[url(/banner_LAN.png)] bg-cover'
        style={{ backgroundPosition: 'center 65%' }}
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
      <footer className='shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 text-center text-[14px] text-zinc-500 dark:text-zinc-400 px-6 space-y-1'>
        <p>LAN Soluciones Tecnológicas de Franco BISSIO · CUIT 20-31923402-1</p>
        <p>Avenida Guillermo Hudson 196 · Rawson - Chubut · CEL: 2804777200</p>
        <p>© {new Date().getFullYear()} LAN Soluciones Tecnológicas. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
