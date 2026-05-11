/**
 * One-shot backfill script.
 * Sets unit_cost on existing sale_items using the current purchase_price of each product.
 * Run once after the 0004 migration: npm run db:backfill-cost
 */
import { eq, sql } from 'drizzle-orm';
import { db } from '..';
import { saleItems, products } from '../schema';

const ZERO_COST = '0';

async function backfill() {
  console.log('--- Backfill: sale_items.unit_cost ---');

  const itemsToFix = await db
    .select({
      id: saleItems.id,
      productId: saleItems.productId,
    })
    .from(saleItems)
    .where(eq(saleItems.unitCost, ZERO_COST));

  console.log(`Found ${itemsToFix.length} items with unit_cost = 0`);

  if (itemsToFix.length === 0) {
    console.log('Nothing to do. Exiting.');
    process.exit(0);
  }

  let updated = 0;
  let skipped = 0;

  for (const item of itemsToFix) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, item.productId),
      columns: { purchasePrice: true },
    });

    if (!product) {
      console.warn(`  [SKIP] item ${item.id} — product not found`);
      skipped++;
      continue;
    }

    await db
      .update(saleItems)
      .set({ unitCost: product.purchasePrice })
      .where(eq(saleItems.id, item.id));

    updated++;
  }

  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
