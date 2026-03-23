import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export class UserRepository {
  /**
   * Retrieves a user from the database by their unique username.
   *
   * @param username - The exact username to look up
   * @returns The user record if found, otherwise undefined
   */
  async getUserByUsername(username: string) {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return result[0];
  }
}

export const userRepository = new UserRepository();
