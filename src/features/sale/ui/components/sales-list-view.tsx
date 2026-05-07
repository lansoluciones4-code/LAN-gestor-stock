'use client';

import { Plus, RefreshCcw } from 'lucide-react';
import { type SaleDef } from '@/features/sale/domain/sale.schema';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getSalesColumns } from '@/config/tables/sales-columns';
import { normalizeForSearch } from '@/lib/utils';
import { TEST_IDS } from '@/constants/test-ids';
import { renderSaleCard } from '@/config/cards/sales-card';

interface SalesListViewProps {
  sales: SaleDef[];
  isPending: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onSync: () => void;
  onNewSale: () => void;
  onPrintRow: (s: SaleDef) => void;
  onDeleteRow: (id: string) => void;
  globalMessage: React.ReactNode;
}

function filterSales(sales: SaleDef[], searchTerm: string, startDate: string, endDate: string) {
  return sales.filter((s) => {
    const terms = normalizeForSearch(searchTerm).split(/\s+/);
    const text = [normalizeForSearch(s.customer?.name || 'Consumidor Final'), normalizeForSearch(s.vendor?.username || '')].join(' ');
    if (!terms.every((w) => text.includes(w))) return false;

    const saleTime = new Date(s.createdAt).getTime();
    if (startDate && saleTime < new Date(startDate + 'T00:00:00').getTime()) return false;
    if (endDate && saleTime > new Date(endDate + 'T23:59:59').getTime()) return false;
    return true;
  });
}

export function SalesListView({ sales, isPending, searchTerm, setSearchTerm, startDate, setStartDate, endDate, setEndDate, onSync, onNewSale, onPrintRow, onDeleteRow, globalMessage }: SalesListViewProps) {
  const role = useAuthStore((s) => s.user?.role);
  const filteredSales = filterSales(sales, searchTerm, startDate, endDate);
  const columns = getSalesColumns({ role, onPrint: onPrintRow, onDelete: onDeleteRow });

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden animate-in fade-in duration-300'>
      <PanelToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder='Filtrar ventas por cliente o vendedor...'
        searchPlaceholderMobile='Buscar ventas...'
        data-testid={TEST_IDS.general.inputBusquedaTabla}
        filters={
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            data-testid={TEST_IDS.ventas.page.inputFiltroFecha}
          />
        }
        sync={
          <Button variant='secondary' size='icon' onClick={onSync} disabled={isPending} title='Sincronizar' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>
        }
        actions={
          <Button variant='primary' onClick={onNewSale} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
            <span className='hidden sm:inline'>Nueva Venta</span>
            <span className='sm:hidden'>Nueva</span>
          </Button>
        }
      />

      {globalMessage}

      <ResponsivePanelView
        columns={columns}
        data={filteredSales}
        isLoading={isPending}
        emptyMessage='No hay operaciones que coincidan con los filtros.'
        renderCard={renderSaleCard({ role, onPrint: onPrintRow, onDelete: onDeleteRow })}
      />
    </div>
  );
}
