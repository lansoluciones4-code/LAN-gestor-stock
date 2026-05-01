import * as React from 'react';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  headers?: string[];
  isPending?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, headers, isPending, children, ...props }, ref) => (
  <div className='relative overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 flex-1 bg-white dark:bg-zinc-900 custom-scrollbar'>
    <table
      ref={ref}
      className={`w-full text-[17px] text-left text-zinc-600 dark:text-zinc-400 ${className || ''}`}
      {...props}
    >
      {headers && (
        <thead className='sticky top-0 z-10 text-sm uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className='px-6 py-4 font-medium'
                scope='col'
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
      )}
      {headers ? <tbody className={`divide-y divide-zinc-200 dark:divide-zinc-800 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>{children}</tbody> : children}
    </table>
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={`sticky top-0 z-10 text-sm uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm ${className || ''}`}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={`divide-y divide-zinc-200 dark:divide-zinc-800 ${className || ''}`}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors ${className || ''}`}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    scope='col'
    className={`px-6 py-4 ${className || ''}`}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={`px-6 py-4 ${className || ''}`}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
