ALTER TABLE "customers" ALTER COLUMN "phone" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "email" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "document_number" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "document_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "phone" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "email" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_name_unique" UNIQUE("name");