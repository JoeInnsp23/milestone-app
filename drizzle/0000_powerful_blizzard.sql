CREATE SCHEMA "milestone";
--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('DRAFT', 'SUBMITTED', 'AUTHORISED', 'PAID', 'VOIDED');--> statement-breakpoint
CREATE TYPE "public"."bill_type" AS ENUM('BILL', 'PURCHASEORDER');--> statement-breakpoint
CREATE TYPE "public"."estimate_type" AS ENUM('revenue', 'cost', 'materials');--> statement-breakpoint
CREATE TYPE "public"."export_type" AS ENUM('PDF', 'EXCEL', 'CSV');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'SUBMITTED', 'AUTHORISED', 'PAID', 'VOIDED');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('ACCREC', 'ACCPAY');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "milestone"."audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_action" varchar(20) NOT NULL,
	"entity_id" varchar(255),
	"user_id" varchar(255) NOT NULL,
	"user_email" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestone"."bills" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"xero_bill_id" varchar(50) NOT NULL,
	"bill_number" varchar(50),
	"reference" varchar(255),
	"contact_id" varchar(50),
	"contact_name" varchar(255),
	"project_id" varchar(50),
	"build_phase_id" varchar(50),
	"type" "bill_type",
	"status" "bill_status",
	"sub_total" numeric(12, 2),
	"total_tax" numeric(12, 2),
	"total" numeric(12, 2),
	"amount_paid" numeric(12, 2),
	"amount_due" numeric(12, 2),
	"currency_code" varchar(3),
	"bill_date" date,
	"due_date" date,
	"fully_paid_date" date,
	"line_items" jsonb,
	"payments" jsonb,
	"attachments" jsonb,
	"xero_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "bills_xero_bill_id_unique" UNIQUE("xero_bill_id")
);
--> statement-breakpoint
CREATE TABLE "milestone"."build_phases" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"xero_phase_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"tracking_category_id" varchar(50) NOT NULL,
	"display_order" integer DEFAULT 0,
	"color" varchar(7) DEFAULT '#6366f1',
	"icon" varchar(50),
	"is_active" boolean DEFAULT true,
	"typical_duration_days" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "build_phases_xero_phase_id_unique" UNIQUE("xero_phase_id")
);
--> statement-breakpoint
CREATE TABLE "milestone"."export_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_type" "export_type" NOT NULL,
	"export_scope" varchar(50),
	"filters_applied" jsonb,
	"file_name" varchar(255),
	"file_size_bytes" integer,
	"rows_exported" integer,
	"user_id" varchar(255) NOT NULL,
	"user_email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "milestone"."invoices" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"xero_invoice_id" varchar(50) NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"reference" varchar(255),
	"contact_id" varchar(50),
	"contact_name" varchar(255),
	"project_id" varchar(50),
	"build_phase_id" varchar(50),
	"type" "invoice_type",
	"status" "invoice_status",
	"line_amount_types" varchar(50),
	"sub_total" numeric(12, 2),
	"total_tax" numeric(12, 2),
	"total" numeric(12, 2),
	"amount_paid" numeric(12, 2),
	"amount_due" numeric(12, 2),
	"currency_code" varchar(3),
	"invoice_date" date,
	"due_date" date,
	"fully_paid_date" date,
	"expected_payment_date" date,
	"line_items" jsonb,
	"payments" jsonb,
	"credit_notes" jsonb,
	"attachments" jsonb,
	"xero_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "invoices_xero_invoice_id_unique" UNIQUE("xero_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "milestone"."project_estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar(50) NOT NULL,
	"build_phase_id" varchar(50),
	"estimate_type" "estimate_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP',
	"notes" text,
	"valid_from" date,
	"valid_until" date,
	"created_by" varchar(255) NOT NULL,
	"updated_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1,
	"previous_version_id" uuid
);
--> statement-breakpoint
CREATE TABLE "milestone"."projects" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"xero_project_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"client_name" varchar(255),
	"client_contact_id" varchar(50),
	"tracking_category_id" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"start_date" date,
	"end_date" date,
	"project_manager" varchar(255),
	"is_active" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "projects_xero_project_id_unique" UNIQUE("xero_project_id")
);
--> statement-breakpoint
CREATE TABLE "milestone"."sync_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"status" "sync_status" NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"records_processed" integer DEFAULT 0,
	"records_created" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"error_details" jsonb,
	"triggered_by" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestone"."user_preferences" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"default_view" varchar(50) DEFAULT 'dashboard',
	"theme" varchar(20) DEFAULT 'system',
	"date_format" varchar(20) DEFAULT 'DD/MM/YYYY',
	"currency" varchar(3) DEFAULT 'GBP',
	"notifications" jsonb DEFAULT '{"email":true,"in_app":true}'::jsonb,
	"dashboard_layout" jsonb,
	"saved_filters" jsonb DEFAULT '[]'::jsonb,
	"favorite_projects" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "milestone"."bills" ADD CONSTRAINT "bills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "milestone"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone"."bills" ADD CONSTRAINT "bills_build_phase_id_build_phases_id_fk" FOREIGN KEY ("build_phase_id") REFERENCES "milestone"."build_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone"."invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "milestone"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone"."invoices" ADD CONSTRAINT "invoices_build_phase_id_build_phases_id_fk" FOREIGN KEY ("build_phase_id") REFERENCES "milestone"."build_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone"."project_estimates" ADD CONSTRAINT "project_estimates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "milestone"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone"."project_estimates" ADD CONSTRAINT "project_estimates_build_phase_id_build_phases_id_fk" FOREIGN KEY ("build_phase_id") REFERENCES "milestone"."build_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "milestone"."audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "milestone"."audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_bills_project" ON "milestone"."bills" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_bills_phase" ON "milestone"."bills" USING btree ("build_phase_id");--> statement-breakpoint
CREATE INDEX "idx_bills_date" ON "milestone"."bills" USING btree ("bill_date");--> statement-breakpoint
CREATE INDEX "idx_bills_status" ON "milestone"."bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bills_proj_date" ON "milestone"."bills" USING btree ("project_id","bill_date") WHERE "milestone"."bills"."status" IN ('AUTHORISED', 'PAID');--> statement-breakpoint
CREATE INDEX "idx_export_user" ON "milestone"."export_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_export_created" ON "milestone"."export_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_invoices_project" ON "milestone"."invoices" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_phase" ON "milestone"."invoices" USING btree ("build_phase_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_date" ON "milestone"."invoices" USING btree ("invoice_date");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "milestone"."invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_inv_proj_date" ON "milestone"."invoices" USING btree ("project_id","invoice_date") WHERE "milestone"."invoices"."status" IN ('AUTHORISED', 'PAID');--> statement-breakpoint
CREATE INDEX "idx_estimates_project" ON "milestone"."project_estimates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_estimates_project_phase" ON "milestone"."project_estimates" USING btree ("project_id","build_phase_id");--> statement-breakpoint
CREATE INDEX "idx_projects_active" ON "milestone"."projects" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_projects_client" ON "milestone"."projects" USING btree ("client_name");--> statement-breakpoint
CREATE INDEX "idx_sync_status_type" ON "milestone"."sync_status" USING btree ("sync_type","status");
