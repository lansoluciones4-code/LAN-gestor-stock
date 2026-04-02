import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

async function manualMigrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL not set');

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    console.log('--- Manual Migration ---');
    console.log('Reading migration files...');
    
    const migrationsDir = path.join(process.cwd(), 'src/lib/db/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Sort by name (0000, 0001, ...)

    for (const file of files) {
      console.log(`Running ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);
    }

    console.log('✅ All migrations applied manually.');
    
    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables created:', res.rows.map(r => r.table_name).join(', '));

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

manualMigrate();
