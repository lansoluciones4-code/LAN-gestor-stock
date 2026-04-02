import * as bcrypt from 'bcrypt';
import { users } from '../schema';
import { db } from '..';

async function seed() {
  console.log('Seeding database...');

  // 1. Create Admin User
  const passwordHash = await bcrypt.hash('admin', 10);

  await db
    .insert(users)
    .values({
      username: 'admin',
      passwordHash: passwordHash,
      role: 'admin',
    })
    .onConflictDoUpdate({
      target: users.username,
      set: { passwordHash, role: 'admin' },
    });

  console.log('Admin user created successfully.');
  console.log('Database seeding finished.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
