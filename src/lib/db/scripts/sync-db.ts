import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env values manually
dotenv.config();

const envTarget = process.argv[2] === 'prod' ? 'prod' : 'local';
const urlPrefix = envTarget === 'prod' ? 'DATABASE_URL' : 'LOCAL_DATABASE_URL';

const dbUrl = process.env[urlPrefix];

if (!dbUrl) {
  console.error(`❌ Error: No se encontró la variable ${urlPrefix} en el archivo .env`);
  process.exit(1);
}

console.log(`\n🚀 Sincronizando base de datos (${envTarget.toUpperCase()})...`);
console.log(`💡 Nota: drizzle-kit push sincroniza tu schema.ts sin depender del historial de archivos sql, evitando errores previos.`);

try {
  // Ejecutar drizzle-kit push inyectando explícitamente el string en lugar de depender del archivo
  execSync(`npx drizzle-kit push`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl }, // Inject and override DATABASE_URL for drizzle-kit
  });
  console.log(`\n✅ Base de datos ${envTarget} sincronizada exitosamente.`);
} catch (error) {
  console.error(`\n❌ Hubo un error al intentar sincronizar la base de datos.`);
  process.exit(1);
}
