import { Metadata } from 'next';
import { fetchLandingProducts } from '@/features/product/actions/public-product.actions';
import { fetchLandingCategories } from '@/features/device/actions/public-device.actions';
import { fetchPublicShowPrices } from '@/features/settings/actions/public-settings.actions';
import { CatalogClient } from './components/catalog-client';
import { SiteFooter } from './components/site-footer';

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
    description: 'Descubre nuestra colección exclusiva de tecnología, desde perifericos, hasta cargadores, joysticks, componentes para tu PC y mucho más.',
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

      <SiteFooter />
    </div>
  );
}
