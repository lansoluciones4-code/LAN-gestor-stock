import { execSync } from 'child_process';

console.log('🚀 Starting Full Database Reset...');

try {
  console.log('Step 1: Wiping database...');
  execSync('npx tsx src/lib/db/scripts/wipe-db.ts', { stdio: 'inherit' });

  console.log('Step 2: Generating migrations (drizzle-kit)...');
  execSync('npm run db:generate', { stdio: 'inherit' });

  console.log('Step 3: Applying migrations (drizzle-kit)...');
  execSync('npm run db:migrate', { stdio: 'inherit' });

  console.log('Step 4: Seeding initial data (setup-initial-data.ts)...');
  execSync('npx tsx src/lib/db/scripts/setup-initial-data.ts', { stdio: 'inherit' });

  console.log('✅ Full Database Reset completed successfully!');
} catch (error) {
  console.error('❌ Error during database reset:', error);
  process.exit(1);
}
