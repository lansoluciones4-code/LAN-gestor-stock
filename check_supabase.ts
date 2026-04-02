import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSupabase() {
  const connectionString = "postgresql://postgres.nopdglntoshuecncgvie:phonecenterbb%402026@aws-1-us-east-1.pooler.supabase.com:5432/postgres";
  console.log('Connecting to Supabase...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const db = drizzle(pool);

  try {
    const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('Tables found in Supabase:', result.rows.map(r => r.table_name));
    
    // Check for users table
    if (result.rows.some(r => r.table_name === 'users')) {
        const userCount = await db.execute(sql`SELECT COUNT(*) FROM users`);
        console.log('Users count in Supabase:', userCount.rows[0].count);
    } else {
        console.log('Users table NOT FOUND in Supabase.');
    }
  } catch (err) {
    console.error('Error checking Supabase:', err);
  } finally {
    await pool.end();
  }
  process.exit(0);
}

checkSupabase();
