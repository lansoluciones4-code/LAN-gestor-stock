'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { customerRepository } from '@/features/customer/repository/customer.repository';
import { customerCreateSchema, customerRowSchema, CustomerInput, type CustomerDef, customerUpdateSchema, type CustomerUpdateInput } from '@/features/customer/domain/customer.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { ConcurrencyError } from '@/lib/errors';

import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchCustomers(): Promise<CustomerDef[]> {
  try {
    await verifyAuthOrAdmin(false); 
    const customersList = await customerRepository.getAllCustomers();
    return z.array(customerRowSchema).parse(customersList);
  } catch (error) {
    console.error('fetchCustomers error:', error);
    return [];
  }
}

export async function toggleCustomerActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const customer = await tx.query.customers.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
      await customerRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'CUSTOMER', id, {
        name: customer?.name ?? 'Desconocido',
        documentNumber: customer?.documentNumber ?? '',
        active: isActive,
        action: isActive ? 'Reactivado' : 'Desactivado',
      }, tx);
      return {
        success: true,
        message: isActive ? MESSAGES.SUCCESS.ACTIVATED('Cliente') : MESSAGES.SUCCESS.DEACTIVATED('Cliente'),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Cliente') };
  }
}

export async function createCustomerAction(input: CustomerInput): Promise<ActionResult<CustomerDef>> {
  try {
    const caller = await verifyAuthOrAdmin(false); // Vendors can create customers
    const parsed = customerCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await customerRepository.createCustomer(parsed.data, tx);
      const wasReactivated = (result as any).wasInactive;

      await recordAuditLog(
        caller.id,
        'CREAR',
        'CUSTOMER',
        result.id,
        {
          name: result.name,
          note: wasReactivated ? 'Cliente reactivado (DNI duplicado)' : 'Nuevo registro',
        },
        tx
      );

      return {
        success: true,
        message: wasReactivated ? MESSAGES.SUCCESS.REACTIVATED('Cliente') : MESSAGES.SUCCESS.CREATED('Cliente'),
        data: result as CustomerDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Cliente') };
  }
}

export async function updateCustomerAction(id: string, input: CustomerUpdateInput): Promise<ActionResult<CustomerDef>> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = customerUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await customerRepository.updateCustomer(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'CUSTOMER', id, {
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        documentNumber: updated.documentNumber,
      }, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Cliente'),
        data: updated as CustomerDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Cliente') };
  }
}

export async function deleteCustomerAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      // Check relations (business logic check before DB constraint to be user friendly)
      const hasRelations = await customerRepository.checkHasRelations(id, tx);
      if (hasRelations) {
        return { success: false, error: MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION };
      }

      const customer = await tx.query.customers.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
      await customerRepository.deleteCustomer(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'CUSTOMER', id, {
        name: customer?.name ?? 'Desconocido',
        phone: customer?.phone ?? '',
        email: customer?.email ?? '',
        documentNumber: customer?.documentNumber ?? '',
        note: 'Eliminación permanente',
      }, tx);
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Cliente') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Cliente') };
  }
}
