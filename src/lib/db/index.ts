import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/stock_db';

const isProd = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  max: isProd ? 10 : undefined, // Increased for better concurrency in production
});

export const db = drizzle(pool, { schema, logger: !isProd });
