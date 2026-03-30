import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NODE_ENV === 'production'
      ? process.env.DATABASE_URL!
      : (process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/stock_db'),
  },
  verbose: true,
  strict: true,
});
