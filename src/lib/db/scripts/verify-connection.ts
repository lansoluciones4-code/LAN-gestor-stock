import 'dotenv/config';
import pg from 'pg';

async function verify() {
  const connectionString = process.env.DATABASE_URL;
  const client = new pg.Client({ connectionString });
  console.log('Connecting to:', connectionString?.split('@')[1]);

  await client.connect();
  const res = await client.query('SELECT current_database(), current_user, inet_server_addr(), inet_server_port()');
  console.log('Results:', res.rows[0]);
  await client.end();
}

verify();
