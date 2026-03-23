import { Suspense } from 'react';
import { fetchDevices } from '@/server/actions/device.actions';
import { DeviceManager } from './device-manager';

export default async function DevicesPage() {
  const initialDevices = await fetchDevices();

  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <div className='flex justify-between items-center mb-6 shrink-0'>
        <div>
          <h1 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100'>Equipos</h1>
          <p className='text-zinc-500 dark:text-zinc-400 mt-1'>
            Gestión administrativa de los modelos físicos que ingresan al catálogo.
          </p>
        </div>
      </div>

      <DeviceManager initialData={initialDevices} />
    </div>
  );
}
