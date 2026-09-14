CREATE TYPE "public"."equipment_type" AS ENUM('consola', 'pc_escritorio', 'notebook');--> statement-breakpoint
CREATE TABLE "device_intake_photos" (
	"public_id" varchar(255) PRIMARY KEY NOT NULL,
	"device_intake_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_intakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_type" "equipment_type" NOT NULL,
	"customer_id" uuid NOT NULL,
	"received_by_name" varchar(100) NOT NULL,
	"description" varchar(1000) DEFAULT '' NOT NULL,
	"intake_reason" varchar(1000) DEFAULT '' NOT NULL,
	"observations" varchar(1000) DEFAULT '' NOT NULL,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"diagnosis_author_name" varchar(100),
	"diagnosis_detail" varchar(2000),
	"diagnosed_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "device_intake_photos" ADD CONSTRAINT "device_intake_photos_device_intake_id_device_intakes_id_fk" FOREIGN KEY ("device_intake_id") REFERENCES "public"."device_intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_intakes" ADD CONSTRAINT "device_intakes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "device_intake_photos_device_intake_id_idx" ON "device_intake_photos" USING btree ("device_intake_id");--> statement-breakpoint
CREATE INDEX "device_intakes_customer_id_idx" ON "device_intakes" USING btree ("customer_id");