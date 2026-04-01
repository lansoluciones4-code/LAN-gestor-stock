'use client';

import * as React from 'react';
import { TableVirtuoso, type TableComponents } from 'react-virtuoso';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { type ColumnDef } from './data-table';

interface VirtualizedDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  hasMore?: boolean;
  onEndReached?: () => void;
  /**
   * Altura aproximada de cada fila para el cálculo inicial.
   * Por defecto 64px que es el promedio de tus tablas.
   */
  fixedItemHeight?: number;
}

/**
 * Mapeo de componentes internos de Virtuoso para usar tus estilos de UI/Table.
 * Esto garantiza que visualmente el componente sea idéntico al DataTable estático.
 */
const VirtuosoComponents: TableComponents<any> = {
  Scroller: React.forwardRef((props, ref) => (
    <div {...props} ref={ref} className="relative overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 flex-1 bg-white dark:bg-zinc-900 custom-scrollbar scroll-smooth" />
  )),
  Table: (props) => (
    <table {...props} className="w-full text-[17px] text-left text-zinc-600 dark:text-zinc-400 border-separate border-spacing-0" />
  ),
  TableHead: React.forwardRef((props, ref) => (
    <thead {...props} ref={ref} className="sticky top-0 z-10 text-sm uppercase bg-zinc-50/95 dark:bg-zinc-800/95 backdrop-blur-sm text-zinc-500 dark:text-zinc-400 shadow-sm" />
  )),
  TableRow: (props) => (
    <tr {...props} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group" />
  ),
  TableBody: React.forwardRef((props, ref) => (
    <tbody {...props} ref={ref} className="divide-y divide-zinc-200 dark:divide-zinc-800" />
  )),
};

export function VirtualizedDataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No se han encontrado resultados.',
  hasMore,
  onEndReached,
  fixedItemHeight = 64,
}: VirtualizedDataTableProps<T>) {
  
  const colSpanCount = columns.length;

  // Renderizador de fila para Virtuoso
  const rowContent = (_index: number, row: T) => {
    return (
      <>
        {columns.map((col, idx) => (
          <TableCell key={`v-cell-${row.id}-${idx}`} className={col.cellClassName}>
            {col.cell(row)}
          </TableCell>
        ))}
      </>
    );
  };

  // Pie de tabla para Loading
  const Footer = () => {
    if (!hasMore) return null;
    return (
      <tr>
        <TableCell colSpan={colSpanCount} className='text-center py-6'>
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Sincronizando Historial...</div>
          </div>
        </TableCell>
      </tr>
    );
  };

  if (data.length === 0 && !isLoading) {
    return (
      <Table>
        <TableHeader>
          <tr>
            {columns.map((col, idx) => (
              <TableHead key={`v-empty-h-${idx}`} className={col.headerClassName}>{col.header}</TableHead>
            ))}
          </tr>
        </TableHeader>
        <TableBody>
          <tr>
            <TableCell colSpan={colSpanCount} className='py-20 text-center opacity-60'>
              {emptyMessage}
            </TableCell>
          </tr>
        </TableBody>
      </Table>
    );
  }

  return (
    <TableVirtuoso
      data={data}
      fixedItemHeight={fixedItemHeight}
      endReached={onEndReached}
      increaseViewportBy={300}
      fixedHeaderContent={() => (
        <tr>
          {columns.map((col, idx) => (
            <TableHead key={`v-head-${idx}`} className={col.headerClassName}>
              {col.header}
            </TableHead>
          ))}
        </tr>
      )}
      itemContent={rowContent}
      components={{
        ...VirtuosoComponents,
        TableFoot: Footer
      }}
      style={{ height: '100%', width: '100%' }}
    />
  );
}
