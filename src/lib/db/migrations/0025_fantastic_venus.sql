CREATE TYPE "public"."spare_part_condition" AS ENUM('usado', 'nuevo');--> statement-breakpoint
CREATE TABLE "sale_spare_part_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"spare_part_id" uuid NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"profit_amount" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	CONSTRAINT "sale_spare_part_items_spare_part_id_unique" UNIQUE("spare_part_id")
);
--> statement-breakpoint
CREATE TABLE "spare_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(150) NOT NULL,
	"condition" "spare_part_condition" NOT NULL,
	"customer_id" uuid NOT NULL,
	"cost" numeric(10, 2) NOT NULL,
	"profit_percentage" numeric(5, 2) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sale_spare_part_items" ADD CONSTRAINT "sale_spare_part_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_spare_part_items" ADD CONSTRAINT "sale_spare_part_items_spare_part_id_spare_parts_id_fk" FOREIGN KEY ("spare_part_id") REFERENCES "public"."spare_parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_spare_part_items_sale_id_idx" ON "sale_spare_part_items" USING btree ("sale_id");