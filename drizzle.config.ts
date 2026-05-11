import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

const isProd = process.env.NODE_ENV === 'production';
dotenv.config({ path: isProd ? '.env.prod' : '.env.local' });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: isProd
      ? process.env.DATABASE_URL!
      : process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});

