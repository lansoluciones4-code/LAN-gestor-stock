import { Suspense } from 'react';
import { fetchProducts, fetchSelectorData } from '@/server/actions/product.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ProductManager } from './product-manager';

export default function ProductsPage() {
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

      <Suspense fallback={<TableSkeleton />}>
        <ProductManagerLoader />
      </Suspense>
    </div>
  );
}

async function ProductManagerLoader() {
  const [initialProducts, selectors] = await Promise.all([
    fetchProducts(),
    fetchSelectorData(),
  ]);

  return (
    <ProductManager
      initialData={initialProducts}
      suppliers={selectors.providers}
      devices={selectors.devices}
    />
  );
}
