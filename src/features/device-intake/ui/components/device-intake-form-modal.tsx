'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ErrorAlert } from '@/components/ui/alert';
import { SaleCustomerPicker, type SaleCustomerSelection } from '@/features/sale/ui/components/sale-customer-picker';
import { createCustomerAction } from '@/features/customer/actions/customer.actions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { EQUIPMENT_TYPES, EQUIPMENT_TYPE_LABELS, buildDefaultDeviceIntakeSpecs, type EquipmentType } from '@/config/forms/device-intake-fields';
import { DeviceIntakeSpecsFields } from '@/features/device-intake/ui/components/device-intake-specs-fields';
import {
  deviceIntakeCommonFieldsSchema,
  type DeviceIntakeInput,
  type DeviceIntakeUpdateInput,
  type DeviceIntakeDef,
} from '@/features/device-intake/domain/device-intake.schema';

interface DeviceIntakeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DeviceIntakeInput | DeviceIntakeUpdateInput) => void;
  editingItem?: DeviceIntakeDef | null;
  serverError?: string | null;
  isPending?: boolean;
}

export function DeviceIntakeFormModal({ isOpen, onClose, onSubmit, editingItem, serverError, isPending }: DeviceIntakeFormModalProps) {
  const currentUser = useAuthStore((state) => state.user);

  const [equipmentType, setEquipmentType] = useState<EquipmentType>('consola');
  const [specs, setSpecs] = useState<Record<string, string | boolean>>(buildDefaultDeviceIntakeSpecs('consola'));
  const [customerSelection, setCustomerSelection] = useState<SaleCustomerSelection>({ mode: 'new', data: { name: '', phone: '', email: '', documentNumber: '' } });
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [isResolvingCustomer, setIsResolvingCustomer] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<z.infer<typeof deviceIntakeCommonFieldsSchema>>({
    resolver: zodResolver(deviceIntakeCommonFieldsSchema),
  });

  useEffect(() => {
    if (!isOpen) return;
    setCustomerError(null);

    if (editingItem) {
      setEquipmentType(editingItem.equipmentType as EquipmentType);
      setSpecs(editingItem.specs as Record<string, string | boolean>);
      reset({
        receivedByName: editingItem.receivedByName,
        description: editingItem.description,
        intakeReason: editingItem.intakeReason,
        observations: editingItem.observations,
      });
    } else {
      setEquipmentType('consola');
      setSpecs(buildDefaultDeviceIntakeSpecs('consola'));
      setCustomerSelection({ mode: 'new', data: { name: '', phone: '', email: '', documentNumber: '' } });
      reset({ receivedByName: currentUser?.username || '', description: '', intakeReason: '', observations: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingItem]);

  const handleEquipmentTypeChange = (type: EquipmentType) => {
    setEquipmentType(type);
    setSpecs(buildDefaultDeviceIntakeSpecs(type));
  };

  const handleSpecsChange = (key: string, value: string | boolean) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  const resolveCustomerId = async (): Promise<{ id?: string; error?: string }> => {
    if (customerSelection.mode === 'existing') return { id: customerSelection.customerId };
    if (customerSelection.mode === 'new') {
      const result = await createCustomerAction(customerSelection.data);
      if (!result.success) return { error: result.error };
      return { id: result.data!.id };
    }
    return { error: 'Seleccioná o cargá un cliente.' };
  };

  const submit = handleSubmit(async (data) => {
    if (editingItem) {
      const changed: any = { version: editingItem.version };
      let hasChanges = false;
      Object.keys(dirtyFields).forEach((key) => {
        changed[key] = (data as any)[key];
        hasChanges = true;
      });
      if (JSON.stringify(specs) !== JSON.stringify(editingItem.specs)) {
        changed.specs = specs;
        hasChanges = true;
      }
      if (!hasChanges) {
        onClose();
        return;
      }
      onSubmit(changed);
      return;
    }

    setCustomerError(null);
    setIsResolvingCustomer(true);
    const { id: customerId, error } = await resolveCustomerId();
    setIsResolvingCustomer(false);
    if (error || !customerId) {
      setCustomerError(error || 'No se pudo resolver el cliente.');
      return;
    }

    onSubmit({ equipmentType, customerId, specs, ...data } as unknown as DeviceIntakeInput);
  });

  const pending = isPending || isResolvingCustomer;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Editar Recepción de Equipo' : 'Nuevo Equipo'}
      icon={<Wrench className='w-5 h-5 text-zinc-500' />}
      width='lg'
      onSubmit={submit}
      submitLabel={editingItem ? 'Actualizar' : 'Registrar'}
      isPending={pending}
    >
      <ErrorAlert error={serverError || customerError} />
      <div className='space-y-5'>
        <div>
          <label className='block text-xs font-medium mb-1.5 text-zinc-700 dark:text-zinc-300'>Tipo de Equipo</label>
          <div className='grid grid-cols-3 gap-2'>
            {EQUIPMENT_TYPES.map((type) => (
              <button
                key={type}
                type='button'
                disabled={!!editingItem}
                onClick={() => handleEquipmentTypeChange(type)}
                className={`flex items-center justify-center p-2.5 rounded-lg border-2 transition-all font-bold text-xs uppercase disabled:opacity-60 disabled:cursor-not-allowed ${
                  equipmentType === type ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400' : 'border-transparent bg-zinc-50 dark:bg-zinc-950 text-zinc-400'
                }`}
              >
                {EQUIPMENT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Cliente</label>
          {editingItem ? (
            <div className='px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400'>
              {editingItem.customer?.name || '---'} <span className='text-[10px] uppercase font-bold text-zinc-400'>(no editable)</span>
            </div>
          ) : (
            <SaleCustomerPicker
              allowFinal={false}
              onChange={setCustomerSelection}
            />
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Quién recibió el equipo</label>
          <input
            type='text'
            {...register('receivedByName')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.receivedByName ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.receivedByName && <p className='text-zinc-500 text-xs mt-1.5'>{errors.receivedByName.message}</p>}
        </div>

        <div className='pt-2 border-t border-zinc-100 dark:border-zinc-800'>
          <p className='text-xs font-black uppercase tracking-widest text-zinc-400 mb-3'>Datos del equipo</p>
          <DeviceIntakeSpecsFields
            equipmentType={equipmentType}
            specs={specs}
            onChange={handleSpecsChange}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Motivo del Ingreso</label>
          <textarea
            rows={3}
            {...register('intakeReason')}
            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 transition-colors resize-none'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Observaciones</label>
          <textarea
            rows={2}
            {...register('observations')}
            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 transition-colors resize-none'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>
            Descripción <span className='text-[10px] uppercase font-bold text-zinc-400'>(ayuda-memoria interna — no se imprime)</span>
          </label>
          <textarea
            rows={3}
            {...register('description')}
            placeholder='Recordatorio interno para el vendedor: qué problema reportó el cliente...'
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors resize-none ${errors.description ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.description && <p className='text-zinc-500 text-xs mt-1.5'>{errors.description.message}</p>}
        </div>
      </div>
    </ResponsiveModal>
  );
}
