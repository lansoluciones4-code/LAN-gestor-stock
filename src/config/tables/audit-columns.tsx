import { type AuditLogDef } from '@/features/audit/domain/audit-log.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Eye } from 'lucide-react';

interface ColumnActions {
  onView: (log: AuditLogDef) => void;
}

const getActionColor = (action: string) => {
  const a = action.toUpperCase();
  switch (a) {
    case 'CREAR':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/40';
    case 'ACTUALIZAR':
    case 'EDITAR':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/40';
    case 'ELIMINAR':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/40 font-black';
    case 'PÉRDIDA':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/40';
    case 'DEVOLUCIÓN':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/40';
    case 'LOGIN':
      return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-transparent dark:text-zinc-500 dark:border-zinc-800';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800';
  }
};

export function getAuditColumns({ onView }: ColumnActions): ColumnDef<AuditLogDef>[] {
  return [
    {
      header: 'Fecha y Hora',
      cell: (log) => {
        const date = new Date(log.createdAt);
        const dateString = date.toLocaleDateString('es-AR');
        const timeString = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        return (
          <div className='font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap truncate'>
            {dateString}
            <span
              title={timeString}
              className='text-zinc-600 dark:text-zinc-400 ml-1'
            >
              {timeString}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Operador',
      cellClassName: 'font-bold text-zinc-700 dark:text-zinc-300 uppercase text-[15px] max-w-[120px] truncate',
      cell: (log) => <span title={log.user?.username || 'SISTEMA'}>{log.user?.username || 'SISTEMA'}</span>,
    },
    {
      header: 'Acción',
      cellClassName: 'max-w-[120px] truncate',
      cell: (log) => (
        <span
          className={`px-2.5 py-1 rounded border font-black tracking-widest text-[13px] truncate block w-full text-center ${getActionColor(log.action)}`}
          title={log.action}
        >
          {log.action}
        </span>
      ),
    },
    {
      header: 'Entidad',
      cellClassName: 'font-black uppercase text-zinc-400 tracking-widest text-[14px] max-w-[100px] truncate',
      cell: (log) => (
        <span title={log.entity}>
          {{
            USER: 'USUARIO',
            PROVIDER: 'PROVEEDOR',
            PRODUCT: 'PRODUCTO',
            CUSTOMER: 'CLIENTE',
            DEVICE: 'EQUIPO',
            SALE: 'VENTA',
          }[log.entity] || log.entity}
        </span>
      ),
    },
    {
      header: 'Referencia',
      headerClassName: 'w-[280px] font-bold',
      cellClassName: 'w-[280px] font-bold text-[15px] truncate',
      cell: (log) => {
        const name = log.product?.device?.name || log.customer?.name || log.provider?.name || log.device?.name || log.targetUser?.username || (log.sale ? `$${Number(log.sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null);

        const displayName = name || log.entityId?.substring(0, 8).toUpperCase() || '--';
        const fullTitle = name ? `${name} (${log.entityId})` : log.entityId || '--';

        return <span title={fullTitle}>{displayName}</span>;
      },
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right font-bold',
      cellClassName: 'flex justify-end',
      cell: (log) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(log);
          }}
          className='p-1.5 text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-500/10 rounded-lg transition-colors shadow-sm'
          title='Ver Detalle'
        >
          <Eye className='w-4 h-4' />
        </button>
      ),
    },
  ];
}
