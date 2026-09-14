'use server';

import { db } from '@/lib/db';
import { expenseRepository } from '@/features/expense/repository/expense.repository';
import { expenseCreateSchema, expenseUpdateSchema, expenseRowSchema, type ExpenseInput, type ExpenseUpdateInput, type ExpenseDef } from '@/features/expense/domain/expense.schema';
import type { ExpenseRow, ExpensesDashboardData } from '@/features/expense/domain/expense-dashboard.types';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';
import { argDateRangeBounds } from '@/lib/utils';

function toRow(e: any): ExpenseRow {
  return {
    id: e.id,
    version: e.version,
    section: e.section,
    providerId: e.providerId,
    providerName: e.provider?.name || 'Proveedor eliminado',
    pointOfSale: e.pointOfSale,
    receiptNumber: e.receiptNumber,
    amount: Number(e.amount),
    date: e.date,
  };
}

/**
 * Lectura agregada para el dashboard de Gastos — sigue el mismo patrón ad-hoc que
 * `fetchDashboardStats` (`{success,data}` en vez de `ActionResult<T>`), ya que es un resumen de
 * solo lectura, no una entidad CRUD individual.
 */
export async function fetchExpensesDashboard(startDate?: string, endDate?: string) {
  try {
    await verifyAuthOrAdmin(true);
    const { start, end } = argDateRangeBounds(startDate, endDate);
    const list = await expenseRepository.getExpensesByDateRange(start, end);

    const kpiMap = new Map<string, { providerId: string; providerName: string; total: number }>();
    const techExpenses: ExpenseRow[] = [];
    const libreriaExpenses: ExpenseRow[] = [];

    for (const e of list) {
      const row = toRow(e);

      const kpi = kpiMap.get(row.providerId) || { providerId: row.providerId, providerName: row.providerName, total: 0 };
      kpi.total += row.amount;
      kpiMap.set(row.providerId, kpi);

      if (row.section === 'libreria') {
        libreriaExpenses.push(row);
      } else {
        techExpenses.push(row);
      }
    }

    const kpisByProvider = Array.from(kpiMap.values()).sort((a, b) => b.total - a.total);
    const data: ExpensesDashboardData = { kpisByProvider, techExpenses, libreriaExpenses };

    return { success: true as const, data };
  } catch (error) {
    console.error('fetchExpensesDashboard error:', error);
    return { success: false as const, message: 'Error al obtener los gastos' };
  }
}

export async function createExpenseAction(input: ExpenseInput): Promise<ActionResult<ExpenseDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = expenseCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const created = await expenseRepository.createExpense(parsed.data, tx);
      await recordAuditLog(
        caller.id,
        'CREAR',
        'GASTO',
        created.id,
        { section: created.section, boleta: `${created.pointOfSale}-${created.receiptNumber}`, amount: created.amount },
        tx
      );
      const withRelations = await expenseRepository.getExpenseById(created.id, tx);
      return { success: true, message: MESSAGES.SUCCESS.CREATED('Boleta'), data: expenseRowSchema.parse(withRelations) };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Boleta') };
  }
}

export async function updateExpenseAction(id: string, input: ExpenseUpdateInput): Promise<ActionResult<ExpenseDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = expenseUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await expenseRepository.updateExpense(id, parsed.data, tx);
      await recordAuditLog(
        caller.id,
        'ACTUALIZAR',
        'GASTO',
        id,
        { section: updated.section, boleta: `${updated.pointOfSale}-${updated.receiptNumber}`, amount: updated.amount },
        tx
      );
      const withRelations = await expenseRepository.getExpenseById(id, tx);
      return { success: true, message: MESSAGES.SUCCESS.UPDATED('Boleta'), data: expenseRowSchema.parse(withRelations) };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Boleta') };
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const existing = await tx.query.expenses.findFirst({ where: (e: any, { eq }: any) => eq(e.id, id) });
      await expenseRepository.deleteExpense(id, tx);
      await recordAuditLog(
        caller.id,
        'ELIMINAR',
        'GASTO',
        id,
        { boleta: existing ? `${existing.pointOfSale}-${existing.receiptNumber}` : 'Desconocida', amount: existing?.amount },
        tx
      );
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Boleta') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Boleta') };
  }
}
