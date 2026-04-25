import 'dotenv/config';
import pg from 'pg';

async function verifyData() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    return;
  }

  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    
    const tables = [
      'users', 'providers', 'devices', 'customers', 
      'products', 'sales', 'sale_items', 'sale_payments', 
      'product_losses', 'audit_logs'
    ];

    console.log('📊 Database Status Report:');
    console.log('---------------------------');

    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM public."${table}"`);
      const count = res.rows[0].count;
      console.log(`${table.padEnd(15)}: ${count} records`);
    }

    console.log('---------------------------');
    
    // Check for an active admin
    const adminRes = await client.query("SELECT username FROM users WHERE role = 'admin' AND is_active = true LIMIT 1");
    if (adminRes.rows.length > 0) {
      console.log(`✅ Admin found: ${adminRes.rows[0].username}`);
    } else {
      console.log('⚠️ No active admin found!');
    }

    // Check if sales have items
    const salesWithItems = await client.query("SELECT COUNT(DISTINCT sale_id) FROM sale_items");
    console.log(`Sales with items: ${salesWithItems.rows[0].count}`);

  } catch (err) {
    console.error('❌ Error verifying data:', err);
  } finally {
    await client.end();
  }
}

verifyData();
