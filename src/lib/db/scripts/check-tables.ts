import 'dotenv/config';
import pg from 'pg';

async function checkTables() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    return;
  }

  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Tables found in public schema:');
    res.rows.forEach(row => console.log(`- ${row.table_name}`));
    
    if (res.rows.length === 0) {
      console.log('⚠️ No tables found!');
    }
  } catch (err) {
    console.error('❌ Error checking tables:', err);
  } finally {
    await client.end();
  }
}

checkTables();
