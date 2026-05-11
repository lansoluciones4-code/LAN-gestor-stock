import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
if (!process.env.DATABASE_URL && !process.env.LOCAL_DATABASE_URL) {
  dotenv.config({ path: '.env.local' });
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
