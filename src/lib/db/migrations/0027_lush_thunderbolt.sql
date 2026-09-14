CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" "business_section" NOT NULL,
	"provider_id" uuid NOT NULL,
	"point_of_sale" varchar(4) NOT NULL,
	"receipt_number" varchar(8) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" timestamp NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_provider_receipt_unique" UNIQUE("provider_id","point_of_sale","receipt_number")
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_provider_id_idx" ON "expenses" USING btree ("provider_id");