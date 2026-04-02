import { desc, eq, sql, ilike, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import * as bcrypt from 'bcrypt';
import type { UserInput } from '@/schemas/user.schema';

export class UserRepository {
  /**
   * Retrieves a user from the database by their unique username.
   */
  async getUserByUsername(username: string, dbtx: any = db) {
    return await dbtx.query.users.findFirst({
      where: (users: any, { and }: any) => and(ilike(users.username, username), eq(users.isActive, true)),
      columns: {
        id: true,
        username: true,
        role: true,
        passwordHash: true,
        isActive: true,
      },
    });
  }

  async getAllUsers(includeInactive = false) {
    return await db.query.users.findMany({
      where: includeInactive ? undefined : eq(users.isActive, true),
      columns: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: includeInactive ? [asc(users.isActive), desc(users.createdAt)] : [desc(users.createdAt)],
    });
  }

  async checkHasRelations(id: string, dbtx: any = db) {
    // Check if user has audit logs
    const logsList = await dbtx.query.auditLogs.findMany({
      where: (l: any, { eq }: any) => eq(l.userId, id),
      limit: 1,
    });
    return logsList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean, dbtx: any = db) {
    const result = await dbtx
      .update(users)
      .set({ isActive, updatedAt: sql`NOW()` })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async createUser(input: UserInput, dbtx: any = db) {
    if (!input.password) throw new Error('La contraseña es obligatoria para nuevos usuarios');

    // Case-insensitive duplication check
    const existing = await dbtx.query.users.findFirst({
      where: ilike(users.username, input.username),
    });

    const hashedPassword = await bcrypt.hash(input.password, 10);

    if (existing) {
      if (existing.isActive) {
        throw new Error('El nombre de usuario ya está registrado');
      }

      // Reactivate inactive user
      const result = await dbtx
        .update(users)
        .set({
          username: input.username, // Update to current casing
          passwordHash: hashedPassword,
          role: input.role,
          isActive: true,
          updatedAt: sql`NOW()`,
        })
        .where(eq(users.id, existing.id))
        .returning({
          id: users.id,
          username: users.username,
          role: users.role,
          isReactivated: sql<boolean>`true`,
        });

      return { ...result[0], wasInactive: true };
    }

    const result = await dbtx
      .insert(users)
      .values({
        username: input.username,
        passwordHash: hashedPassword,
        role: input.role,
        isActive: true,
      })
      .returning({
        id: users.id,
        username: users.username,
        role: users.role,
      });

    return result[0];
  }

  async updateUser(id: string, input: UserInput, dbtx: any = db) {
    // Case-insensitive duplication check ignoring self
    const existing = await dbtx.query.users.findFirst({
      where: ilike(users.username, input.username),
    });

    if (existing && existing.id !== id) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    const updateSet: any = {
      username: input.username,
      role: input.role,
      updatedAt: sql`NOW()`,
    };

    if (input.password && input.password.length >= 6) {
      updateSet.passwordHash = await bcrypt.hash(input.password, 10);
    }

    const result = await dbtx.update(users).set(updateSet).where(eq(users.id, id)).returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

    return result[0];
  }

  async deleteUser(id: string, dbtx: any = db) {
    await dbtx.delete(users).where(eq(users.id, id));
  }
}

export const userRepository = new UserRepository();
