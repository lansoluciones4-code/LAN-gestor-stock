import { Metadata } from 'next';
import { fetchLandingProducts } from '@/server/actions/product.actions';
import { fetchLandingCategories } from '@/server/actions/device.actions';
import { CatalogClient } from './components/catalog-client';

export const metadata: Metadata = {
  title: 'Phone Center - Catalogo',
  description: 'Descubre nuestra colección exclusiva de fundas, cargadores, cables y accesorios premium diseñados para tus dispositivos Apple. Calidad superior, envío rápido y la mejor protección.',
  keywords: 'accesorios apple, fundas iphone, cargador magsafe, cables premium, apple watch, airpods, tienda de accesorios, fundas premium',
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

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    fetchLandingProducts(),
    fetchLandingCategories(),
  ]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950 selection:bg-indigo-500/30">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-40 md:pb-28 overflow-hidden px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Phone Center
            <br className="hidden md:block" />
            <span className="block sm:inline text-zinc-500 dark:text-zinc-400"> Diseñados para brillar.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium px-2">
            Nuestra cuidadosa selección de accesorios para tus dispositivos Apple fusiona
            estética minimalista con durabilidad de grado premium.
          </p>
        </div>
      </section>

      {/* Catalog Section */}
      <CatalogClient products={products} categories={categories} />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400 px-6">
        <p>© {new Date().getFullYear()} Accesorios Premium. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
