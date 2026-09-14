'use client';

import { useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEVICE_INTAKE_FIELDS, EQUIPMENT_TYPE_LABELS } from '@/config/forms/device-intake-fields';
import { DEVICE_INTAKE_IMPORTANT_NOTICE, DEVICE_INTAKE_TERMS_BY_TYPE } from '@/features/device-intake/domain/device-intake-legal-texts';
import { type DeviceIntakeDef } from '@/features/device-intake/domain/device-intake.schema';

/**
 * Planilla de recepción de equipo — hoja A4 imprimible, réplica fiel de la planilla en papel.
 * La Descripción (ayuda-memoria interna) se excluye a propósito: nunca debe imprimirse.
 */
export function DeviceIntakePrintView({ intake, onClose }: { intake: DeviceIntakeDef; onClose: () => void }) {
  const equipmentType = intake.equipmentType as keyof typeof DEVICE_INTAKE_FIELDS;
  const fields = DEVICE_INTAKE_FIELDS[equipmentType];

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
            Imprimir Planilla
          </Button>
        </div>
      </div>

      <div className='flex-1 overflow-auto p-4 sm:p-10 custom-scrollbar'>
        <div
          id='print-area-wrapper'
          className='bg-white text-zinc-900 p-4 sm:p-12 border border-zinc-200 rounded-xl shadow-lg max-w-2xl mx-auto'
        >
          <div className='grid grid-cols-3 items-start mb-5 border-b-2 border-zinc-50 pb-4'>
            <div>
              <h2 className='text-4xl font-black text-zinc-600'>LAN</h2>
              <p className='text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-0.5'>Soluciones Tecnológicas</p>
            </div>
            <div className='flex justify-center'>
              <img
                src='/LAN_icono.jpg'
                alt='LAN Soluciones Tecnológicas'
                className='w-16 h-16 rounded-full object-cover border border-zinc-200 shadow-sm shrink-0'
              />
            </div>
            <div className='text-right'>
              <div className='text-xs font-bold text-zinc-900 uppercase'>Planilla de Recepción de Equipo</div>
              <div className='text-[10px] text-zinc-500 font-medium'>{new Date(intake.createdAt).toLocaleDateString('es-AR')}</div>
            </div>
          </div>

          <h3 className='text-center text-sm font-black uppercase tracking-widest text-zinc-900 mb-4'>
            Planilla de Recepción de Equipo: {EQUIPMENT_TYPE_LABELS[equipmentType]}
          </h3>

          <div className='grid grid-cols-3 gap-x-4 gap-y-2 mb-4'>
            <div>
              <span className='text-[9px] font-bold text-zinc-400 uppercase tracking-widest block'>Quién recibió</span>
              <p className='text-sm font-bold text-zinc-800 truncate'>{intake.receivedByName}</p>
            </div>
            <div>
              <span className='text-[9px] font-bold text-zinc-400 uppercase tracking-widest block'>Fecha</span>
              <p className='text-sm font-bold text-zinc-800'>{new Date(intake.createdAt).toLocaleString('es-AR')}</p>
            </div>
            <div>
              <span className='text-[9px] font-bold text-zinc-400 uppercase tracking-widest block'>Cliente</span>
              <p className='text-sm font-bold text-zinc-800 truncate'>{intake.customer?.name ?? '—'}</p>
            </div>
            <div>
              <span className='text-[9px] font-bold text-zinc-400 uppercase tracking-widest block'>DNI</span>
              <p className='text-sm font-bold text-zinc-800'>{intake.customer?.documentNumber || '—'}</p>
            </div>
            <div>
              <span className='text-[9px] font-bold text-zinc-400 uppercase tracking-widest block'>Teléfono</span>
              <p className='text-sm font-bold text-zinc-800'>{intake.customer?.phone || '—'}</p>
            </div>
          </div>

          {/* Grilla de 2 columnas en vez de una tabla de una sola columna: para equipos con muchos
              campos (Notebook llega a 18) esto reduce a la mitad las filas que ocupa esta sección,
              que es lo que más espacio consume — clave para que todo entre en una sola hoja. */}
          <div className='grid grid-cols-2 gap-x-6 mb-4 border-t border-zinc-100'>
            {fields.map((field) => {
              const raw = intake.specs?.[field.key];
              const value = field.kind === 'boolean' ? (raw ? 'SI' : 'NO') : (raw as string) || '—';
              return (
                <div
                  key={field.key}
                  className='flex justify-between items-baseline gap-2 border-b border-zinc-100 py-1.5'
                >
                  <span className='font-bold text-zinc-500 uppercase text-[9px] shrink-0'>{field.label}</span>
                  <span className='font-bold text-zinc-900 text-xs text-right truncate'>{value}</span>
                </div>
              );
            })}
          </div>

          <div className='mb-4'>
            <span className='text-[9px] font-bold text-zinc-400 uppercase tracking-widest block'>Motivo del Ingreso</span>
            <p className='text-xs text-zinc-800 whitespace-pre-wrap leading-snug'>{intake.intakeReason || '—'}</p>
          </div>

          <div className='mb-4'>
            <span className='text-[9px] font-bold text-zinc-400 uppercase tracking-widest block'>Observaciones</span>
            <p className='text-xs text-zinc-800 whitespace-pre-wrap leading-snug'>{intake.observations || '—'}</p>
          </div>

          <div className='mb-5 p-3 bg-zinc-50 border border-zinc-100 rounded-lg'>
            <p className='text-[10px] text-zinc-700 whitespace-pre-wrap font-medium leading-snug'>{DEVICE_INTAKE_IMPORTANT_NOTICE}</p>
          </div>

          <div className='pt-4 border-t border-zinc-100'>
            <div className='border-b border-zinc-400 h-8' />
            <p className='text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5'>Firma · Aclaración · DNI</p>
          </div>

          {/* break-before-page: fuerza que los términos y condiciones arranquen en una hoja nueva
              (página 2). Si se imprime con "doble faz" activado en el diálogo de impresión, la
              página 1 (datos del equipo) queda en el frente y esta página 2 en el dorso de la
              misma hoja — igual que la planilla en papel original. */}
          <div className='break-before-page pt-8 border-t-2 border-zinc-900'>
            <p className='text-[10px] text-zinc-700 whitespace-pre-wrap leading-relaxed'>{DEVICE_INTAKE_TERMS_BY_TYPE[equipmentType]}</p>
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
