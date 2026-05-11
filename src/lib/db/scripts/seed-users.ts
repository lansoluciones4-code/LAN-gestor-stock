import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { db } from '..';
import { users } from '../schema';
import { eq } from 'drizzle-orm';

const SEED_USERS = [
  { username: 'admin', password: 'admin', role: 'admin' as const },
  { username: 'vendedor', password: 'vendedor', role: 'vendedor' as const },
];

async function seedUsers(): Promise<void> {
  console.log('--- Seeding users ---');

  try {
    for (const { username, password, role } of SEED_USERS) {
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Check if user exists
      const [existing] = await db.select().from(users).where(eq(users.username, username));
      
      if (existing) {
        await db.update(users)
          .set({ passwordHash, role, updatedAt: new Date() })
          .where(eq(users.username, username));
        console.log(`Updated user: ${username} (${role})`);
      } else {
        await db.insert(users).values({ username, passwordHash, role });
        console.log(`Created user: ${username} (${role})`);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
