'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { saleRepository } from '@/features/sale/repository/sale.repository';
import { saleCreateSchema, saleRowSchema, type SaleInput, type SaleDef } from '@/features/sale/domain/sale.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

/**
 * Fetch all sales. Vendors can see their history.
 */
export async function fetchSales(): Promise<SaleDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    const list = await saleRepository.getAllSales();

    // Zod will parse and convert strings to numbers
    return z.array(saleRowSchema).parse(list);
  } catch (error) {
    console.error('fetchSales error:', error);
    return [];
  }
}

/**
 * Create a new sale. Decrements stock.
 */
export async function createSaleAction(input: SaleInput): Promise<ActionResult<{ id: string }>> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = saleCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await saleRepository.createSale(caller.id, parsed.data, tx);

      const saleDetail = {
        total: String(parsed.data.total),
        itemCount: parsed.data.items.length,
        discountAmount: String(parsed.data.discountAmount ?? 0),
        discountPercentage: String(parsed.data.discountPercentage ?? 0),
        paymentTypes: parsed.data.payments?.map((p) => p.type) ?? [],
      };

      await recordAuditLog(caller.id, 'CREAR', 'SALE', result.id, saleDetail, tx);

      return {
        success: true,
        message: 'Venta realizada con éxito',
        data: { id: result.id },
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Venta') };
  }
}

/**
 * Delete a sale. Admin ONLY.
 */
export async function deleteSaleAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const sale = await saleRepository.getSaleById(id);
      if (!sale) return { success: false, error: MESSAGES.ERROR.DATABASE.NOT_FOUND('Venta') };

      const saleDetail = {
        snapshotTotal: String(sale.total),
        customerName: sale.customer?.name ?? 'Sin cliente',
        vendorUsername: sale.vendor?.username ?? 'Desconocido',
        itemCount: sale.items.length,
        items: sale.items.map((item) => ({
          productName: item.product?.device?.name ?? 'Producto',
          description: item.product?.description ?? '',
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
        })),
        paymentTypes: sale.payments.map((p) => p.type),
        note: 'Venta anulada. Stock restablecido.',
      };

      await saleRepository.deleteSale(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'SALE', id, saleDetail, tx);
      return { success: true, message: 'Venta anulada y stock restablecido.' };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Venta') };
  }
}
