import { type CardDef } from '@/features/card/domain/card.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ColumnActions {
  role?: string;
  onEdit: (c: CardDef) => void;
  onToggleActive: (c: CardDef) => void;
  onDelete: (id: string) => void;
}

function InstallmentChips({ card }: { card: CardDef }) {
  if (card.installments.length === 0) return <span className='text-zinc-400'>Sin cuotas configuradas</span>;
  const sorted = [...card.installments].sort((a, b) => a.installments - b.installments);
  return (
    <div className='flex flex-wrap gap-1'>
      {sorted.map((i) => (
        <span
          key={i.id}
          className='px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
        >
          {i.installments}x{i.interestPercentage > 0 ? ` | ${i.interestPercentage}% de recargo` : ' | sin interés'}
        </span>
      ))}
    </div>
  );
}

export function getCardColumns({ role, onEdit, onToggleActive, onDelete }: ColumnActions): ColumnDef<CardDef>[] {
  return [
    {
      header: 'Nombre de tarjeta',
      cellClassName: 'max-w-[200px]',
      cell: (c) => (
        <div
          className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0'
          title={c.name}
        >
          <span className='truncate'>{c.name}</span>
          {!c.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
        </div>
      ),
    },
    {
      header: 'Cuotas / Interés',
      cellClassName: 'max-w-[320px]',
      cell: (c) => <InstallmentChips card={c} />,
    },
    ...(role === 'admin'
      ? [
          {
            header: 'Acciones',
            headerClassName: 'text-right',
            cellClassName: 'flex gap-1 justify-end',
            cell: (c: CardDef) => (
              <>
                <button
                  onClick={() => onToggleActive(c)}
                  className='p-1.5 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                  title={c.isActive ? 'Desactivar' : 'Activar'}
                >
                  <Plus className={`w-4 h-4 ${c.isActive ? 'rotate-45' : ''}`} />
                </button>
                <button
                  onClick={() => onEdit(c)}
                  className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400 rounded-lg transition-colors'
                  title='Editar'
                >
                  <Edit className='w-4 h-4' />
                </button>
                <button
                  onClick={() => onDelete(c.id!)}
                  className='p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors'
                  title='Eliminar'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </>
            ),
          },
        ]
      : []),
  ];
}
