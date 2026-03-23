import { db } from '@/lib/db';

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
      where: (users, { eq }) => eq(users.username, username),
      columns: {
        id: true,
        username: true,
        role: true,
        passwordHash: true,
      },
    });
  }
}

export const userRepository = new UserRepository();
