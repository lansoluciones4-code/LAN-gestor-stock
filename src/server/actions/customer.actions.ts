'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
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

export async function createCustomerAction(input: CustomerInput) {
  try {
    const caller = await verifyAuthOrAdmin(false); // Vendors can create customers
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    const newCustomer = await customerRepository.createCustomer(parsed.data);
    revalidatePath('/clientes');

    await recordAuditLog(
      caller.id,
      'CREATE',
      'CUSTOMER',
      newCustomer.id,
      { name: newCustomer.name }
    );

    return { success: true, message: 'Cliente registrado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar cliente' };
  }
}

export async function updateCustomerAction(id: string, input: CustomerInput) {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await customerRepository.updateCustomer(id, parsed.data);
    revalidatePath('/clientes');

    await recordAuditLog(
      caller.id,
      'UPDATE',
      'CUSTOMER',
      id,
      { name: input.name }
    );

    return { success: true, message: 'Cliente actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar cliente' };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    const caller = await verifyAuthOrAdmin(true); 
    await customerRepository.deleteCustomer(id);
    revalidatePath('/clientes');

    await recordAuditLog(
      caller.id,
      'DELETE',
      'CUSTOMER',
      id
    );

    return { success: true, message: 'Cliente eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, message: 'Error al eliminar cliente. Verifica que no tenga ventas asociadas.' };
  }
}
