'use client';

import * as React from 'react';
import { TableVirtuoso, type TableComponents } from 'react-virtuoso';
import { Table, TableHeader, TableBody, TableHead, TableCell } from '@/components/ui/table';
export interface ColumnDef<T> {
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string | ((item: T) => string);
  cell: (item: T) => React.ReactNode;
  hideRole?: string[];
}

interface VirtualizedDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  hasMore?: boolean;
  onEndReached?: () => void;
  fixedItemHeight?: number;
}

const Scroller = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div
    {...props}
    ref={ref}
    className='relative overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 flex-1 bg-white dark:bg-zinc-900 custom-scrollbar scroll-smooth'
  />
));
Scroller.displayName = 'Scroller';

const VirtuosoTableHead = React.forwardRef<HTMLTableSectionElement, any>((props, ref) => (
  <thead
    {...props}
    ref={ref}
    className='sticky top-0 z-10 text-sm uppercase bg-zinc-50/95 dark:bg-zinc-800/95 backdrop-blur-sm text-zinc-500 dark:text-zinc-400 shadow-sm'
  />
));
VirtuosoTableHead.displayName = 'VirtuosoTableHead';

const VirtuosoTableBody = React.forwardRef<HTMLTableSectionElement, any>((props, ref) => (
  <tbody
    {...props}
    ref={ref}
    className='divide-y divide-zinc-200 dark:divide-zinc-800'
  />
));
VirtuosoTableBody.displayName = 'VirtuosoTableBody';

const VirtuosoComponents: TableComponents<any> = {
  Scroller,
  Table: (props) => (
    <table
      {...props}
      className='w-full text-[17px] text-left text-zinc-600 dark:text-zinc-400 border-separate border-spacing-0 table-fixed'
    />
  ),
  TableHead: VirtuosoTableHead,
  TableRow: (props) => (
    <tr
      {...props}
      className='hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group'
    />
  ),
  TableBody: VirtuosoTableBody,
};

export function VirtualizedDataTable<T extends { id: string | number }>({ columns, data, isLoading, emptyMessage = 'No se han encontrado resultados.', hasMore, onEndReached, fixedItemHeight = 64 }: VirtualizedDataTableProps<T>) {
  const colSpanCount = columns.length;

  const rowContent = (_index: number, row: T) => {
    return (
      <>
        {columns.map((col, idx) => {
          const className = typeof col.cellClassName === 'function' ? col.cellClassName(row) : col.cellClassName;
          return (
            <TableCell
              key={`v-cell-${row.id}-${idx}`}
              className={className}
            >
              {col.cell(row)}
            </TableCell>
          );
        })}
      </>
    );
  };

  const Footer = () => {
    if (!hasMore) return null;
    return (
      <tr>
        <TableCell
          colSpan={colSpanCount}
          className='text-center py-6'
        >
          <div className='flex flex-col items-center gap-2'>
            <div className='w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin'></div>
            <div className='text-[10px] font-black text-indigo-500 uppercase tracking-widest animate-pulse'>Sincronizando Historial...</div>
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
              <TableHead
                key={`v-empty-h-${idx}`}
                className={col.headerClassName}
              >
                {col.header}
              </TableHead>
            ))}
          </tr>
        </TableHeader>
        <TableBody>
          <tr>
            <TableCell
              colSpan={colSpanCount}
              className='py-20 text-center opacity-60'
            >
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
            <TableHead
              key={`v-head-${idx}`}
              className={col.headerClassName}
            >
              {col.header}
            </TableHead>
          ))}
        </tr>
      )}
      itemContent={rowContent}
      components={{
        ...VirtuosoComponents,
        TableFoot: Footer,
      }}
      style={{ height: '100%', width: '100%' }}
    />
  );
}
