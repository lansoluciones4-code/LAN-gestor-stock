import { desc, eq, sql, ilike, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import * as bcrypt from 'bcrypt';
import type { UserInput, UserUpdateInput } from '@/features/user/domain/user.schema';
import { ConcurrencyError, DuplicateEntityError } from '@/lib/errors';

export class UserRepository {
  async getUserByUsername(username: string, dbtx: any = db) {
    return await dbtx.query.users.findFirst({
      where: (users: any, { and }: any) => and(ilike(users.username, username), eq(users.isActive, true)),
      columns: {
        id: true,
        username: true,
        role: true,
        passwordHash: true,
        isActive: true,
        version: true,
      },
    });
  }

  async getUserById(id: string, dbtx: any = db) {
    return await dbtx.query.users.findFirst({
      where: (u: any, { eq }: any) => eq(u.id, id),
    });
  }

  async getAllUsers() {
    return await db.query.users.findMany({
      columns: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(users.createdAt)],
    });
  }

  async checkHasRelations(id: string, dbtx: any = db) {
    const [performedLog, sale, loss] = await Promise.all([
      dbtx.query.auditLogs.findFirst({ where: (l: any, { eq }: any) => eq(l.userId, id) }),
      dbtx.query.sales.findFirst({ where: (s: any, { eq }: any) => eq(s.vendorId, id) }),
      dbtx.query.productLosses.findFirst({ where: (l: any, { eq }: any) => eq(l.userId, id) })
    ]);
    return !!performedLog || !!sale || !!loss;
  }

  async updateActiveStatus(id: string, isActive: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(users)
      .set({
        isActive,
        updatedAt: sql`NOW()`,
        version: sql`${users.version} + 1`,
      })
      .where(eq(users.id, id))
      .returning();
    if (result.length === 0) throw new ConcurrencyError();
    return result[0];
  }

  async createUser(input: UserInput, dbtx: any = db) {
    // Check for existing (for reactivation logic)
    const existing = await dbtx.query.users.findFirst({
      where: ilike(users.username, input.username),
    });

    const hashedPassword = await bcrypt.hash(input.password!, 10);

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        const result = await dbtx
          .update(users)
          .set({
            username: input.username,
            passwordHash: hashedPassword,
            role: input.role,
            isActive: true,
            updatedAt: sql`NOW()`,
            version: sql`${users.version} + 1`,
          })
          .where(eq(users.id, existing.id))
          .returning();
        return { ...result[0], wasInactive: true };
      } else {
        throw new DuplicateEntityError();
      }
    }

    const result = await dbtx
      .insert(users)
      .values({
        username: input.username,
        passwordHash: hashedPassword,
        role: input.role,
        isActive: true,
        version: 1,
      })
      .returning();

    return result[0];
  }

  async updateUser(id: string, input: UserUpdateInput, dbtx: any = db) {
    const updateSet: any = {
      updatedAt: sql`NOW()`,
      version: sql`${users.version} + 1`,
    };

    if (input.username !== undefined) {
      const existing = await dbtx.query.users.findFirst({
        where: and(ilike(users.username, input.username), sql`${users.id} != ${id}`),
      });
      if (existing) throw new DuplicateEntityError();
      updateSet.username = input.username;
    }
    if (input.role !== undefined) updateSet.role = input.role;

    if (input.password !== undefined && input.password.length >= 6) {
      updateSet.passwordHash = await bcrypt.hash(input.password, 10);
    }

    const result = await dbtx
      .update(users)
      .set(updateSet)
      .where(and(eq(users.id, id), eq(users.version, input.version)))
      .returning();

    if (result.length === 0) {
      throw new ConcurrencyError();
    }

    return result[0];
  }

  async deleteUser(id: string, dbtx: any = db) {
    const result = await dbtx.delete(users).where(eq(users.id, id)).returning();
    if (result.length === 0) throw new ConcurrencyError();
  }
}

export const userRepository = new UserRepository();
