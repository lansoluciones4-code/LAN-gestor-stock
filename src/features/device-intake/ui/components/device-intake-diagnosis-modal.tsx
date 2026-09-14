'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stethoscope } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ErrorAlert } from '@/components/ui/alert';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { submitDeviceIntakeDiagnosisAction } from '@/features/device-intake/actions/device-intake.actions';
import { deviceIntakeDiagnosisSchema, type DeviceIntakeDiagnosisInput, type DeviceIntakeDef } from '@/features/device-intake/domain/device-intake.schema';

interface DeviceIntakeDiagnosisModalProps {
  intake: DeviceIntakeDef | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: DeviceIntakeDef) => void;
}

/** Modal del Diagnóstico Final — siempre empieza con quién lo escribe (autocompletado, editable). */
export function DeviceIntakeDiagnosisModal({ intake, isOpen, onClose, onSuccess }: DeviceIntakeDiagnosisModalProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Pick<DeviceIntakeDiagnosisInput, 'diagnosisAuthorName' | 'diagnosisDetail'>>({
    resolver: zodResolver(deviceIntakeDiagnosisSchema.omit({ version: true })),
  });

  useEffect(() => {
    if (isOpen && intake) {
      setServerError(null);
      reset({
        diagnosisAuthorName: intake.diagnosisAuthorName || currentUser?.username || '',
        diagnosisDetail: intake.diagnosisDetail || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, intake]);

  const onSubmit = handleSubmit((data) => {
    if (!intake) return;
    setServerError(null);
    startTransition(async () => {
      const result = await submitDeviceIntakeDiagnosisAction(intake.id!, { ...data, version: intake.version });
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      onSuccess(result.data);
      onClose();
    });
  });

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title='Diagnóstico Final'
      icon={<Stethoscope className='w-5 h-5 text-zinc-500' />}
      width='md'
      onSubmit={onSubmit}
      submitLabel='Guardar Diagnóstico'
      isPending={isPending}
    >
      <ErrorAlert error={serverError} />
      <div className='space-y-4'>
        <p className='text-sm text-zinc-500 dark:text-zinc-400'>
          Dejá constancia de lo que realmente tenía el equipo, en contra de lo que se supuso al momento de la recepción.
        </p>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Diagnosticado por</label>
          <input
            type='text'
            {...register('diagnosisAuthorName')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${errors.diagnosisAuthorName ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.diagnosisAuthorName && <p className='text-zinc-500 text-xs mt-1.5'>{errors.diagnosisAuthorName.message}</p>}
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'>Diagnóstico</label>
          <textarea
            rows={6}
            {...register('diagnosisDetail')}
            placeholder='Qué tenía realmente el equipo...'
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors resize-none ${errors.diagnosisDetail ? 'border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'}`}
          />
          {errors.diagnosisDetail && <p className='text-zinc-500 text-xs mt-1.5'>{errors.diagnosisDetail.message}</p>}
        </div>
      </div>
    </ResponsiveModal>
  );
}
