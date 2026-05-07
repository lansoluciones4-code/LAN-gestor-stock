ALTER TABLE "product_images" DROP CONSTRAINT "product_images_pkey";--> statement-breakpoint
ALTER TABLE "product_images" ADD PRIMARY KEY ("public_id");--> statement-breakpoint
ALTER TABLE "product_images" DROP COLUMN "id";