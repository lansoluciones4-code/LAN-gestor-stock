CREATE TABLE "sale_service_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"technical_service_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_value" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sale_service_items" ADD CONSTRAINT "sale_service_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_service_items" ADD CONSTRAINT "sale_service_items_technical_service_id_technical_services_id_fk" FOREIGN KEY ("technical_service_id") REFERENCES "public"."technical_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_service_items_sale_id_idx" ON "sale_service_items" USING btree ("sale_id");--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "business_section";