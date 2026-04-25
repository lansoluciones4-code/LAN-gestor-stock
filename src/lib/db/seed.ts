import { db } from './index';
import { users, providers, devices, products, customers, sales, saleItems, salePayments, auditLogs, productLosses } from './schema';
import * as bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('--- Wiping all tables ---');
  
  // Order matters due to FKs
  await db.delete(auditLogs);
  await db.delete(productLosses);
  await db.delete(salePayments);
  await db.delete(saleItems);
  await db.delete(sales);
  await db.delete(products);
  await db.delete(customers);
  await db.delete(providers);
  await db.delete(devices);
  await db.delete(users);

  console.log('--- Tables wiped ---');

  console.log('--- Seeding admin user ---');
  const adminPassword = await bcrypt.hash('admin', 10);
  const [admin] = await db.insert(users).values({
    username: 'admin',
    passwordHash: adminPassword,
    role: 'admin',
    isActive: true,
  }).returning();
  console.log('Admin user created');

  console.log('--- Seeding random data ---');

  // Providers
  const providerData = [
    { name: 'Distribuidora Global Tech', phone: '11 4444-5555', email: 'ventas@globaltech.com' },
    { name: 'Importadora Sur', phone: '11 2222-3333', email: 'contacto@surimport.com' },
    { name: 'Accesorios Express', phone: '11 9999-8888', email: 'pedidos@accesoriosep.com' },
  ];
  const insertedProviders = await db.insert(providers).values(providerData).returning();

  // Devices (Models)
  const deviceData = [
    { name: 'iPhone 15 Pro Max' },
    { name: 'Samsung S24 Ultra' },
    { name: 'iPad Pro M2' },
    { name: 'AirPods Pro 2' },
    { name: 'Apple Watch Ultra' },
    { name: 'Funda Silicona iPhone' },
    { name: 'Cargador 20W USB-C' },
  ];
  const insertedDevices = await db.insert(devices).values(deviceData).returning();

  // Customers
  const customerData = [
    { name: 'Juan Pérez', documentNumber: '35123456', phone: '11 1234-5678', email: 'juan@perez.com' },
    { name: 'María Garcia', documentNumber: '20-35123456-9', phone: '11 8765-4321', email: 'maria@garcia.com' },
  ];
  const insertedCustomers = await db.insert(customers).values(customerData).returning();

  // Products
  const productsToInsert = [];
  for (let i = 0; i < 15; i++) {
    const dev = insertedDevices[Math.floor(Math.random() * insertedDevices.length)];
    const prov = insertedProviders[Math.floor(Math.random() * insertedProviders.length)];
    const purchase = Math.floor(Math.random() * 500) + 50;
    const sale = purchase * 1.5;
    
    productsToInsert.push({
      deviceId: dev.id,
      providerId: prov.id,
      description: `Lote ${i+1} - ${dev.name}`,
      purchasePrice: purchase.toString(),
      salePrice: sale.toString(),
      stock: Math.floor(Math.random() * 50) + 1,
      showOnLanding: true,
    });
  }
  await db.insert(products).values(productsToInsert);

  console.log('--- Seed complete ---');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
