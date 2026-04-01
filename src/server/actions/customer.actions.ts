'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { customerRepository } from '@/server/repositories/customer.repository';
import { customerSchema, customerDefSchema, CustomerInput, type CustomerDef } from '@/schemas/customer.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

export async function fetchCustomers(includeInactive = false): Promise<CustomerDef[]> {
  try {
    await verifyAuthOrAdmin(false); // Vendors can see customers
    const customersList = await customerRepository.getAllCustomers(includeInactive);
    return z.array(customerDefSchema).parse(customersList);
  } catch (error) {
    console.error('fetchCustomers error:', error);
    return [];
  }
}

export async function toggleCustomerActiveAction(id: string, isActive: boolean) {
  try {
    console.log(`[CustomerAction] Iniciando cambio de estado de cliente a ${isActive ? 'activo' : 'inactivo'} (ID: ${id})...`);
    const caller = await verifyAuthOrAdmin(true); // Only admin for status toggle
    await customerRepository.updateActiveStatus(id, isActive);

    await recordAuditLog(
      caller.id,
      isActive ? 'ACTUALIZAR' : 'ELIMINAR',
      'CUSTOMER',
      id,
      { active: isActive }
    );

    return { success: true, message: `Cliente ${isActive ? 'activado' : 'desactivado'} exitosamente` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado del cliente' };
  }
}

export async function createCustomerAction(input: CustomerInput) {
  try {
    console.log(`[CustomerAction] Iniciando registro de nuevo cliente (${input.name})...`);
    const caller = await verifyAuthOrAdmin(false); // Vendors can create customers
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    const newCustomer = await customerRepository.createCustomer(parsed.data);

    await recordAuditLog(
      caller.id,
      'CREAR',
      'CUSTOMER',
      newCustomer.id,
      { name: newCustomer.name }
    );

    return { success: true, message: 'Cliente registrado exitosamente', data: newCustomer };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar cliente' };
  }
}

export async function updateCustomerAction(id: string, input: CustomerInput) {
  try {
    console.log(`[CustomerAction] Iniciando actualización de cliente (ID: ${id})...`);
    const caller = await verifyAuthOrAdmin(false);
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    const updated = await customerRepository.updateCustomer(id, parsed.data);

    await recordAuditLog(
      caller.id,
      'ACTUALIZAR',
      'CUSTOMER',
      id,
      { name: input.name }
    );

    return { success: true, message: 'Cliente actualizado exitosamente', data: updated };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar cliente' };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    console.log(`[CustomerAction] Iniciando eliminación de cliente (ID: ${id})...`);
    const caller = await verifyAuthOrAdmin(true); 

    // Check relations
    const hasRelations = await customerRepository.checkHasRelations(id);
    if (hasRelations) {
      console.log(`[CustomerAction] Eliminación rechazada: el cliente (ID: ${id}) tiene operaciones asociadas.`);
      return { 
        success: false, 
        message: 'No se puede eliminar permanentemente: existe actividad vinculada a este cliente. Prueba desactivarlo.' 
      };
    }

    await customerRepository.deleteCustomer(id);

    await recordAuditLog(
      caller.id,
      'ELIMINAR',
      'CUSTOMER',
      id,
      { note: 'Eliminación permanente' }
    );

    console.log(`[CustomerAction] Cliente (ID: ${id}) eliminado exitosamente.`);
    return { success: true, message: 'Cliente eliminado permanentemente' };
  } catch (error: any) {
    console.error(`[CustomerAction] Error al eliminar cliente:`, error);
    
    // Parse PostgreSQL FK Error just in case
    const errorMsg = error.message?.toLowerCase() || '';
    if (errorMsg.includes('23503') || errorMsg.includes('foreign key constraint') || errorMsg.includes('violates foreign key')) {
      return { success: false, message: 'No se puede eliminar el cliente porque tiene registros vinculados (ej. historial o stock). Por favor, inactívalo.' };
    }
    
    return { success: false, message: 'Error al eliminar cliente de la base de datos.' };
  }
}
