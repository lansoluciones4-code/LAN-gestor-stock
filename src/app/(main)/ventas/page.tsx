import { Suspense } from 'react';
import { fetchSales } from '@/server/actions/sale.actions';
import { fetchCustomers } from '@/server/actions/customer.actions';
import { fetchProducts } from '@/server/actions/product.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { SalesManager } from './sales-manager';

export default function SalesPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <div className='flex justify-between items-center mb-6 shrink-0'>
        <div>
          <h1 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight'>Ventas y Órdenes</h1>
          <p className='text-zinc-500 dark:text-zinc-400 mt-1'>
            Gestión de facturación y salida de stock inmediata.
          </p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <SalesManagerLoader />
      </Suspense>
    </div>
  );
}

async function SalesManagerLoader() {
  const [initialSales, customers, products] = await Promise.all([
    fetchSales(),
    fetchCustomers(false), // Only active customers
    fetchProducts(),
  ]);

  return (
    <SalesManager 
      initialSales={initialSales} 
      initialCustomers={customers}
      initialProducts={products}
    />
  );
}
