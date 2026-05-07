import 'dotenv/config';
import pg from 'pg';

async function wipeDatabase() {
  const connectionString = process.env.LOCAL_DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: LOCAL_DATABASE_URL no está definida en el .env');
    process.exit(1);
  }

  console.log('⚠️  ATENCIÓN: Se van a ELIMINAR TODAS las tablas de la base de datos LOCAL.');

  console.log('Conectando a:', connectionString.split('@')[1]); // Mostrar solo el host para seguridad

  const client = new pg.Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Conectado.');

    console.log('🔥 Dropping schema public and drizzle...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');

    console.log('✨ Creating schema public...');
    await client.query('CREATE SCHEMA public;');

    console.log('🔑 Granting permissions...');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');

    console.log('✅ Base de datos reseteada con éxito.');
  } catch (err) {
    console.error('❌ Error durante el wipe:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

wipeDatabase();
