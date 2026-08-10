import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Conexión de ESCRITURA aparte a Supabase, usada únicamente por el push de
 * "Publicar cambios" (ver publish-stock.actions.ts) para hacer el DELETE+INSERT.
 * Es una pool distinta de ./index.ts (que en el sistema local sirve el Postgres del
 * contenedor Docker, y en el deploy público de Vercel apunta a este mismo Supabase
 * pero solo para lectura, vía DATABASE_URL).
 */
let supabasePool: Pool | null = null;

export function getSupabaseDb() {
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL no está configurado. Agregalo al .env local para poder publicar cambios.');
  }

  if (!supabasePool) {
    supabasePool = new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }

  return drizzle(supabasePool, { schema });
}
