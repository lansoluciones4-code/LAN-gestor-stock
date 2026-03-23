import { Suspense } from 'react';
import { fetchProducts, fetchSelectorData } from '@/server/actions/product.actions';
import { ProductManager } from './product-manager';

export default async function ProductsPage() {
  const [initialProducts, selectors] = await Promise.all([
    fetchProducts(),
    fetchSelectorData(),
  ]);

  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <div className='flex justify-between items-center mb-6 shrink-0'>
        <div>
          <h1 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100'>Productos y Stock</h1>
          <p className='text-zinc-500 dark:text-zinc-400 mt-1'>
            Inventario central de modelos unificados con stock, precio y proveedores.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className='animate-pulse h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg' />}>
        <ProductManager initialData={initialProducts as any} suppliers={selectors.providers} devices={selectors.devices} />
      </Suspense>
    </div>
  );
}
