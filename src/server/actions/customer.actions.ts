'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { customerRepository } from '@/server/repositories/customer.repository';
import { customerSchema, CustomerInput } from '@/schemas/customer.schema';
import { verifyToken } from '@/lib/auth/jwt';

async function verifyAuthOrAdmin(requireAdmin = false) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) throw new Error('No autorizado (Token faltante)');
  
  const user = await verifyToken(token);
  if (requireAdmin && user.role !== 'admin') {
    throw new Error('Solo los administradores pueden realizar esta acción');
  }
  return user;
}

export async function fetchCustomers() {
  try {
    await verifyAuthOrAdmin(false); // Vendors can see customers
    const customers = await customerRepository.getAllCustomers();
    return customers;
  } catch (error) {
    console.error('fetchCustomers error:', error);
    return [];
  }
}

export async function createCustomerAction(input: CustomerInput) {
  try {
    await verifyAuthOrAdmin(false); // Vendors need to create customers
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await customerRepository.createCustomer(parsed.data);
    revalidatePath('/clientes');
    return { success: true, message: 'Cliente registrado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al guardar cliente' };
  }
}

export async function updateCustomerAction(id: string, input: CustomerInput) {
  try {
    await verifyAuthOrAdmin(false); // Vendors might update phone numbers
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: 'Datos inválidos' };

    await customerRepository.updateCustomer(id, parsed.data);
    revalidatePath('/clientes');
    return { success: true, message: 'Cliente actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al actualizar cliente' };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    await verifyAuthOrAdmin(true); // ONLY Admins can delete a customer
    await customerRepository.deleteCustomer(id);
    revalidatePath('/clientes');
    return { success: true, message: 'Cliente eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, message: 'Error al eliminar cliente. Verifica que no tenga ventas asociadas.' };
  }
}
