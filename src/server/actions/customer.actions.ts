'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { customerRepository } from '@/server/repositories/customer.repository';
import { customerSchema, customerDefSchema, CustomerInput, type CustomerDef } from '@/schemas/customer.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

export async function fetchCustomers(): Promise<CustomerDef[]> {
  try {
    await verifyAuthOrAdmin(false); // Vendors can see customers
    const customersList = await customerRepository.getAllCustomers();
    return z.array(customerDefSchema).parse(customersList);
  } catch (error) {
    console.error('fetchCustomers error:', error);
    return [];
  }
}

export async function toggleCustomerActiveAction(id: string, isActive: boolean) {
  try {
    const caller = await verifyAuthOrAdmin(true); // Only admin for status toggle
    
    return await db.transaction(async (tx) => {
      await customerRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(caller.id, isActive ? 'ACTUALIZAR' : 'ELIMINAR', 'CUSTOMER', id, { active: isActive }, tx);
      return { success: true, message: `Cliente ${isActive ? 'activado' : 'desactivado'} exitosamente` };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado del cliente' };
  }
}

export async function createCustomerAction(input: CustomerInput): Promise<{ success: true; message: string; data: CustomerDef } | { success: false; message: string }> {
  try {
    const caller = await verifyAuthOrAdmin(false); // Vendors can create customers
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    return await db.transaction(async (tx) => {
      const result = await customerRepository.createCustomer(parsed.data, tx);
      const wasInactive = (result as any).wasInactive;

      await recordAuditLog(caller.id, 'CREAR', 'CUSTOMER', result.id, { 
        name: result.name,
        note: wasInactive ? 'Cliente reactivado (DNI duplicado)' : 'Nuevo registro'
      }, tx);

      return { 
        success: true, 
        message: wasInactive ? 'El cliente ya existía (inactivo) y ha sido reactivado con los nuevos datos' : 'Cliente registrado exitosamente', 
        data: result as CustomerDef 
      };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar cliente' };
  }
}

export async function updateCustomerAction(id: string, input: CustomerInput): Promise<{ success: true; message: string; data: CustomerDef } | { success: false; message: string }> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    return await db.transaction(async (tx) => {
      const updated = await customerRepository.updateCustomer(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'CUSTOMER', id, { name: input.name }, tx);
      return { success: true, message: 'Cliente actualizado exitosamente', data: updated as CustomerDef };
    });
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar cliente' };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      // Check relations
      const hasRelations = await customerRepository.checkHasRelations(id, tx);
      if (hasRelations) {
        throw new Error('No se puede eliminar permanentemente: existe actividad vinculada a este cliente. Prueba desactivarlo.');
      }

      await customerRepository.deleteCustomer(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'CUSTOMER', id, { note: 'Eliminación permanente' }, tx);
      return { success: true, message: 'Cliente eliminado permanentemente' };
    });
  } catch (error: any) {
    console.error('[CustomerAction] Error al eliminar cliente:', error);

    // Parse PostgreSQL FK Error
    const errorMsg = error.message?.toLowerCase() || '';
    if (errorMsg.includes('23503') || errorMsg.includes('foreign key constraint') || errorMsg.includes('violates foreign key')) {
      return { success: false, message: 'No se puede eliminar el cliente porque tiene registros vinculados. Por favor, inactívalo.' };
    }

    return { success: false, message: error.message || 'Error al eliminar cliente de la base de datos.' };
  }
}
