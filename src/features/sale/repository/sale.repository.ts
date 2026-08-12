import { desc, eq, sql, and, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sales, saleItems, salePrintItems, products, customers, salePayments } from '@/lib/db/schema';
import type { SaleInput, PrintSaleInput } from '@/features/sale/domain/sale.schema';
import { ConcurrencyError } from '@/lib/errors';
import { roundToDecimals } from '@/lib/utils';

export class SaleRepository {
  async getAllSales() {
    return await db.query.sales.findMany({
      orderBy: [desc(sales.createdAt)],
      with: {
        customer: {
          columns: { id: true, name: true },
        },
        vendor: {
          columns: { id: true, username: true },
        },
        items: {
          with: {
            product: {
              with: {
                device: {
                  columns: { name: true },
                },
              },
            },
          },
        },
        printItems: true,
        payments: true,
      },
    });
  }

  async getSaleById(id: string) {
    return await db.query.sales.findFirst({
      where: eq(sales.id, id),
      with: {
        customer: true,
        vendor: true,
        items: {
          with: {
            product: {
              with: {
                device: true,
              },
            },
          },
        },
        printItems: true,
        payments: true,
      },
    });
  }

  async createSale(vendorId: string, input: SaleInput, dbtx: any = db) {
    // 1. Validate stock AND resolve the authoritative price/cost for every item from the DB.
    // The client-submitted unitPrice/unitCost/subtotal are never trusted for persistence —
    // only the current product record is (prevents a tampered request from recording a sale
    // for less than the real value while stock is still decremented in full).
    const resolvedItems: { productId: string; quantity: number; unitPrice: number; unitCost: number; subtotal: number }[] = [];
    for (const item of input.items) {
      const prod = await dbtx.query.products.findFirst({
        where: eq(products.id, item.productId),
        columns: { stock: true, id: true, salePrice: true, purchasePrice: true },
        with: { device: { columns: { name: true } } },
      });

      if (!prod || prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para: ${prod?.device?.name || 'Producto'}. Disponible: ${prod?.stock || 0}`);
      }

      const unitPrice = parseFloat(prod.salePrice);
      const unitCost = parseFloat(prod.purchasePrice);
      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        unitCost,
        subtotal: roundToDecimals(unitPrice * item.quantity),
      });
    }

    // 2. Recompute the real total from the resolved items + the requested discount, and require
    // the payments to actually cover it. The client's `total` is only used as a floor for the
    // "cuotas con interés" case, where the vendor can legitimately record more than the list price.
    const itemsSubtotal = roundToDecimals(resolvedItems.reduce((acc, i) => acc + i.subtotal, 0));
    const discountAmount = input.discountAmount || 0;
    const discountPercentage = input.discountPercentage || 0;
    const expectedTotal = Math.max(0, roundToDecimals(itemsSubtotal * (1 - discountPercentage / 100) - discountAmount));

    const paymentsSum = roundToDecimals((input.payments || []).reduce((acc, p) => acc + p.amount, 0));
    if (paymentsSum < expectedTotal - 0.01) {
      throw new Error('Los medios de pago no cubren el total real de la venta.');
    }
    const finalTotal = Math.max(expectedTotal, paymentsSum);

    // 3. Create Sale entry
    const [sale] = await dbtx
      .insert(sales)
      .values({
        customerId: input.customerId,
        vendorId,
        businessSection: input.businessSection,
        total: finalTotal.toString(),
        discountAmount: discountAmount.toString(),
        discountPercentage: discountPercentage.toString(),
      })
      .returning();

    // 3.5 Ensure customer is active
    if (input.customerId) {
      await dbtx.update(customers).set({ isActive: true }).where(eq(customers.id, input.customerId));
    }

    // 4. Insert items (with resolved prices) AND update stock
    for (const item of resolvedItems) {
      await dbtx.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        unitCost: item.unitCost.toString(),
        subtotal: item.subtotal.toString(),
      });

      // Atomic Update with Stock Validation
      const updated = await dbtx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          version: sql`${products.version} + 1`,
          updatedAt: sql`NOW()`,
        })
        .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
        .returning();

      if (updated.length === 0) {
        throw new Error('Conflicto de stock: el inventario cambió durante la operación.');
      }
    }

    // 5. Insert payments
    if (input.payments && input.payments.length > 0) {
      for (const p of input.payments) {
        await dbtx.insert(salePayments).values({
          saleId: sale.id,
          type: p.type as any,
          amount: p.amount.toString(),
          installments: p.installments,
        });
      }
    }

    return sale;
  }

  /** Impresiones sale: no stock/product involved, just print lines (pages + color mode + manual price). */
  async createPrintSale(vendorId: string, input: PrintSaleInput, dbtx: any = db) {
    // Recompute each line's subtotal from pages * unitPrice server-side — the per-page price is
    // manually set by the vendor (there's no catalog price to check it against), but the subtotal
    // and total must still be internally consistent and covered by the payments.
    const resolvedItems = input.items.map((item) => ({
      pages: item.pages,
      colorMode: item.colorMode,
      unitPrice: item.unitPrice,
      subtotal: roundToDecimals(item.pages * item.unitPrice),
    }));

    const itemsSubtotal = roundToDecimals(resolvedItems.reduce((acc, i) => acc + i.subtotal, 0));
    const discountAmount = input.discountAmount || 0;
    const discountPercentage = input.discountPercentage || 0;
    const expectedTotal = Math.max(0, roundToDecimals(itemsSubtotal * (1 - discountPercentage / 100) - discountAmount));

    const paymentsSum = roundToDecimals((input.payments || []).reduce((acc, p) => acc + p.amount, 0));
    if (paymentsSum < expectedTotal - 0.01) {
      throw new Error('Los medios de pago no cubren el total real de la venta.');
    }
    const finalTotal = Math.max(expectedTotal, paymentsSum);

    const [sale] = await dbtx
      .insert(sales)
      .values({
        customerId: input.customerId,
        vendorId,
        businessSection: 'impresiones',
        total: finalTotal.toString(),
        discountAmount: discountAmount.toString(),
        discountPercentage: discountPercentage.toString(),
      })
      .returning();

    if (input.customerId) {
      await dbtx.update(customers).set({ isActive: true }).where(eq(customers.id, input.customerId));
    }

    for (const item of resolvedItems) {
      await dbtx.insert(salePrintItems).values({
        saleId: sale.id,
        pages: item.pages,
        colorMode: item.colorMode,
        unitPrice: item.unitPrice.toString(),
        subtotal: item.subtotal.toString(),
      });
    }

    if (input.payments && input.payments.length > 0) {
      for (const p of input.payments) {
        await dbtx.insert(salePayments).values({
          saleId: sale.id,
          type: p.type as any,
          amount: p.amount.toString(),
          installments: p.installments,
        });
      }
    }

    return sale;
  }

  async deleteSale(id: string, dbtx: any = db) {
    // 1. Lock the sale to prevent double-deletion and race conditions
    // Using FOR UPDATE ensures no other transaction can delete or modify this sale concurrently.
    const lockedSale = await dbtx.select({ id: sales.id }).from(sales).where(eq(sales.id, id)).for('update');
    if (lockedSale.length === 0) {
      throw new ConcurrencyError();
    }

    const items = await dbtx.query.saleItems.findMany({
      where: eq(saleItems.saleId, id),
    });

    for (const item of items) {
      await dbtx
        .update(products)
        .set({
          stock: sql`${products.stock} + ${item.quantity}`,
          version: sql`${products.version} + 1`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(products.id, item.productId));
    }

    await dbtx.delete(saleItems).where(eq(saleItems.saleId, id));
    await dbtx.delete(salePrintItems).where(eq(salePrintItems.saleId, id));
    await dbtx.delete(salePayments).where(eq(salePayments.saleId, id));

    // Final delete of the locked sale record
    await dbtx.delete(sales).where(eq(sales.id, id));
  }
}

export const saleRepository = new SaleRepository();
