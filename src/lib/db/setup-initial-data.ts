import { db } from './index';
import { providers, customers, devices, products, sales, saleItems, auditLogs } from './schema';

async function setup() {
  console.log('--- Database Reset & Initial Data Setup ---');
  console.log('Cleaning existing data (Audit logs, sales, products, devices, providers, customers)...');
  
  try {
    // Order matters for deletion due to foreign keys
    await db.delete(auditLogs);
    await db.delete(saleItems);
    await db.delete(sales);
    await db.delete(products);
    await db.delete(devices);
    await db.delete(providers);
    await db.delete(customers);
    
    console.log('Database cleaned.');

    console.log('Creating comprehensive device lines...');
    const deviceList = [
      // Apple
      { name: 'iPhone 13' },
      { name: 'iPhone 14' },
      { name: 'iPhone 14 Pro' },
      { name: 'iPhone 14 Pro Max' },
      { name: 'iPhone 15' },
      { name: 'iPhone 15 Pro' },
      { name: 'iPhone 15 Pro Max' },
      
      // Samsung
      { name: 'Samsung Galaxy S23' },
      { name: 'Samsung Galaxy S23 Ultra' },
      { name: 'Samsung Galaxy S24' },
      { name: 'Samsung Galaxy S24 Ultra' },
      { name: 'Samsung Galaxy A54' },
      { name: 'Samsung Galaxy A34' },
      
      // Xiaomi / Redmi
      { name: 'Xiaomi 13 Ultra' },
      { name: 'Xiaomi 14' },
      { name: 'Redmi Note 12' },
      { name: 'Redmi Note 12 Pro' },
      { name: 'Redmi Note 13' },
      { name: 'Redmi Note 13 Pro' },
      { name: 'Redmi 12C' }
    ];
    
    await db.insert(devices).values(deviceList);
    console.log(`${deviceList.length} devices created.`);

    console.log('Creating "Mostrador" customer...');
    await db.insert(customers).values({
      name: 'Mostrador',
      phone: '00000000',
      documentNumber: '00000000',
    });
    console.log('Customer "Mostrador" created.');

    console.log('Creating default providers...');
    await db.insert(providers).values([
      {
        name: 'TechWorld Distribuidora',
        phone: '1144556677',
        email: 'ventas@techworld.com',
      },
      {
        name: 'Global Mobile Solutions',
        phone: '1122334455',
        email: 'info@globalmobile.com',
      },
      {
        name: 'Importaciones Premium',
        phone: '1199887766',
        email: 'contacto@importpremium.com',
      }
    ]);
    console.log('3 default providers created.');

    console.log('Initial data setup finished successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
}

setup().catch(err => {
  console.error('Setup script failed:', err);
  process.exit(1);
});
