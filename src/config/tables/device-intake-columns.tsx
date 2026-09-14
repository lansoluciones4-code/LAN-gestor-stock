import { type DeviceIntakeDef } from '@/features/device-intake/domain/device-intake.schema';
import { EQUIPMENT_TYPE_LABELS, type EquipmentType } from '@/config/forms/device-intake-fields';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Camera, Printer, Stethoscope, FileCheck2, Edit, Trash2, Plus } from 'lucide-react';

interface ColumnActions {
  role?: string;
  onPhotos: (item: DeviceIntakeDef) => void;
  onPrint: (item: DeviceIntakeDef) => void;
  onPrintDiagnosis: (item: DeviceIntakeDef) => void;
  onDiagnose: (item: DeviceIntakeDef) => void;
  onEdit: (item: DeviceIntakeDef) => void;
  onToggleActive: (item: DeviceIntakeDef) => void;
  onDelete: (id: string) => void;
}

export function getDeviceIntakeColumns({ role, onPhotos, onPrint, onPrintDiagnosis, onDiagnose, onEdit, onToggleActive, onDelete }: ColumnActions): ColumnDef<DeviceIntakeDef>[] {
  return [
    {
      header: 'Cliente',
      cellClassName: 'max-w-[180px]',
      cell: (i) => (
        <div
          className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0'
          title={i.customer?.name}
        >
          <span className='truncate'>{i.customer?.name || '---'}</span>
          {!i.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
        </div>
      ),
    },
    {
      header: 'Equipo',
      cellClassName: 'text-zinc-500',
      cell: (i) => (
        <span className='px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[11px] font-black rounded uppercase'>{EQUIPMENT_TYPE_LABELS[i.equipmentType as EquipmentType]}</span>
      ),
    },
    {
      header: 'Descripción',
      cellClassName: 'text-zinc-500 max-w-[220px] truncate',
      cell: (i) => <span title={i.description}>{i.description || '---'}</span>,
    },
    {
      header: 'Recibida por',
      cellClassName: 'text-zinc-500 max-w-[140px] truncate',
      cell: (i) => i.receivedByName,
    },
    {
      header: 'Fecha',
      cellClassName: 'whitespace-nowrap text-zinc-500',
      cell: (i) => {
        const date = new Date(i.createdAt);
        return `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
      },
    },
    {
      header: 'Diagnóstico',
      cell: (i) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${i.diagnosed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
          {i.diagnosed ? 'Diagnosticado' : 'Pendiente'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      cellClassName: 'flex gap-1 justify-end flex-wrap',
      cell: (i: DeviceIntakeDef) => (
        <>
          <button
            onClick={() => onPhotos(i)}
            className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-500/10 dark:hover:text-sky-400 rounded-lg transition-colors'
            title='Fotos del estado inicial'
          >
            <Camera className='w-4 h-4' />
          </button>
          <button
            onClick={() => onPrint(i)}
            className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 rounded-lg transition-colors'
            title='Imprimir Planilla de Recepción'
          >
            <Printer className='w-4 h-4' />
          </button>
          <button
            onClick={() => onDiagnose(i)}
            className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 rounded-lg transition-colors'
            title='Diagnóstico Final'
          >
            <Stethoscope className='w-4 h-4' />
          </button>
          {i.diagnosed && (
            <button
              onClick={() => onPrintDiagnosis(i)}
              className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 rounded-lg transition-colors'
              title='Imprimir Diagnóstico Final'
            >
              <FileCheck2 className='w-4 h-4' />
            </button>
          )}
          <button
            onClick={() => onEdit(i)}
            className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400 rounded-lg transition-colors'
            title='Editar'
          >
            <Edit className='w-4 h-4' />
          </button>
          {role === 'admin' && (
            <>
              <button
                onClick={() => onToggleActive(i)}
                className='p-1.5 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                title={i.isActive ? 'Desactivar' : 'Activar'}
              >
                <Plus className={`w-4 h-4 ${i.isActive ? 'rotate-45' : ''}`} />
              </button>
              <button
                onClick={() => onDelete(i.id!)}
                className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors'
                title='Eliminar'
              >
                <Trash2 className='w-4 h-4' />
              </button>
            </>
          )}
        </>
      ),
    },
  ];
}
