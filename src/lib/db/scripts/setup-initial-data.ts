import * as bcrypt from 'bcrypt';
import { db } from '..';
import { providers, customers, devices, products, sales, saleItems, auditLogs, productLosses, users, salePayments, productImages } from '../schema';

async function setup() {
  console.log('--- Database Reset & Initial Data Setup ---');
  console.log('Cleaning existing data (Audit logs, sales, product images, products, devices, providers, customers)...');

  try {
    // Order matters for deletion due to foreign keys
    await db.delete(auditLogs);
    await db.delete(saleItems);
    await db.delete(salePayments);
    await db.delete(sales);
    await db.delete(productLosses);
    await db.delete(productImages);
    await db.delete(products);
    await db.delete(devices);
    await db.delete(providers);
    await db.delete(customers);
    await db.delete(users);

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
      { name: 'Redmi 12C' },
    ];

    const insertedDevices = await db.insert(devices).values(deviceList).returning();
    console.log(`${deviceList.length} devices created.`);

    console.log('Creating customers...');
    const customerList = [
      {
        name: 'Mostrador',
        phone: '00000000',
        email: 'mail@mail.com',
        documentNumber: '00000000',
      },
      {
        name: 'Juan Pérez',
        phone: '1122334455',
        email: 'juan.perez@example.com',
        documentNumber: '35123456',
      },
      {
        name: 'María García',
        phone: '1199887766',
        email: 'maria.garcia@example.com',
        documentNumber: '40987654',
      },
    ];
    await db.insert(customers).values(customerList);
    console.log(`${customerList.length} customers created.`);

    console.log('Creating default providers...');
    const providerList = [
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
      },
    ];
    const insertedProviders = await db.insert(providers).values(providerList).returning();
    console.log(`${providerList.length} default providers created.`);

    console.log('Creating initial products...');
    // Create some products for the first 5 devices and random providers
    const productList = [];
    for (let i = 0; i < 5; i++) {
      const device = insertedDevices[i];
      const provider = insertedProviders[i % insertedProviders.length];

      productList.push({
        deviceId: device.id,
        providerId: provider.id,
        description: `Equipo ${device.name} - Nuevo en caja`,
        purchasePrice: (Math.random() * 500 + 500).toFixed(2),
        salePrice: (Math.random() * 500 + 1000).toFixed(2),
        stock: Math.floor(Math.random() * 10) + 1,
        showOnLanding: true,
        version: 1,
      });
    }
    await db.insert(products).values(productList);
    console.log(`${productList.length} products created.`);

    console.log('Creating initial users...');
    const adminPasswordHash = await bcrypt.hash('admin', 10);
    await db.insert(users).values({
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });

    const vendorPasswordHash = await bcrypt.hash('vendedor', 10);
    await db.insert(users).values({
      username: 'vendedor',
      passwordHash: vendorPasswordHash,
      role: 'vendedor',
    });
    console.log('Initial users created (admin:admin, vendedor:vendedor).');

    console.log('Initial data setup finished successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
}

setup().catch((err) => {
  console.error('Setup script failed:', err);
  process.exit(1);
});
