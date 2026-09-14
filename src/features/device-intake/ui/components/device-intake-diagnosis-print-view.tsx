'use client';

import { useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EQUIPMENT_TYPE_LABELS } from '@/config/forms/device-intake-fields';
import { type DeviceIntakeDef } from '@/features/device-intake/domain/device-intake.schema';

/** Diagnóstico Final — documento A4 imprimible, separado de la planilla de recepción. */
export function DeviceIntakeDiagnosisPrintView({ intake, onClose }: { intake: DeviceIntakeDef; onClose: () => void }) {
  const equipmentType = intake.equipmentType as keyof typeof EQUIPMENT_TYPE_LABELS;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className='flex flex-col h-full space-y-4 animate-in fade-in duration-300 overflow-hidden bg-zinc-50 dark:bg-zinc-950 px-1'>
      <div className='flex items-center justify-between sticky top-4 bg-white dark:bg-zinc-900 px-4 py-3 z-30 border-b border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl mx-2 no-print'>
        <Button
          variant='secondary'
          size='sm'
          onClick={onClose}
          leftIcon={<ArrowLeft className='w-4 h-4' />}
          className='font-bold border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-900/30 dark:text-zinc-400 dark:hover:bg-zinc-900/20 shadow-md'
        >
          Volver
        </Button>
        <div className='flex gap-2 shrink-0'>
          <Button
            size='sm'
            variant='secondary'
            onClick={() => window.print()}
            leftIcon={<Printer className='w-4 h-4' />}
          >
            Imprimir Diagnóstico
          </Button>
        </div>
      </div>

      <div className='flex-1 overflow-auto p-4 sm:p-10 custom-scrollbar'>
        <div
          id='print-area-wrapper'
          className='bg-white text-zinc-900 p-4 sm:p-12 border border-zinc-200 rounded-xl shadow-lg max-w-2xl mx-auto'
        >
          <div className='grid grid-cols-3 items-start mb-10 border-b-2 border-zinc-50 pb-8'>
            <div>
              <h2 className='text-5xl font-black text-zinc-600'>LAN</h2>
              <p className='text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1'>Soluciones Tecnológicas</p>
            </div>
            <div className='flex justify-center'>
              <img
                src='/LAN_icono.jpg'
                alt='LAN Soluciones Tecnológicas'
                className='w-28 h-28 rounded-full object-cover border border-zinc-200 shadow-sm shrink-0'
              />
            </div>
            <div className='text-right'>
              <div className='text-[11px] font-bold text-zinc-900 uppercase'>Diagnóstico Final</div>
              <div className='text-[10px] text-zinc-500 font-medium'>{intake.diagnosedAt ? new Date(intake.diagnosedAt).toLocaleDateString('es-AR') : ''}</div>
            </div>
          </div>

          <h3 className='text-center text-sm font-black uppercase tracking-widest text-zinc-900 mb-10'>Diagnóstico Final</h3>

          <div className='grid grid-cols-2 gap-6 mb-10'>
            <div>
              <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Cliente</span>
              <p className='text-sm font-bold text-zinc-800'>{intake.customer?.name ?? '—'}</p>
            </div>
            <div className='text-right'>
              <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Equipo</span>
              <p className='text-sm font-bold text-zinc-800'>{EQUIPMENT_TYPE_LABELS[equipmentType]}</p>
            </div>
            <div>
              <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Diagnosticado por</span>
              <p className='text-sm font-bold text-zinc-800'>{intake.diagnosisAuthorName || '—'}</p>
            </div>
            <div className='text-right'>
              <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1'>Fecha del diagnóstico</span>
              <p className='text-sm font-bold text-zinc-800'>{intake.diagnosedAt ? new Date(intake.diagnosedAt).toLocaleString('es-AR') : '—'}</p>
            </div>
          </div>

          <div className='pt-8 border-t-2 border-zinc-900'>
            <span className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2'>Diagnóstico</span>
            <p className='text-[13px] text-zinc-900 whitespace-pre-wrap leading-relaxed'>{intake.diagnosisDetail || '—'}</p>
          </div>

          <div className='print-footer mt-10 pt-4 border-t border-zinc-100 text-center'>
            <p className='text-[15px] text-zinc-400 font-medium leading-relaxed'>
              LAN Soluciones Tecnológicas de Franco BISSIO · CUIT 20-31923402-1
              <br />
              Avenida Guillermo Hudson 196 · Rawson - Chubut · CEL: 2804777200
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
