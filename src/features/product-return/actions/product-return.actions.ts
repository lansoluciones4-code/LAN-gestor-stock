'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { productReturnRepository } from '@/features/product-return/repository/product-return.repository';
import { productRepository } from '@/features/product/repository/product.repository';
import { productReturnCreateSchema, productReturnRowSchema, type ProductReturnInput, type ProductReturnDef } from '@/features/product-return/domain/product-return.schema';
import { verifyAuthForReturns } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchProductReturns(): Promise<ProductReturnDef[]> {
  try {
    await verifyAuthForReturns();
    const returnsList = await productReturnRepository.getAllReturns();
    return z.array(productReturnRowSchema).parse(returnsList);
  } catch (error) {
    console.error('fetchProductReturns error:', error);
    return [];
  }
}

export async function createProductReturnAction(input: ProductReturnInput): Promise<ActionResult<ProductReturnDef>> {
  try {
    const caller = await verifyAuthForReturns();
    const parsed = productReturnCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    const { productId, quantity, reason, amount } = parsed.data;

    return await db.transaction(async (tx) => {
      const product = await productRepository.getProductById(productId);
      const stockBefore = product?.stock ?? 0;

      const created = await productReturnRepository.createReturn(productId, caller.id, quantity, reason, amount, tx);

      await recordAuditLog(caller.id, 'DEVOLUCIÓN', 'PRODUCT', productId, {
        productName: product?.device?.name ?? 'Desconocido',
        description: product?.description ?? '',
        quantity,
        reason,
        amount,
        stockBefore,
        stockAfter: stockBefore + quantity,
      }, tx);

      return {
        success: true,
        message: MESSAGES.SUCCESS.CREATED('Devolución'),
        data: created as unknown as ProductReturnDef,
      };
    });
  } catch (error: any) {
    console.error('Error in createProductReturnAction:', error);
    return { success: false, error: handleDatabaseError(error, 'devolución') };
  }
}
