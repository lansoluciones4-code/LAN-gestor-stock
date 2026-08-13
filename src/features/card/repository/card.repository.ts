import { desc, eq, sql, ilike, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cards, cardInstallments } from '@/lib/db/schema';
import type { CardInput, CardUpdateInput } from '@/features/card/domain/card.schema';
import { ConcurrencyError, DuplicateEntityError } from '@/lib/errors';

export class CardRepository {
  async getAllCards() {
    return await db.query.cards.findMany({
      orderBy: [desc(cards.createdAt)],
      with: { installments: true },
    });
  }

  async checkHasRelations(id: string, dbtx: any = db) {
    const payment = await dbtx.query.salePayments.findFirst({ where: (p: any, { eq }: any) => eq(p.cardId, id) });
    return !!payment;
  }

  private async replaceInstallments(cardId: string, installments: CardInput['installments'], dbtx: any) {
    await dbtx.delete(cardInstallments).where(eq(cardInstallments.cardId, cardId));
    if (installments.length === 0) return;
    await dbtx.insert(cardInstallments).values(
      installments.map((i) => ({
        cardId,
        installments: i.installments,
        interestPercentage: i.interestPercentage.toString(),
      }))
    );
  }

  async createCard(input: CardInput, dbtx: any = db) {
    // Check for existing (for reactivation logic)
    const existing = await dbtx.query.cards.findFirst({
      where: ilike(cards.name, input.name),
    });

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        const result = await dbtx
          .update(cards)
          .set({
            name: input.name,
            isActive: true,
            updatedAt: sql`NOW()`,
            version: sql`${cards.version} + 1`,
          })
          .where(eq(cards.id, existing.id))
          .returning();
        await this.replaceInstallments(existing.id, input.installments, dbtx);
        return { ...result[0], wasInactive: true };
      } else {
        throw new DuplicateEntityError();
      }
    }

    const result = await dbtx
      .insert(cards)
      .values({
        name: input.name,
        isActive: true,
        version: 1,
      })
      .returning();
    await this.replaceInstallments(result[0].id, input.installments, dbtx);
    return result[0];
  }

  async updateActiveStatus(id: string, isActive: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(cards)
      .set({
        isActive,
        updatedAt: sql`NOW()`,
        version: sql`${cards.version} + 1`,
      })
      .where(eq(cards.id, id))
      .returning();
    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async updateCard(id: string, input: CardUpdateInput, dbtx: any = db) {
    const updateData: any = {
      updatedAt: sql`NOW()`,
      version: sql`${cards.version} + 1`,
    };

    if (input.name !== undefined) {
      const existing = await dbtx.query.cards.findFirst({
        where: and(ilike(cards.name, input.name), sql`${cards.id} != ${id}`),
      });
      if (existing) throw new DuplicateEntityError();
      updateData.name = input.name;
    }

    const result = await dbtx
      .update(cards)
      .set(updateData)
      .where(and(eq(cards.id, id), eq(cards.version, input.version)))
      .returning();

    if (result.length === 0) {
      throw new ConcurrencyError();
    }

    if (input.installments !== undefined) {
      await this.replaceInstallments(id, input.installments, dbtx);
    }

    return result[0];
  }

  async deleteCard(id: string, dbtx: any = db) {
    const result = await dbtx.delete(cards).where(eq(cards.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }
}

export const cardRepository = new CardRepository();
