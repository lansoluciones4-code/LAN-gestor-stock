import { Metadata } from 'next';
import Link from 'next/link';
import { fetchLandingProducts } from '@/server/actions/product.actions';
import { ProductCard } from './components/product-card';

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

export default async function HomePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt((searchParams?.page as string) || '1', 10));
  const itemsPerPage = 8;

  const products = await fetchLandingProducts();

  // Separamos productos con stock de los que no tienen
  const inStock = products.filter(p => p.stock > 0);
  const outOfStock = products.filter(p => p.stock <= 0);
  const orderedProducts = [...inStock, ...outOfStock];

  const totalPages = Math.max(1, Math.ceil(orderedProducts.length / itemsPerPage));
  const currentItems = orderedProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-black selection:bg-indigo-500/30">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-40 md:pb-28 overflow-hidden px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Diseñados para brillar.
            <br className="hidden md:block" />
            <span className="block sm:inline text-zinc-500 dark:text-zinc-400"> Protección superior.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium px-2">
            Nuestra cuidadosa selección de accesorios para tus dispositivos Apple fusiona 
            estética minimalista con durabilidad de grado premium.
          </p>
        </div>
      </section>

      {/* Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 md:pb-32">
        {orderedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {currentItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-12 md:mt-16 text-sm font-medium">
                <Link 
                  href={`/home?page=${Math.max(1, page - 1)}`} 
                  className={`px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 ${page === 1 ? 'pointer-events-none opacity-40' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300'}`}
                >
                  Anterior
                </Link>
                <div className="flex flex-wrap justify-center gap-1 mx-1 sm:mx-4">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = page === pageNum;
                    return (
                      <Link 
                        key={pageNum} 
                        href={`/home?page=${pageNum}`}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400'}`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                </div>
                <Link 
                  href={`/home?page=${Math.min(totalPages, page + 1)}`} 
                  className={`px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 ${page === totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300'}`}
                >
                  Siguiente
                </Link>
              </div>
            )}
          </>
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
