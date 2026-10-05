ALTER TABLE "products" ADD COLUMN "out_of_stock_at" timestamp;--> statement-breakpoint
-- Backfill: los productos que ya estaban en 0 toman como fecha estimada su última venta o pérdida
-- (GREATEST ignora NULLs). Sin ninguna de las dos quedan en NULL ("sin fecha").
UPDATE "products" p SET "out_of_stock_at" = GREATEST(
  (SELECT MAX(s."created_at") FROM "sale_items" si JOIN "sales" s ON s."id" = si."sale_id" WHERE si."product_id" = p."id"),
  (SELECT MAX(l."created_at") FROM "product_losses" l WHERE l."product_id" = p."id")
) WHERE p."stock" <= 0;
