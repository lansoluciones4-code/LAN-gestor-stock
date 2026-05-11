import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';

const isProd = process.env.NODE_ENV === 'production';

// Carga el archivo de entorno correspondiente
dotenv.config({ path: isProd ? '.env.prod' : '.env.local' });

const connectionString = isProd 
  ? process.env.DATABASE_URL! 
  : process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/stock_db';

const pool = new Pool({
  connectionString,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  max: isProd ? 10 : undefined, // Increased for better concurrency in production
});

export const db = drizzle(pool, { schema, logger: !isProd });
