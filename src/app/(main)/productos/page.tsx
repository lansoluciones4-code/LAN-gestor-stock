'use client';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { PageHeader } from '@/components/ui/page-header';
import { ProductsPanel } from './products-panel';
import { CountersGrid } from '@/features/counter/ui/counters-grid';

export default function ProductsPage() {
  const isVendedor = useAuthStore((s) => s.user?.role) === 'vendedor';

  return (
    <div className={isVendedor ? 'flex flex-col h-full overflow-y-auto custom-scrollbar gap-6' : 'h-full'}>
      <div
        className={`flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden ${
          isVendedor ? 'h-[750px] shrink-0' : 'h-full'
        }`}
      >
        <PageHeader
          title='Productos y Stock'
          description='Inventario central de modelos unificados con stock, precio y proveedores.'
        />
        <ProductsPanel />
      </div>

      {/* Anotadores: solo el vendedor los ve acá (para restar); el admin los gestiona en Estadísticas. */}
      {isVendedor && <CountersGrid mode='decrement' />}
    </div>
  );
}
