import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import path from 'path';

async function manualMigrate() {
  const connectionString = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('No se encontró DATABASE_URL o LOCAL_DATABASE_URL en el entorno');

  console.log(`Conectando localmente...`);
  
  // Create a connection for migrations
  const client = new Client({ connectionString });
  await client.connect();
  const db = drizzle(client);

  try {
    console.log('--- Corriendo Migraciones Oficiales de Drizzle ---');
    const migrationsDir = path.join(process.cwd(), 'src/lib/db/migrations');
    
    await migrate(db, { migrationsFolder: migrationsDir });
    
    console.log('✅ Migraciones aplicadas correctamente.');
  } catch (err) {
    console.error('❌ Error al correr las migraciones:', err);
  } finally {
    await client.end();
  }
}

manualMigrate();
