'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ProductsPanel } from './products-panel';

export default function ProductsPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader
        title='Productos y Stock'
        description='Inventario central de modelos unificados con stock, precio y proveedores.'
      />
      <ProductsPanel />
    </div>
  );
}
