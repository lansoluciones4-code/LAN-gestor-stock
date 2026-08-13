/* eslint-disable react/display-name */
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { EntityCard, CardAction } from '@/components/ui/entity-card';
import { type CardDef } from '@/features/card/domain/card.schema';

interface CardCardActionsProps {
  role?: string;
  onEdit: (c: CardDef) => void;
  onDelete: (id: string) => void;
  onToggleActive: (c: CardDef) => void;
}

export function renderCardCard(actions: CardCardActionsProps) {
  return (card: CardDef) => {
    const sorted = [...card.installments].sort((a, b) => a.installments - b.installments);
    return (
      <EntityCard
        key={card.id}
        title={card.name}
        badges={
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${card.isActive ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            {card.isActive ? 'Activo' : 'Inactivo'}
          </span>
        }
        details={
          <div className='flex flex-wrap gap-1 mt-1'>
            {sorted.length === 0 ? (
              <span className='text-xs text-zinc-400'>Sin cuotas configuradas</span>
            ) : (
              sorted.map((i) => (
                <span
                  key={i.id}
                  className='px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                >
                  {i.installments}x{i.interestPercentage > 0 ? ` | ${i.interestPercentage}% de recargo` : ' | sin interés'}
                </span>
              ))
            )}
          </div>
        }
        actions={
          <>
            <CardAction
              icon={card.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />}
              label={card.isActive ? 'Desactivar' : 'Activar'}
              onClick={() => actions.onToggleActive(card)}
              variant={card.isActive ? 'warning' : 'success'}
            />
            <CardAction
              icon={<Edit className='w-4 h-4' />}
              label='Editar'
              onClick={() => actions.onEdit(card)}
            />
            {actions.role === 'admin' && (
              <CardAction
                icon={<Trash2 className='w-4 h-4' />}
                label='Eliminar'
                onClick={() => actions.onDelete(card.id!)}
                variant='danger'
              />
            )}
          </>
        }
      />
    );
  };
}
