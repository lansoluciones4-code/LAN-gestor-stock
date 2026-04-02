import 'dotenv/config';
import { devices, products, providers } from '../schema';
import { db } from '..';

async function seedStressTest() {
  console.log('--- TEST DE ESTRÉS: GENERANDO 250 PRODUCTOS ---');

  try {
    // 1. Obtener un equipo y un proveedor aleatorios para asociar
    const [device] = await db.select().from(devices).limit(1);
    const [provider] = await db.select().from(providers).limit(1);

    if (!device || !provider) {
      console.error('Error: Asegúrate de tener al menos un equipo y un proveedor en la DB antes de correr este test.');
      process.exit(1);
    }

    console.log(`Usando Equipo: ${device.name} y Proveedor: ${provider.name}`);

    const colors = ['Negro', 'Blanco', 'Gris Espacial', 'Azul Profundo', 'Oro', 'Plata'];
    const storage = ['64GB', '128GB', '256GB', '512GB', '1TB'];
    const conditions = ['Nuevo', 'Refurbished', 'Exhibición', 'Caja Abierta'];

    const newProducts = [];

    for (let i = 1; i <= 250; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const cap = storage[Math.floor(Math.random() * storage.length)];
      const cond = conditions[Math.floor(Math.random() * conditions.length)];

      const purchasePrice = Math.floor(Math.random() * 500) + 200;
      const salePrice = Math.floor(purchasePrice * 1.3);
      const stock = Math.floor(Math.random() * 50) + 1;

      newProducts.push({
        deviceId: device.id,
        providerId: provider.id,
        description: `${color}, ${cap} (${cond}) - Lote #${i}`,
        purchasePrice: purchasePrice.toString(),
        salePrice: salePrice.toString(),
        stock: stock,
      });
    }

    console.log('Insertando 250 registros en la tabla de productos...');
    await db.insert(products).values(newProducts);

    console.log('--- TEST COMPLETADO CON ÉXITO ---');
    console.log('Ahora puedes entrar al panel de Productos y verificar la fluidez del scroll virtualizado.');

    process.exit(0);
  } catch (error) {
    console.error('Error durante el seed:', error);
    process.exit(1);
  }
}

seedStressTest();
