import { desc, eq, sql, and, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sales, saleItems, salePrintItems, saleServiceItems, products, customers, salePayments, technicalServices } from '@/lib/db/schema';
import type { SaleInput } from '@/features/sale/domain/sale.schema';
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
        serviceItems: {
          with: {
            technicalService: {
              columns: { id: true, name: true },
            },
          },
        },
        payments: {
          with: {
            card: {
              columns: { id: true, name: true },
            },
          },
        },
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
        serviceItems: {
          with: {
            technicalService: true,
          },
        },
        payments: {
          with: {
            card: true,
          },
        },
      },
    });
  }

  /**
   * Crea una venta que puede combinar en un mismo registro: productos de stock (Tech/Librería),
   * impresiones y servicios técnicos. Cualquier combinación de los 3 arrays es válida siempre que
   * al menos uno tenga contenido (lo valida `saleCreateSchema`).
   */
  async createSale(vendorId: string, input: SaleInput, dbtx: any = db) {
    // 1. Productos: validar stock y resolver precio/costo real desde la base — nunca confiar en
    // unitPrice/unitCost/subtotal del cliente (evita registrar una venta por menos de lo real
    // mientras el stock se descuenta completo). El descuento por ítem se aplica sobre ese precio real.
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

      const listPrice = parseFloat(prod.salePrice);
      const unitCost = parseFloat(prod.purchasePrice);
      const itemDiscount = Math.min(100, Math.max(0, item.discountPercentage || 0));
      const unitPrice = roundToDecimals(listPrice * (1 - itemDiscount / 100));
      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        unitCost,
        subtotal: roundToDecimals(unitPrice * item.quantity),
      });
    }

    // 2. Impresiones: no hay catálogo de precio — el vendedor carga el modo y el importe total
    // directamente (ya con su descuento por línea aplicado), no hay fórmula que recalcular.
    const resolvedPrintItems = input.printItems.map((item) => ({
      colorMode: item.colorMode,
      kind: item.kind,
      subtotal: roundToDecimals(item.subtotal),
    }));

    // 3. Servicios técnicos: mismo criterio anti-fraude que los productos — el valor real sale del
    // catálogo, nunca del cliente, y el descuento por ítem se aplica sobre ese valor real.
    const resolvedServiceItems: { technicalServiceId: string; quantity: number; unitValue: number; subtotal: number }[] = [];
    for (const item of input.serviceItems) {
      const service = await dbtx.query.technicalServices.findFirst({
        where: eq(technicalServices.id, item.technicalServiceId),
        columns: { value: true },
      });

      if (!service) {
        throw new Error('Uno de los servicios técnicos seleccionados ya no existe.');
      }

      const listValue = parseFloat(service.value);
      const itemDiscount = Math.min(100, Math.max(0, item.discountPercentage || 0));
      const unitValue = roundToDecimals(listValue * (1 - itemDiscount / 100));
      resolvedServiceItems.push({
        technicalServiceId: item.technicalServiceId,
        quantity: item.quantity,
        unitValue,
        subtotal: roundToDecimals(unitValue * item.quantity),
      });
    }

    // 4. Recomputar el total real a partir de los 3 grupos + el descuento de la venta, y exigir que
    // los pagos lo cubran. El `total` del cliente solo sirve de piso para cuotas con interés.
    const itemsSubtotal = roundToDecimals(resolvedItems.reduce((acc, i) => acc + i.subtotal, 0) + resolvedPrintItems.reduce((acc, i) => acc + i.subtotal, 0) + resolvedServiceItems.reduce((acc, i) => acc + i.subtotal, 0));
    const discountAmount = input.discountAmount || 0;
    const discountPercentage = input.discountPercentage || 0;
    const expectedTotal = Math.max(0, roundToDecimals(itemsSubtotal * (1 - discountPercentage / 100) - discountAmount));

    const paymentsSum = roundToDecimals((input.payments || []).reduce((acc, p) => acc + p.amount, 0));
    if (paymentsSum < expectedTotal - 0.01) {
      throw new Error('Los medios de pago no cubren el total real de la venta.');
    }
    const finalTotal = Math.max(expectedTotal, paymentsSum);

    // 5. Crear la venta
    const [sale] = await dbtx
      .insert(sales)
      .values({
        customerId: input.customerId,
        vendorId,
        total: finalTotal.toString(),
        discountAmount: discountAmount.toString(),
        discountPercentage: discountPercentage.toString(),
      })
      .returning();

    if (input.customerId) {
      await dbtx.update(customers).set({ isActive: true }).where(eq(customers.id, input.customerId));
    }

    // 6. Insertar items de producto y descontar stock
    for (const item of resolvedItems) {
      await dbtx.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        unitCost: item.unitCost.toString(),
        subtotal: item.subtotal.toString(),
      });

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

    // 7. Insertar items de impresión
    for (const item of resolvedPrintItems) {
      await dbtx.insert(salePrintItems).values({
        saleId: sale.id,
        colorMode: item.colorMode,
        kind: item.kind,
        subtotal: item.subtotal.toString(),
      });
    }

    // 8. Insertar items de servicio técnico
    for (const item of resolvedServiceItems) {
      await dbtx.insert(saleServiceItems).values({
        saleId: sale.id,
        technicalServiceId: item.technicalServiceId,
        quantity: item.quantity,
        unitValue: item.unitValue.toString(),
        subtotal: item.subtotal.toString(),
      });
    }

    // 9. Insertar pagos
    if (input.payments && input.payments.length > 0) {
      for (const p of input.payments) {
        await dbtx.insert(salePayments).values({
          saleId: sale.id,
          cardId: p.cardId || null,
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
    await dbtx.delete(saleServiceItems).where(eq(saleServiceItems.saleId, id));
    await dbtx.delete(salePayments).where(eq(salePayments.saleId, id));

    // Final delete of the locked sale record
    await dbtx.delete(sales).where(eq(sales.id, id));
  }
}

export const saleRepository = new SaleRepository();
