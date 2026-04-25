ALTER TABLE "products" DROP CONSTRAINT "products_customer_id_customers_id_fk";
--> statement-breakpoint
DROP INDEX "customer_id_idx";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "customer_id";