import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import * as bcrypt from 'bcrypt';
import type { UserInput } from '@/schemas/user.schema';

export class UserRepository {
  /**
   * Retrieves a user from the database by their unique username.
   * Leverages Drizzle's relational query API for cleaner execution.
   *
   * @param username - The exact username to look up
   * @returns The user record if found, otherwise undefined
   */
  async getUserByUsername(username: string) {
    return await db.query.users.findFirst({
      where: (users, { eq, and }) => and(eq(users.username, username), eq(users.isActive, true)),
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
      orderBy: [desc(users.createdAt)],
    });
  }

  async checkHasRelations(id: string) {
    // Check if user has audit logs
    const logsList = await db.query.auditLogs.findMany({
      where: (l, { eq }) => eq(l.userId, id),
      limit: 1,
    });
    return logsList.length > 0;
  }

  async updateActiveStatus(id: string, isActive: boolean) {
    const result = await db
      .update(users)
      .set({ isActive, updatedAt: sql`NOW()` })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async createUser(input: UserInput) {
    if (!input.password) throw new Error('La contraseña es obligatoria para nuevos usuarios');

    // Check duplication
    const existing = await db.query.users.findFirst({
      where: eq(users.username, input.username),
    });
    if (existing) throw new Error('El nombre de usuario ya está registrado');

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const result = await db
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

  async updateUser(id: string, input: UserInput) {
    // Check duplication ignoring self
    const existing = await db.query.users.findFirst({
      where: eq(users.username, input.username),
    });
    if (existing && existing.id !== id) throw new Error('El nombre de usuario ya está en uso');

    const updateSet: any = {
      username: input.username,
      role: input.role,
      updatedAt: sql`NOW()`,
    };

    if (input.password && input.password.length >= 6) {
      updateSet.passwordHash = await bcrypt.hash(input.password, 10);
    }

    const result = await db.update(users).set(updateSet).where(eq(users.id, id)).returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

    return result[0];
  }

  async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const userRepository = new UserRepository();
