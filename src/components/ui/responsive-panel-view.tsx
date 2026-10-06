'use client';

import * as React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { VirtualizedDataTable, type ColumnDef } from '@/components/ui/virtualized-data-table';

interface ResponsivePanelViewProps<T extends { id: string | number }> {
  /** Column definitions used by the desktop table */
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  /** Card renderer for mobile (<xl) */
  renderCard: (item: T) => React.ReactNode;
  /** Infinite-scroll: called when user reaches bottom */
  onEndReached?: () => void;
  hasMore?: boolean;
  fixedItemHeight?: number;
  /** Contenido que en mobile/tablet va arriba de las cards y scrollea junto con ellas (en vez de quedar fijo y cortarse). */
  mobileHeader?: React.ReactNode;
}

interface CardListContext {
  header?: React.ReactNode;
}

// Componente estable (fuera del render): si Virtuoso recibiera uno nuevo en cada render, remontaría el
// header y se perdería el foco de cualquier input que tenga adentro. El contenido le llega por `context`.
const CardListHeader = ({ context }: { context?: CardListContext }) => <>{context?.header}</>;

CardListHeader.displayName = 'CardListHeader';

const CardListFooter = ({ hasMore }: { hasMore?: boolean }) => {
  if (!hasMore) return null;
  return (
    <div className='flex flex-col items-center gap-2 py-6'>
      <div className='w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin' />
      <div className='text-[10px] font-black text-zinc-500 uppercase tracking-widest animate-pulse'>
        Sincronizando...
      </div>
    </div>
  );
};

CardListFooter.displayName = 'CardListFooter';

/**
 * Renders a virtualized TABLE on xl+ screens and
 * a virtualized CARD LIST on smaller screens.
 *
 * Both use react-virtuoso (TableVirtuoso / Virtuoso) and share
 * the same onEndReached prop for infinite scroll.
 */
export function ResponsivePanelView<T extends { id: string | number }>({
  columns,
  data,
  isLoading,
  emptyMessage,
  renderCard,
  onEndReached,
  hasMore,
  fixedItemHeight,
  mobileHeader,
}: ResponsivePanelViewProps<T>) {
  return (
    <>
      {/* Desktop: virtualized table — hidden below xl */}
      <div className='hidden xl:flex flex-1 overflow-hidden'>
        <VirtualizedDataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          hasMore={hasMore}
          onEndReached={onEndReached}
          fixedItemHeight={fixedItemHeight}
        />
      </div>

      {/* Mobile/tablet: virtualized card list — hidden at xl+ */}
      <div className='flex flex-col flex-1 overflow-hidden xl:hidden'>
        {data.length === 0 && !isLoading ? (
          <div className='flex flex-col flex-1 overflow-y-auto custom-scrollbar'>
            {mobileHeader}
            <div className='flex flex-1 items-center justify-center py-20 text-zinc-400 text-sm font-medium text-center opacity-60'>
              {emptyMessage}
            </div>
          </div>
        ) : (
          <Virtuoso
            data={data}
            context={{ header: mobileHeader }}
            endReached={onEndReached}
            increaseViewportBy={400}
            itemContent={(_, item) => (
              <div className='px-0 pb-3'>
                {renderCard(item)}
              </div>
            )}
            components={{
              Header: CardListHeader,
              Footer: () => <CardListFooter hasMore={hasMore} />,
            }}
            style={{ height: '100%' }}
            className='custom-scrollbar'
          />
        )}
      </div>
    </>
  );
}
