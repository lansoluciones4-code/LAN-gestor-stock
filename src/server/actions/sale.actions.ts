'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { saleRepository } from '@/server/repositories/sale.repository';
import { saleSchema, saleDefSchema, type SaleInput, type SaleDef } from '@/schemas/sale.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

/**
 * Fetch all sales. Vendors can see their history.
 */
export async function fetchSales(): Promise<SaleDef[]> {
  try {
    await verifyAuthOrAdmin(false); 
    const list = await saleRepository.getAllSales();
    
    // Zod will parse and convert strings to numbers
    return z.array(saleDefSchema).parse(list);
  } catch (error) {
    console.error('fetchSales error:', error);
    return [];
  }
}

/**
 * Create a new sale. Decrements stock.
 */
export async function createSaleAction(input: SaleInput) {
  try {
    const caller = await verifyAuthOrAdmin(false); 
    const parsed = saleSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos de venta inválidos' };

    const result = await saleRepository.createSale(caller.id, parsed.data);
    revalidatePath('/ventas');
    revalidatePath('/productos');
    revalidatePath('/clientes');

    await recordAuditLog(
      caller.id,
      'CREATE',
      'SALE',
      result.id,
      { total: input.total, itemCount: input.items.length }
    );

    return { 
      success: true, 
      message: 'Venta realizada con éxito', 
      id: result.id 
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al procesar la venta' };
  }
}

/**
 * Delete a sale. Admin ONLY.
 */
export async function deleteSaleAction(id: string) {
  try {
    const caller = await verifyAuthOrAdmin(true);
    await saleRepository.deleteSale(id);
    
    revalidatePath('/ventas');
    revalidatePath('/productos');

    await recordAuditLog(
      caller.id,
      'DELETE',
      'SALE',
      id,
      { note: 'Venta anulada. Stock restablecido.' }
    );

    return { success: true, message: 'Venta anulada y stock restablecido.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al anular la venta' };
  }
}
