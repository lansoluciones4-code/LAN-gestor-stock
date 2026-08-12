CREATE TYPE "public"."business_section" AS ENUM('tech', 'impresiones', 'libreria');--> statement-breakpoint
CREATE TYPE "public"."color_mode" AS ENUM('color', 'blanco_y_negro');--> statement-breakpoint
CREATE TABLE "sale_print_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"pages" integer NOT NULL,
	"color_mode" "color_mode" NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "section" "business_section" DEFAULT 'tech' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "business_section" "business_section" DEFAULT 'tech' NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_print_items" ADD CONSTRAINT "sale_print_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_print_items_sale_id_idx" ON "sale_print_items" USING btree ("sale_id");