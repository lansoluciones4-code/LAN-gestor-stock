import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    console.log('unaccent extension enabled successfully');
  } catch (error) {
    console.error('Failed to enable unaccent extension:', error);
  }
}

main();
