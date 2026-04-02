import 'dotenv/config';
import pg from 'pg';

async function listTables() {
  const connectionString = process.env.DATABASE_URL;
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

listTables();
