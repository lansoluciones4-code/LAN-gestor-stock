import * as bcrypt from 'bcrypt';
import { db } from './index';
import { users, providers, customers, devices } from './schema';

async function seed() {
  console.log('Seeding database...');

  // 1. Create Admin User
  const passwordHash = await bcrypt.hash('admin', 10);
  
  const [adminUser] = await db.insert(users).values({
    username: 'admin',
    passwordHash: passwordHash,
    role: 'admin',
  }).returning();
  
  console.log('Admin user created successfully.');

  // 2. Create Vendor User
  const vendorHash = await bcrypt.hash('vendor123', 10);
  await db.insert(users).values({
    username: 'vendedor',
    passwordHash: vendorHash,
    role: 'vendedor',
  });
  console.log('Vendor user created successfully.');

  // 3. Create initial devices
  const [device1] = await db.insert(devices).values({ name: 'iPhone 15 Pro' }).returning();
  const [device2] = await db.insert(devices).values({ name: 'Samsung Galaxy S24' }).returning();
  const [device3] = await db.insert(devices).values({ name: 'Xiaomi 14 Ultra' }).returning();
  console.log('Devices created.');

  // 4. Create initial providers
  const [provider1] = await db.insert(providers).values({
    name: 'Wholesale Tech Inc.',
    phone: '+1 800-555-0199',
    email: 'contact@wholesaletech.com',
  }).returning();
  
  await db.insert(providers).values({
    name: 'Mayorista Mobile S.A.',
    phone: '+54 11-4444-5555',
    email: 'info@mayoristamobile.com.ar',
  });
  console.log('Providers created.');

  // 5. Create initial customers
  await db.insert(customers).values({
    name: 'Consumidor Final',
    phone: '',
    email: '',
    documentNumber: '00000000',
  });
  
  await db.insert(customers).values({
    name: 'Juan Perez',
    phone: '261-444-5555',
    email: 'juanperez@example.com',
    documentNumber: '25444555',
  });
  console.log('Customers created.');

  console.log('Database seeding finished.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
