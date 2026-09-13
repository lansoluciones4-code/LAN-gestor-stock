'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { counterRepository } from '@/features/counter/repository/counter.repository';
import {
  counterCreateSchema,
  counterUpdateSchema,
  counterDecrementSchema,
  counterRowSchema,
  type CounterInput,
  type CounterUpdateInput,
  type CounterDecrementInput,
  type CounterDef,
} from '@/features/counter/domain/counter.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';
import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

/** Lectura abierta a admin y vendedor: ambos necesitan ver los anotadores (gestión vs. solo descuento). */
export async function fetchCounters(): Promise<CounterDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    const list = await counterRepository.getAllCounters();
    return z.array(counterRowSchema).parse(list);
  } catch (error) {
    console.error('fetchCounters error:', error);
    return [];
  }
}

export async function createCounterAction(input: CounterInput): Promise<ActionResult<CounterDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = counterCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await counterRepository.createCounter(parsed.data, tx);
      await recordAuditLog(caller.id, 'CREAR', 'COUNTER', result.id, { title: result.title, quantity: result.quantity }, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.CREATED('Anotador'),
        data: result as unknown as CounterDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Anotador') };
  }
}

export async function updateCounterAction(id: string, input: CounterUpdateInput): Promise<ActionResult<CounterDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = counterUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await counterRepository.updateCounter(id, parsed.data, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'COUNTER', id, { title: updated.title, quantity: updated.quantity }, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Anotador'),
        data: updated as unknown as CounterDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Anotador') };
  }
}

export async function deleteCounterAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const existing = await tx.query.counters.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
      await counterRepository.deleteCounter(id, tx);
      await recordAuditLog(caller.id, 'ELIMINAR', 'COUNTER', id, { title: existing?.title ?? 'Desconocido' }, tx);
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Anotador') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Anotador') };
  }
}

/** Admin o vendedor: solo puede restar, nunca deja la cantidad en negativo. */
export async function decrementCounterAction(input: CounterDecrementInput): Promise<ActionResult<CounterDef>> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = counterDecrementSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };
    const { id, amount } = parsed.data;

    const current = await db.query.counters.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
    if (!current) return { success: false, error: 'El anotador ya no existe.' };
    if (current.quantity < amount) {
      return { success: false, error: `No hay suficiente cantidad para restar eso (disponible: ${current.quantity}).` };
    }

    return await db.transaction(async (tx) => {
      const updated = await counterRepository.decrementCounter(id, amount, tx);
      await recordAuditLog(caller.id, 'ACTUALIZAR', 'COUNTER', id, { title: updated.title, amountRestado: amount, quantityResultante: updated.quantity }, tx);
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Anotador'),
        data: updated as unknown as CounterDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Anotador') };
  }
}
