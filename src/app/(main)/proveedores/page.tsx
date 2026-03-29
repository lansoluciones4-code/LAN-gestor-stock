import { Suspense } from 'react';
import { fetchProviders } from '@/server/actions/provider.actions';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ProviderManager } from './provider-manager';

export default function ProvidersPage() {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <div className='flex justify-between items-center mb-6 shrink-0'>
        <div>
          <h1 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100'>Proveedores Autorizados</h1>
          <p className='text-zinc-500 dark:text-zinc-400 mt-1'>
            Gestión interna de distribuidores y mayoristas de mercadería.
          </p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ProviderManagerLoader />
      </Suspense>
    </div>
  );
}

async function ProviderManagerLoader() {
  const initialData = await fetchProviders();
  return <ProviderManager initialData={initialData} />;
}
