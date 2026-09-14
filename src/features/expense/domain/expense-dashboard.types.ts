import type { ExpenseSection } from '@/features/expense/domain/expense.schema';

/**
 * Fila "aplanada" de una boleta para el dashboard de Gastos (tablas Tech/Librería). Trae todos los
 * campos crudos (no solo los de display) para poder precargar el formulario de edición sin un
 * fetch aparte.
 */
export interface ExpenseRow {
  id: string;
  version: number;
  section: ExpenseSection;
  providerId: string;
  providerName: string;
  pointOfSale: string;
  receiptNumber: string;
  amount: number;
  date: string | Date;
}

/** Total gastado a un proveedor en el rango de fechas filtrado — un cuadrado KPI por proveedor. */
export interface ExpenseKpi {
  providerId: string;
  providerName: string;
  total: number;
}

export interface ExpensesDashboardData {
  kpisByProvider: ExpenseKpi[];
  techExpenses: ExpenseRow[];
  libreriaExpenses: ExpenseRow[];
}
