/* eslint-disable react/display-name */
import { Eye } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type AuditLogDef } from '@/features/audit/domain/audit-log.schema';

interface AuditCardActionsProps {
  onView: (log: AuditLogDef) => void;
}

const ENTITY_LABELS: Record<string, string> = {
  USER: 'USUARIO',
  PROVIDER: 'PROVEEDOR',
  PRODUCT: 'PRODUCTO',
  CUSTOMER: 'CLIENTE',
  DEVICE: 'EQUIPO',
  SALE: 'VENTA',
};

const ACTION_COLORS: Record<string, string> = {
  CREAR: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400',
  ACTUALIZAR: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400',
  EDITAR: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400',
  ELIMINAR: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400',
  'PÉRDIDA': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400',
  'DEVOLUCIÓN': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400',
  LOGIN: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400',
};

function getReference(log: AuditLogDef): string {
  return (
    log.product?.device?.name ||
    log.customer?.name ||
    log.provider?.name ||
    log.device?.name ||
    log.targetUser?.username ||
    (log.sale ? `$${Number(log.sale.total).toLocaleString('es-AR')}` : null) ||
    log.entityId?.substring(0, 8).toUpperCase() ||
    '--'
  );
}

export function renderAuditCard(actions: AuditCardActionsProps) {
  return (log: AuditLogDef) => {
    const date = new Date(log.createdAt);
    const dateStr = date.toLocaleDateString('es-AR');
    const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const actionColor = ACTION_COLORS[log.action.toUpperCase()] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';

    return (
      <EntityCard
        key={log.id}
        title={
          <span>
            {dateStr}{' '}
            <span className='text-zinc-600 dark:text-zinc-400 font-bold'>{timeStr}</span>
          </span>
        }
        subtitle={`Por: ${log.user?.username ?? 'SISTEMA'}`}
        badges={
          <>
            <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase leading-tight inline-block ${actionColor}`}>
              {log.action.replace(/_/g, ' ')}
            </span>
            <span className='px-2.5 py-0.5 rounded text-xs font-black tracking-widest uppercase bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
              {ENTITY_LABELS[log.entity] ?? log.entity}
            </span>
          </>
        }
        details={
          <div className='flex justify-between items-center mt-1'>
            <span className='text-xs text-zinc-400'>Referencia</span>
            <span className='font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]'>{getReference(log)}</span>
          </div>
        }
        actions={
          <CardAction
            icon={<Eye className='w-4 h-4' />}
            label='Ver Detalle'
            onClick={() => actions.onView(log)}
          />
        }
      />
    );
  };
}
