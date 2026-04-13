import { Metadata } from 'next';
import { fetchLandingProducts } from '@/server/actions/product.actions';
import { ProductCard } from './components/product-card';

export const metadata: Metadata = {
  title: 'Accesorios Premium para Apple | Tienda Oficial',
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
  const products = await fetchLandingProducts();

  // Separamos productos con stock de los que no tienen
  const inStock = products.filter(p => p.stock > 0);
  const outOfStock = products.filter(p => p.stock <= 0);
  const orderedProducts = [...inStock, ...outOfStock];

  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-black selection:bg-indigo-500/30">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Diseñados para brillar.
            <br className="hidden md:block" />
            <span className="text-zinc-500 dark:text-zinc-400">Protección superior.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium">
            Nuestra cuidadosa selección de accesorios para tus dispositivos Apple fusiona 
            estética minimalista con durabilidad de grado premium.
          </p>
        </div>
      </section>

      {/* Grid Section */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        {orderedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {orderedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">Estamos preparando nuestro catálogo</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Vuelve pronto para descubrir nuestra nueva colección de accesorios.</p>
          </div>
        )}
      </section>
      
      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400 px-6">
        <p>© {new Date().getFullYear()} Accesorios Premium. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
