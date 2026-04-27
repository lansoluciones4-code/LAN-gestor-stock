import { fetchProductById } from '@/server/actions/product.actions';
import { notFound } from 'next/navigation';
import { ChevronLeft, ShieldCheck, Truck, Clock } from 'lucide-react';
import Link from 'next/link';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  const deviceName = product.device?.name || 'Accesorio Apple';
  const isOutOfStock = product.stock <= 0;

  // Normalize name for image file: "Funda iPhone 15 Pro Max" -> "funda-iphone-15-pro-max"
  const normalizedName = deviceName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const imagePath = `/products/${normalizedName}.webp`;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Link 
          href="/home" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Columna de Imagen */}
          <div className="relative aspect-square rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden p-12 shadow-sm">
            <img
              src={imagePath}
              alt={deviceName}
              className="object-contain w-full h-full transition-transform duration-700 hover:scale-105"
            />
            {isOutOfStock && (
              <div className="absolute top-8 right-8">
                <span className="bg-zinc-900 dark:bg-black text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-2xl">
                  Agotado
                </span>
              </div>
            )}
          </div>

          {/* Columna de Detalles */}
          <div className="flex flex-col justify-center max-w-xl">
            <div className="space-y-6 mb-12">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">
                  Accesorios Premium
                </p>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {deviceName}
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                  ${product.salePrice.toLocaleString('es-AR')}
                </span>
                {!isOutOfStock && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    En Stock
                  </span>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Descripción</h3>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                  {product.description || 'Este accesorio ha sido diseñado meticulosamente para complementar la estética y funcionalidad de tus dispositivos Apple, utilizando materiales de la más alta calidad.'}
                </p>
              </div>
            </div>

            {/* Características Adicionales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                  <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Calidad Garantizada</h4>
                  <p className="text-xs text-zinc-500 mt-1">6 meses de garantía directa con nosotros.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                  <Truck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Envío a Todo el País</h4>
                  <p className="text-xs text-zinc-500 mt-1">Despachamos tu pedido en menos de 24hs.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                  <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Protección Inmediata</h4>
                  <p className="text-xs text-zinc-500 mt-1">Recibí tu accesorio y protegé tu equipo hoy mismo.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
