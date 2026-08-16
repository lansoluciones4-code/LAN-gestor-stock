CREATE TYPE "public"."print_kind" AS ENUM('fotocopia', 'impresion');--> statement-breakpoint
ALTER TABLE "devices" DROP CONSTRAINT "devices_name_unique";--> statement-breakpoint
ALTER TABLE "sale_print_items" ADD COLUMN "kind" "print_kind" DEFAULT 'impresion' NOT NULL;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_name_brand_unique" UNIQUE("name","brand");