import { Plus, RefreshCcw } from 'lucide-react';
import { type SaleDef } from '@/schemas/sale.schema';
import { VirtualizedDataTable } from '@/components/ui/virtualized-data-table';
import { SearchBar } from '@/components/ui/search-bar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { getSalesColumns } from '@/config/tables/sales-columns';
import { normalizeString } from '@/lib/utils';

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
  globalMessage: { type: 'success' | 'error' | 'info'; text: string } | null;
}

export function SalesListView({ sales, isPending, searchTerm, setSearchTerm, startDate, setStartDate, endDate, setEndDate, onSync, onNewSale, onPrintRow, onDeleteRow, globalMessage }: SalesListViewProps) {
  const role = useAuthStore((s) => s.user?.role);

  const filteredSales = sales.filter((s) => {
    const terms = normalizeString(searchTerm).split(/\s+/);
    const combinedText = [
      normalizeString(s.customer?.name || 'Consumidor Final'),
      normalizeString(s.vendor?.username || '')
    ].join(' ');
    
    const matchesSearch = terms.every(word => combinedText.includes(word));
    const saleTime = new Date(s.createdAt).getTime();

    let matchesStart = true;
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      matchesStart = saleTime >= start.getTime();
    }

    let matchesEnd = true;
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59');
      matchesEnd = saleTime <= end.getTime();
    }

    return matchesSearch && matchesStart && matchesEnd;
  });

  const columns = getSalesColumns({
    role,
    onPrint: onPrintRow,
    onDelete: onDeleteRow,
  });

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-4 mb-6 shrink-0">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar ventas por cliente o vendedor..."
          />
        </div>

        <div className="flex gap-2 items-center">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />

          <Button
            variant="secondary"
            size="icon"
            onClick={() => onSync()}
            disabled={isPending}
            title="Sincronizar"
          >
            <RefreshCcw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            onClick={onNewSale}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Nueva Venta
          </Button>
        </div>
      </div>

      {globalMessage && <div className={`shrink-0 mb-4 p-4 rounded-lg flex items-center shadow-sm text-sm border ${globalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'}`}>{globalMessage.text}</div>}

      <VirtualizedDataTable
        columns={columns}
        data={filteredSales}
        isLoading={isPending}
        emptyMessage="No hay operaciones que coincidan con los filtros."
      />
    </div>
  );
}
