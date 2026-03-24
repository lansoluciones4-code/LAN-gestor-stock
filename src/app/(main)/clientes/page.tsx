export const dynamic = 'force-dynamic';
import { fetchCustomers } from '@/server/actions/customer.actions';
import { CustomerManager } from './customer-manager';

export default async function CustomersPage() {
  const initialData = await fetchCustomers();

  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <div className='flex justify-between items-center mb-6 shrink-0'>
        <div>
          <h1 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100'>Cartera de Clientes</h1>
          <p className='text-zinc-500 dark:text-zinc-400 mt-1'>
            Registro de compradores eventuales y fidelizados para facturación.
          </p>
        </div>
      </div>

      <CustomerManager initialData={initialData} />
    </div>
  );
}
