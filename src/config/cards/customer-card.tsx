/* eslint-disable react/display-name */
import { Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type CustomerDef } from '@/features/customer/domain/customer.schema';

interface CustomerCardActionsProps {
  onEdit: (c: CustomerDef) => void;
  onToggleActive: (c: CustomerDef) => void;
}

export function renderCustomerCard(actions: CustomerCardActionsProps) {
  return (customer: CustomerDef) => (
    <EntityCard
      key={customer.id}
      title={customer.name}
      subtitle={customer.email}
      badges={
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
          {customer.isActive ? 'Activo' : 'Inactivo'}
        </span>
      }
      details={
        <div className='flex flex-col gap-1 mt-1'>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>Teléfono</span>
            <span>{customer.phone}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-zinc-400'>DNI</span>
            <span>{customer.documentNumber}</span>
          </div>
        </div>
      }
      actions={
        <>
          <CardAction
            icon={customer.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />}
            label={customer.isActive ? 'Desactivar' : 'Activar'}
            onClick={() => actions.onToggleActive(customer)}
            variant={customer.isActive ? 'warning' : 'success'}
          />
          <CardAction
            icon={<Edit className='w-4 h-4' />}
            label='Editar'
            onClick={() => actions.onEdit(customer)}
          />
        </>
      }
    />
  );
}
