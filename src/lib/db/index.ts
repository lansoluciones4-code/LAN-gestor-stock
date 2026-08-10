import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';

const isProd = process.env.NODE_ENV === 'production';

// Carga el archivo de entorno correspondiente (no pisa variables ya seteadas, ej. por Docker Compose)
dotenv.config({ path: isProd ? '.env.prod' : '.env.local' });

// En el sistema local (Docker/LAN) esta es la ÚNICA base que se usa, siempre Postgres local.
// En el deploy público de Vercel (recortado, ver scripts/prepare-vercel-build.js) esta misma
// conexión apunta directo a Supabase vía este mismo DATABASE_URL, para leer el catálogo.
// El push de "Publicar cambios" (SUPABASE_DB_URL) usa un pool aparte, ver ./supabase-pool.ts.
const connectionString = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/stock_db';

// Supabase exige TLS; el Postgres local (contenedor Docker) no tiene TLS habilitado.
const requiresSsl = connectionString.includes('supabase.co');

const pool = new Pool({
  connectionString,
  ssl: requiresSsl ? { rejectUnauthorized: false } : false,
  max: isProd ? 10 : undefined, // Increased for better concurrency in production
});

export const db = drizzle(pool, { schema, logger: !isProd });
