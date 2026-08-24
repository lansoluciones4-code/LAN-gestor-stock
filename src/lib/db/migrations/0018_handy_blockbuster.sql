ALTER TYPE "public"."print_kind" ADD VALUE 'ciber';--> statement-breakpoint
ALTER TYPE "public"."print_kind" ADD VALUE 'anillado_plastificado';--> statement-breakpoint
ALTER TYPE "public"."print_kind" ADD VALUE 'tramite';--> statement-breakpoint
ALTER TABLE "sale_print_items" ADD COLUMN "title" varchar(150);--> statement-breakpoint
ALTER TABLE "sale_print_items" ADD COLUMN "quantity" numeric(6, 2);