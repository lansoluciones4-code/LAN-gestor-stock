'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { cardRepository } from '@/features/card/repository/card.repository';
import { cardCreateSchema, cardRowSchema, type CardInput, type CardDef, cardUpdateSchema, type CardUpdateInput } from '@/features/card/domain/card.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { recordAuditLog } from '@/lib/audit-logs';

import { MESSAGES } from '@/config/messages';
import { handleDatabaseError } from '@/lib/db-errors';
import { ActionResult } from '@/lib/action-result';

export async function fetchCards(): Promise<CardDef[]> {
  try {
    // Lectura abierta a vendedores: necesitan ver el catálogo para poder elegir tarjeta al cobrar en Crédito.
    // Las mutaciones (crear/editar/borrar/activar) siguen siendo admin-only, sin cambios.
    await verifyAuthOrAdmin(false);
    const list = await cardRepository.getAllCards();
    return z.array(cardRowSchema).parse(list);
  } catch (error) {
    console.error('fetchCards error:', error);
    return [];
  }
}

export async function toggleCardActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const card = await tx.query.cards.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
      await cardRepository.updateActiveStatus(id, isActive, tx);
      await recordAuditLog(
        caller.id,
        isActive ? 'ACTUALIZAR' : 'ELIMINAR',
        'CARD',
        id,
        {
          name: card?.name ?? 'Desconocido',
          active: isActive,
          action: isActive ? 'Reactivado' : 'Desactivado',
        },
        tx
      );
      return {
        success: true,
        message: isActive ? MESSAGES.SUCCESS.ACTIVATED('Tarjeta') : MESSAGES.SUCCESS.DEACTIVATED('Tarjeta'),
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Tarjeta') };
  }
}

export async function createCardAction(input: CardInput): Promise<ActionResult<CardDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = cardCreateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const result = await cardRepository.createCard(parsed.data, tx);
      const wasReactivated = (result as any).wasInactive;

      await recordAuditLog(
        caller.id,
        'CREAR',
        'CARD',
        result.id,
        {
          name: result.name,
          installments: parsed.data.installments.map((i) => `${i.installments}x +${i.interestPercentage}%`).join(', '),
          note: wasReactivated ? 'Tarjeta reactivada' : 'Nuevo registro',
        },
        tx
      );

      return {
        success: true,
        message: wasReactivated ? MESSAGES.SUCCESS.REACTIVATED('tarjeta') : MESSAGES.SUCCESS.CREATED('Tarjeta'),
        data: result as unknown as CardDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Tarjeta') };
  }
}

export async function updateCardAction(id: string, input: CardUpdateInput): Promise<ActionResult<CardDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = cardUpdateSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: MESSAGES.ERROR.VALIDATION.INVALID_DATA };

    return await db.transaction(async (tx) => {
      const updated = await cardRepository.updateCard(id, parsed.data, tx);
      await recordAuditLog(
        caller.id,
        'ACTUALIZAR',
        'CARD',
        id,
        {
          name: updated.name,
          installments: parsed.data.installments?.map((i) => `${i.installments}x +${i.interestPercentage}%`).join(', '),
        },
        tx
      );
      return {
        success: true,
        message: MESSAGES.SUCCESS.UPDATED('Tarjeta'),
        data: updated as unknown as CardDef,
      };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Tarjeta') };
  }
}

export async function deleteCardAction(id: string): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);

    return await db.transaction(async (tx) => {
      const hasRelations = await cardRepository.checkHasRelations(id, tx);
      if (hasRelations) {
        return { success: false, error: MESSAGES.ERROR.DATABASE.FOREIGN_KEY_VIOLATION };
      }

      const card = await tx.query.cards.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
      await cardRepository.deleteCard(id, tx);
      await recordAuditLog(
        caller.id,
        'ELIMINAR',
        'CARD',
        id,
        {
          name: card?.name ?? 'Desconocido',
          note: 'Eliminación permanente',
        },
        tx
      );
      return { success: true, message: MESSAGES.SUCCESS.DELETED('Tarjeta') };
    });
  } catch (error: any) {
    return { success: false, error: handleDatabaseError(error, 'Tarjeta') };
  }
}
