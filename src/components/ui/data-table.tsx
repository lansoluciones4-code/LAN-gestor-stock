import * as React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export interface ColumnDef<T> {
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  cell: (item: T) => React.ReactNode;
  hideRole?: string[]; 
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  hasMore?: boolean;
  observerRef?: React.Ref<HTMLTableRowElement>;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No se han encontrado resultados.',
  hasMore,
  observerRef,
}: DataTableProps<T>) {
  
  const colSpanCount = columns.length;

  return (
    <Table>
      <TableHeader>
        <tr>
          {columns.map((col, idx) => (
            <TableHead key={`col-head-${idx}`} className={col.headerClassName}>
              {col.header}
            </TableHead>
          ))}
        </tr>
      </TableHeader>
      <TableBody className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
        {data.map((row) => (
          <TableRow key={`row-${row.id}`}>
            {columns.map((col, idx) => (
              <TableCell key={`cell-${row.id}-${idx}`} className={col.cellClassName}>
                {col.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {data.length === 0 && !isLoading && (
          <tr>
            <TableCell colSpan={colSpanCount} className='py-8 text-center'>
              {emptyMessage}
            </TableCell>
          </tr>
        )}
        {hasMore && (
         <tr ref={observerRef}>
           <TableCell colSpan={colSpanCount} className='text-center py-4'>
             <div className="text-xs text-zinc-400 animate-pulse">Cargando resultados...</div>
           </TableCell>
         </tr>
        )}
      </TableBody>
    </Table>
  );
}
