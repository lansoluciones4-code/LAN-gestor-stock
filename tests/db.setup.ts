import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';

setup('reinicio base de datos', async () => {
  console.log('--- Iniciando reinicio de base de datos para tests ---');
  try {
    // Ejecutamos el script de reset de datos de forma síncrona para asegurar que termine antes de seguir
    execSync('npm run db:reset-data-hard', { stdio: 'inherit' });
    console.log('--- Base de datos reiniciada con éxito ---');
  } catch (error) {
    console.error('Error al reiniciar la base de datos:', error);
    throw error;
  }
});
