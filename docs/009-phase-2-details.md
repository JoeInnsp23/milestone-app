# Phase 2: Database Setup

## Overview
This phase connects the application to PostgreSQL and implements the complete database schema with Drizzle ORM. We'll set up all tables, indexes, materialized views, and production improvements including role-based security and auto-update triggers.

## Prerequisites
- Phase 1 completed successfully
- PostgreSQL 15 installed and running
- Database access credentials
- n8n already configured to write to the same PostgreSQL instance

## Step 1: Install Database Dependencies

### 1.1 Install Required Packages

```bash
npm install drizzle-orm postgres dotenv
npm install --save-dev drizzle-kit @types/pg
```

### 1.2 Install Additional Dependencies for Production Features

```bash
npm install zod
```

## Step 2: Configure Environment Variables

### 2.1 Update .env.local

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/milestone"

# Optional: Separate connection for migrations
DATABASE_MIGRATION_URL="postgresql://postgres:password@localhost:5432/milestone"

# Clerk (will be configured in Phase 3)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Step 3: Create Drizzle Configuration

### 3.1 Create drizzle.config.ts

Create `drizzle.config.ts` in the root directory:

```typescript
import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
```

## Step 4: Create Database Schema

### 4.1 Create Complete Schema Definition

Create `src/db/schema.ts`:

```typescript
import {
  pgTable,
  pgSchema,
  varchar,
  timestamp,
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  uuid,
  text,
  index,
  uniqueIndex,
  primaryKey,
  pgEnum,
  check,
  inet,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Create milestone schema
export const milestoneSchema = pgSchema('milestone')

// Enums
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'DRAFT',
  'SUBMITTED',
  'AUTHORISED',
  'PAID',
  'VOIDED',
])

export const billStatusEnum = pgEnum('bill_status', [
  'DRAFT',
  'SUBMITTED',
  'AUTHORISED',
  'PAID',
  'VOIDED',
])

export const invoiceTypeEnum = pgEnum('invoice_type', ['ACCREC', 'ACCPAY'])
export const billTypeEnum = pgEnum('bill_type', ['BILL', 'PURCHASEORDER'])

export const estimateTypeEnum = pgEnum('estimate_type', [
  'revenue',
  'cost',
  'materials',
])

export const auditActionEnum = pgEnum('audit_action', [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'EXPORT',
])

export const exportTypeEnum = pgEnum('export_type', ['PDF', 'EXCEL', 'CSV'])
export const syncStatusEnum = pgEnum('sync_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
])

// Projects table (from Xero tracking category) - uses Xero IDs
export const projects = milestoneSchema.table(
  'projects',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // Xero project ID
    xero_project_id: varchar('xero_project_id', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    client_name: varchar('client_name', { length: 255 }),
    client_contact_id: varchar('client_contact_id', { length: 50 }),
    tracking_category_id: varchar('tracking_category_id', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).default('active'),
    start_date: date('start_date'),
    end_date: date('end_date'),
    project_manager: varchar('project_manager', { length: 255 }),
    is_active: boolean('is_active').default(true),
    metadata: jsonb('metadata').default({}),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    last_synced_at: timestamp('last_synced_at', { withTimezone: true }),
  },
  (table) => ({
    idx_projects_active: index('idx_projects_active').on(table.is_active),
    idx_projects_client: index('idx_projects_client').on(table.client_name),
  })
)

// Build phases table (from Xero tracking category) - uses Xero IDs
export const buildPhases = milestoneSchema.table('build_phases', {
  id: varchar('id', { length: 50 }).primaryKey(), // Xero phase ID
  xero_phase_id: varchar('xero_phase_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  tracking_category_id: varchar('tracking_category_id', { length: 50 }).notNull(),
  display_order: integer('display_order').default(0),
  color: varchar('color', { length: 7 }).default('#6366f1'),
  icon: varchar('icon', { length: 50 }),
  is_active: boolean('is_active').default(true),
  typical_duration_days: integer('typical_duration_days'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Project estimates table (user-entered) - uses UUID for user-generated content
export const projectEstimates = milestoneSchema.table(
  'project_estimates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: varchar('project_id', { length: 50 })
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    build_phase_id: varchar('build_phase_id', { length: 50 }).references(
      () => buildPhases.id
    ),
    estimate_type: estimateTypeEnum('estimate_type').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('GBP'),
    notes: text('notes'),
    valid_from: date('valid_from'),
    valid_until: date('valid_until'),
    created_by: varchar('created_by', { length: 255 }).notNull(),
    updated_by: varchar('updated_by', { length: 255 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    version: integer('version').default(1),
    previous_version_id: uuid('previous_version_id'),
  },
  (table) => ({
    idx_estimates_project: index('idx_estimates_project').on(table.project_id),
    idx_estimates_project_phase: index('idx_estimates_project_phase').on(table.project_id, table.build_phase_id),
    // Partial unique index for current estimates only (where valid_until IS NULL)
    ux_estimates_current: uniqueIndex('ux_estimates_current')
      .on(table.project_id, table.estimate_type)
      .where(sql`${table.valid_until} IS NULL`),
  })
)

// Invoices table (from Xero)
export const invoices = milestoneSchema.table(
  'invoices',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    xero_invoice_id: varchar('xero_invoice_id', { length: 50 }).notNull().unique(),
    invoice_number: varchar('invoice_number', { length: 50 }).notNull(),
    reference: varchar('reference', { length: 255 }),
    contact_id: varchar('contact_id', { length: 50 }),
    contact_name: varchar('contact_name', { length: 255 }),
    project_id: varchar('project_id', { length: 50 }).references(() => projects.id),
    build_phase_id: varchar('build_phase_id', { length: 50 }).references(
      () => buildPhases.id
    ),
    type: invoiceTypeEnum('type'),
    status: invoiceStatusEnum('status'),
    line_amount_types: varchar('line_amount_types', { length: 50 }),
    sub_total: decimal('sub_total', { precision: 12, scale: 2 }),
    total_tax: decimal('total_tax', { precision: 12, scale: 2 }),
    total: decimal('total', { precision: 12, scale: 2 }),
    amount_paid: decimal('amount_paid', { precision: 12, scale: 2 }),
    amount_due: decimal('amount_due', { precision: 12, scale: 2 }),
    currency_code: varchar('currency_code', { length: 3 }),
    invoice_date: date('invoice_date'),
    due_date: date('due_date'),
    fully_paid_date: date('fully_paid_date'),
    expected_payment_date: date('expected_payment_date'),
    line_items: jsonb('line_items'),
    payments: jsonb('payments'),
    credit_notes: jsonb('credit_notes'),
    attachments: jsonb('attachments'),
    xero_data: jsonb('xero_data'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    last_synced_at: timestamp('last_synced_at', { withTimezone: true }),
  },
  (table) => ({
    idx_invoices_project: index('idx_invoices_project').on(table.project_id),
    idx_invoices_phase: index('idx_invoices_phase').on(table.build_phase_id),
    idx_invoices_date: index('idx_invoices_date').on(table.invoice_date),
    idx_invoices_status: index('idx_invoices_status').on(table.status),
    // Performance index for hot paths
    idx_inv_proj_date: index('idx_inv_proj_date')
      .on(table.project_id, table.invoice_date)
      .where(sql`${table.status} IN ('AUTHORISED', 'PAID')`),
  })
)

// Bills table (from Xero)
export const bills = milestoneSchema.table(
  'bills',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    xero_bill_id: varchar('xero_bill_id', { length: 50 }).notNull().unique(),
    bill_number: varchar('bill_number', { length: 50 }),
    reference: varchar('reference', { length: 255 }),
    contact_id: varchar('contact_id', { length: 50 }),
    contact_name: varchar('contact_name', { length: 255 }),
    project_id: varchar('project_id', { length: 50 }).references(() => projects.id),
    build_phase_id: varchar('build_phase_id', { length: 50 }).references(
      () => buildPhases.id
    ),
    type: billTypeEnum('type'),
    status: billStatusEnum('status'),
    sub_total: decimal('sub_total', { precision: 12, scale: 2 }),
    total_tax: decimal('total_tax', { precision: 12, scale: 2 }),
    total: decimal('total', { precision: 12, scale: 2 }),
    amount_paid: decimal('amount_paid', { precision: 12, scale: 2 }),
    amount_due: decimal('amount_due', { precision: 12, scale: 2 }),
    currency_code: varchar('currency_code', { length: 3 }),
    bill_date: date('bill_date'),
    due_date: date('due_date'),
    fully_paid_date: date('fully_paid_date'),
    line_items: jsonb('line_items'),
    payments: jsonb('payments'),
    attachments: jsonb('attachments'),
    xero_data: jsonb('xero_data'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    last_synced_at: timestamp('last_synced_at', { withTimezone: true }),
  },
  (table) => ({
    idx_bills_project: index('idx_bills_project').on(table.project_id),
    idx_bills_phase: index('idx_bills_phase').on(table.build_phase_id),
    idx_bills_date: index('idx_bills_date').on(table.bill_date),
    idx_bills_status: index('idx_bills_status').on(table.status),
    // Performance index for hot paths
    idx_bills_proj_date: index('idx_bills_proj_date')
      .on(table.project_id, table.bill_date)
      .where(sql`${table.status} IN ('AUTHORISED', 'PAID')`),
  })
)

// Audit logs table (minimal - only logins, estimates, exports)
export const auditLogs = milestoneSchema.table(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    event_type: varchar('event_type', { length: 50 }).notNull(), // 'login', 'estimate_change', 'export'
    event_action: varchar('event_action', { length: 20 }).notNull(), // 'create', 'update', 'delete', 'export'
    entity_id: varchar('entity_id', { length: 255 }), // estimate_id or export_id
    user_id: varchar('user_id', { length: 255 }).notNull(),
    user_email: varchar('user_email', { length: 255 }),
    metadata: jsonb('metadata'), // simple metadata, not full old/new values
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    idx_audit_user: index('idx_audit_user').on(table.user_id),
    idx_audit_created: index('idx_audit_created').on(table.created_at),
  })
)

// User preferences table
export const userPreferences = milestoneSchema.table('user_preferences', {
  user_id: varchar('user_id', { length: 255 }).primaryKey(),
  default_view: varchar('default_view', { length: 50 }).default('dashboard'),
  theme: varchar('theme', { length: 20 }).default('system'),
  date_format: varchar('date_format', { length: 20 }).default('DD/MM/YYYY'),
  currency: varchar('currency', { length: 3 }).default('GBP'),
  notifications: jsonb('notifications').default({ email: true, in_app: true }),
  dashboard_layout: jsonb('dashboard_layout'),
  saved_filters: jsonb('saved_filters').default([]),
  favorite_projects: text('favorite_projects').array(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Export history table
export const exportHistory = milestoneSchema.table(
  'export_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    export_type: exportTypeEnum('export_type').notNull(),
    export_scope: varchar('export_scope', { length: 50 }),
    filters_applied: jsonb('filters_applied'),
    file_name: varchar('file_name', { length: 255 }),
    file_size_bytes: integer('file_size_bytes'),
    rows_exported: integer('rows_exported'),
    user_id: varchar('user_id', { length: 255 }).notNull(),
    user_email: varchar('user_email', { length: 255 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    error_message: text('error_message'),
  },
  (table) => ({
    idx_export_user: index('idx_export_user').on(table.user_id),
    idx_export_created: index('idx_export_created').on(table.created_at),
  })
)

// Sync status table
export const syncStatus = milestoneSchema.table(
  'sync_status',
  {
    id: serial('id').primaryKey(),
    sync_type: varchar('sync_type', { length: 50 }).notNull(),
    status: syncStatusEnum('status').notNull(),
    started_at: timestamp('started_at', { withTimezone: true }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    records_processed: integer('records_processed').default(0),
    records_created: integer('records_created').default(0),
    records_updated: integer('records_updated').default(0),
    records_failed: integer('records_failed').default(0),
    error_details: jsonb('error_details'),
    triggered_by: varchar('triggered_by', { length: 50 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    idx_sync_status_type: index('idx_sync_status_type').on(
      table.sync_type,
      table.status
    ),
  })
)
```

## Step 5: Create Database Connection

### 5.1 Create Database Client

Create `src/lib/db.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

// For query purposes
const queryClient = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Create drizzle instance
export const db = drizzle(queryClient, { schema })

// Export schema for use in other files
export * from '@/db/schema'
```

## Step 6: Create Production SQL Scripts

### 6.1 Create Production Improvements SQL

Create `drizzle/production-improvements.sql`:

```sql
-- Auto-update trigger for updated_at columns
CREATE OR REPLACE FUNCTION milestone.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'milestone'
    AND column_name = 'updated_at'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_touch_%I ON milestone.%I;
      CREATE TRIGGER trg_touch_%I
      BEFORE UPDATE ON milestone.%I
      FOR EACH ROW
      EXECUTE FUNCTION milestone.touch_updated_at();
    ', r.table_name, r.table_name, r.table_name, r.table_name);
  END LOOP;
END $$;

-- Create materialized view for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS milestone.project_phase_summary AS
WITH invoice_summary AS (
    SELECT
        project_id,
        build_phase_id,
        SUM(CASE WHEN type = 'ACCREC' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'ACCREC' THEN amount_paid ELSE 0 END) as revenue_paid,
        COUNT(CASE WHEN type = 'ACCREC' THEN 1 END) as invoice_count
    FROM milestone.invoices
    WHERE status IN ('AUTHORISED', 'PAID')
    GROUP BY project_id, build_phase_id
),
bill_summary AS (
    SELECT
        project_id,
        build_phase_id,
        SUM(total) as costs,
        SUM(amount_paid) as costs_paid,
        COUNT(*) as bill_count
    FROM milestone.bills
    WHERE status IN ('AUTHORISED', 'PAID')
    GROUP BY project_id, build_phase_id
),
estimate_summary AS (
    SELECT
        project_id,
        build_phase_id,
        SUM(CASE WHEN estimate_type = 'revenue' THEN amount ELSE 0 END) as estimated_revenue,
        SUM(CASE WHEN estimate_type = 'cost' THEN amount ELSE 0 END) as estimated_cost
    FROM milestone.project_estimates
    WHERE valid_until IS NULL OR valid_until > CURRENT_DATE
    GROUP BY project_id, build_phase_id
)
SELECT
    p.id as project_id,
    p.name as project_name,
    p.client_name,
    p.status as project_status,
    bp.id as phase_id,
    bp.name as phase_name,
    bp.display_order as phase_order,
    bp.color as phase_color,
    COALESCE(i.revenue, 0) as actual_revenue,
    COALESCE(i.revenue_paid, 0) as revenue_paid,
    COALESCE(b.costs, 0) as actual_costs,
    COALESCE(b.costs_paid, 0) as costs_paid,
    COALESCE(i.revenue, 0) - COALESCE(b.costs, 0) as profit,
    CASE
        WHEN COALESCE(i.revenue, 0) > 0
        THEN ((COALESCE(i.revenue, 0) - COALESCE(b.costs, 0)) / i.revenue * 100)
        ELSE 0
    END as profit_margin,
    COALESCE(e.estimated_revenue, 0) as estimated_revenue,
    COALESCE(e.estimated_cost, 0) as estimated_cost,
    COALESCE(e.estimated_revenue, 0) - COALESCE(e.estimated_cost, 0) as estimated_profit,
    COALESCE(i.invoice_count, 0) as invoice_count,
    COALESCE(b.bill_count, 0) as bill_count,
    CURRENT_TIMESTAMP as last_updated
FROM milestone.projects p
CROSS JOIN milestone.build_phases bp
LEFT JOIN invoice_summary i ON i.project_id = p.id AND i.build_phase_id = bp.id
LEFT JOIN bill_summary b ON b.project_id = p.id AND b.build_phase_id = bp.id
LEFT JOIN estimate_summary e ON e.project_id = p.id AND e.build_phase_id = bp.id
WHERE p.is_active = true AND bp.is_active = true;

-- REQUIRED: Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS ux_project_phase_summary
ON milestone.project_phase_summary(project_id, phase_id);

-- Create refresh function
CREATE OR REPLACE FUNCTION milestone.refresh_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY milestone.project_phase_summary;
END;
$$ LANGUAGE plpgsql;

-- Create database roles for security
DO $$
BEGIN
    -- Create read-only role for Xero-sourced tables
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_ro') THEN
        CREATE ROLE app_ro NOINHERIT;
    END IF;

    -- Create read/write role for user-managed tables
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_rw') THEN
        CREATE ROLE app_rw NOINHERIT;
    END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA milestone TO app_ro, app_rw;

-- Read-only permissions for Xero-sourced tables
GRANT SELECT ON milestone.projects,
                milestone.build_phases,
                milestone.invoices,
                milestone.bills,
                milestone.sync_status,
                milestone.project_phase_summary
TO app_ro;

-- Read/write permissions for user-managed tables (app needs full CRUD for estimates)
GRANT SELECT, INSERT, UPDATE, DELETE ON
    milestone.project_estimates,
    milestone.export_history,
    milestone.user_preferences,
    milestone.audit_logs
TO app_rw;

-- Grant sequence usage for serial columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA milestone TO app_rw;

-- Create tracking category configuration table for n8n
CREATE TABLE IF NOT EXISTS milestone.tracking_config (
    id SERIAL PRIMARY KEY,
    tracking_type VARCHAR(50) NOT NULL CHECK (tracking_type IN ('PROJECT', 'PHASE')),
    tracking_category_id VARCHAR(50) NOT NULL,
    tracking_category_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tracking_type)
);
```

## Step 7: Create Database Queries

### 7.1 Create Query Functions

Create `src/lib/queries.ts`:

```typescript
import { db } from './db'
import { sql } from 'drizzle-orm'
import { desc, eq, and, gte, lte, inArray } from 'drizzle-orm'
import {
  projects,
  invoices,
  bills,
  projectEstimates,
  syncStatus,
  userPreferences,
  exportHistory,
  auditLogs,
} from './db'

// Dashboard queries
export async function getDashboardStats() {
  const stats = await db.execute(sql`
    SELECT
      SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END) as total_revenue,
      SUM(b.total) as total_costs,
      SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END) - COALESCE(SUM(b.total), 0) as total_profit,
      CASE
        WHEN SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END) > 0
        THEN ((SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END) - COALESCE(SUM(b.total), 0)) /
              SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END) * 100)
        ELSE 0
      END as profit_margin,
      COUNT(DISTINCT p.id) as active_projects,
      COUNT(CASE WHEN i.status = 'AUTHORISED' AND i.amount_due > 0 THEN 1 END) as pending_invoices,
      COUNT(CASE WHEN i.status = 'AUTHORISED' AND i.due_date < CURRENT_DATE THEN 1 END) as overdue_invoices
    FROM milestone.projects p
    LEFT JOIN milestone.invoices i ON p.id = i.project_id
    LEFT JOIN milestone.bills b ON p.id = b.project_id
    WHERE p.is_active = true
      AND (i.status IN ('AUTHORISED', 'PAID') OR i.status IS NULL)
      AND (b.status IN ('AUTHORISED', 'PAID') OR b.status IS NULL)
  `)

  const lastSync = await db
    .select({ completed_at: syncStatus.completed_at })
    .from(syncStatus)
    .where(eq(syncStatus.status, 'COMPLETED'))
    .orderBy(desc(syncStatus.completed_at))
    .limit(1)

  return {
    ...stats.rows[0],
    last_sync_time: lastSync[0]?.completed_at || null,
  }
}

// Get project summary from materialized view
export async function getProjectSummaries() {
  const summaries = await db.execute(sql`
    SELECT * FROM milestone.project_phase_summary
    ORDER BY project_name, phase_order
  `)
  return summaries.rows
}

// Get all projects
export async function getProjects(filters?: {
  status?: string
  client?: string
  isActive?: boolean
}) {
  let query = db.select().from(projects)

  const conditions = []
  if (filters?.status) {
    conditions.push(eq(projects.status, filters.status))
  }
  if (filters?.client) {
    conditions.push(eq(projects.client_name, filters.client))
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(projects.is_active, filters.isActive))
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions))
  }

  return await query.orderBy(desc(projects.created_at))
}

// Get single project with related data
export async function getProjectById(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)

  if (!project) return null

  const projectInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.project_id, projectId))
    .orderBy(desc(invoices.invoice_date))

  const projectBills = await db
    .select()
    .from(bills)
    .where(eq(bills.project_id, projectId))
    .orderBy(desc(bills.bill_date))

  const estimates = await db
    .select()
    .from(projectEstimates)
    .where(
      and(
        eq(projectEstimates.project_id, projectId),
        sql`${projectEstimates.valid_until} IS NULL`
      )
    )

  return {
    ...project,
    invoices: projectInvoices,
    bills: projectBills,
    estimates,
  }
}

// Get or create user preferences
export async function getUserPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.user_id, userId))
    .limit(1)

  if (prefs) return prefs

  // Create default preferences
  const [newPrefs] = await db
    .insert(userPreferences)
    .values({ user_id: userId })
    .returning()

  return newPrefs
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  updates: Partial<typeof userPreferences.$inferInsert>
) {
  const [updated] = await db
    .update(userPreferences)
    .set(updates)
    .where(eq(userPreferences.user_id, userId))
    .returning()

  return updated
}

// Estimate CRUD operations
export async function createEstimate(
  estimate: typeof projectEstimates.$inferInsert
) {
  // Invalidate any existing current estimate
  if (!estimate.valid_until) {
    await db
      .update(projectEstimates)
      .set({ valid_until: sql`CURRENT_DATE` })
      .where(
        and(
          eq(projectEstimates.project_id, estimate.project_id),
          eq(projectEstimates.build_phase_id, estimate.build_phase_id || ''),
          eq(projectEstimates.estimate_type, estimate.estimate_type),
          sql`${projectEstimates.valid_until} IS NULL`
        )
      )
  }

  const [created] = await db
    .insert(projectEstimates)
    .values(estimate)
    .returning()

  return created
}

export async function updateEstimate(
  id: number,
  updates: Partial<typeof projectEstimates.$inferInsert>
) {
  const [updated] = await db
    .update(projectEstimates)
    .set(updates)
    .where(eq(projectEstimates.id, id))
    .returning()

  return updated
}

export async function deleteEstimate(id: number) {
  // Soft delete by setting valid_until
  const [deleted] = await db
    .update(projectEstimates)
    .set({ valid_until: sql`CURRENT_DATE` })
    .where(eq(projectEstimates.id, id))
    .returning()

  return deleted
}

// Audit logging
export async function createAuditLog(
  log: typeof auditLogs.$inferInsert
) {
  const [created] = await db
    .insert(auditLogs)
    .values(log)
    .returning()

  return created
}

// Export history
export async function createExportRecord(
  record: typeof exportHistory.$inferInsert
) {
  const [created] = await db
    .insert(exportHistory)
    .values(record)
    .returning()

  return created
}

export async function updateExportRecord(
  id: number,
  updates: Partial<typeof exportHistory.$inferInsert>
) {
  const [updated] = await db
    .update(exportHistory)
    .set(updates)
    .where(eq(exportHistory.id, id))
    .returning()

  return updated
}

// Sync status (read-only)
export async function getLastSyncStatus() {
  const [status] = await db
    .select()
    .from(syncStatus)
    .orderBy(desc(syncStatus.created_at))
    .limit(1)

  return status
}

export async function getSyncHistory(limit = 10) {
  return await db
    .select()
    .from(syncStatus)
    .orderBy(desc(syncStatus.created_at))
    .limit(limit)
}

// Refresh materialized view (call after data changes)
export async function refreshDashboardView() {
  await db.execute(sql`SELECT milestone.refresh_summary()`)
}
```

## Step 8: Create Migration Scripts

### 8.1 Generate Initial Migration

```bash
npm run db:push
```

This will create the schema in your database.

### 8.2 Run Production Improvements

After the schema is created, run the production improvements SQL:

```bash
psql $DATABASE_URL < drizzle/production-improvements.sql
```

Or create a script `scripts/apply-production-sql.ts`:

```typescript
import { db } from '../src/lib/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

async function applyProductionSQL() {
  try {
    const sqlContent = fs.readFileSync(
      path.join(__dirname, '../drizzle/production-improvements.sql'),
      'utf-8'
    )

    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(/;\s*$|;\s*(?=CREATE|DROP|ALTER|DO)/gm)
      .filter(s => s.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...')
        await db.execute(sql.raw(statement))
      }
    }

    console.log('✅ Production improvements applied successfully!')
  } catch (error) {
    console.error('❌ Error applying production SQL:', error)
    process.exit(1)
  }
}

applyProductionSQL()
```

Run it:

```bash
npx tsx scripts/apply-production-sql.ts
```

## Step 9: Create Seed Data (Optional)

### 9.1 Create Seed Script

Create `src/db/seed.ts`:

```typescript
import { db } from '../src/lib/db'
import { projects, buildPhases, invoices, bills, syncStatus } from './schema'

async function seed() {
  console.log('🌱 Seeding database...')

  // Create sample projects
  const sampleProjects = await db
    .insert(projects)
    .values([
      {
        id: 'proj_1',
        xero_project_id: 'xero_proj_1',
        name: 'Website Redesign - Acme Corp',
        client_name: 'Acme Corp',
        tracking_category_id: 'track_1',
        status: 'active',
        start_date: '2024-01-01',
        project_manager: 'John Smith',
      },
      {
        id: 'proj_2',
        xero_project_id: 'xero_proj_2',
        name: 'Mobile App Development - TechStart',
        client_name: 'TechStart Ltd',
        tracking_category_id: 'track_1',
        status: 'active',
        start_date: '2024-02-01',
        project_manager: 'Jane Doe',
      },
    ])
    .returning()

  // Create build phases
  const samplePhases = await db
    .insert(buildPhases)
    .values([
      {
        id: 'phase_1',
        xero_phase_id: 'xero_phase_1',
        name: 'Discovery',
        tracking_category_id: 'track_2',
        display_order: 1,
        color: '#3B82F6',
      },
      {
        id: 'phase_2',
        xero_phase_id: 'xero_phase_2',
        name: 'Design',
        tracking_category_id: 'track_2',
        display_order: 2,
        color: '#10B981',
      },
      {
        id: 'phase_3',
        xero_phase_id: 'xero_phase_3',
        name: 'Development',
        tracking_category_id: 'track_2',
        display_order: 3,
        color: '#F59E0B',
      },
      {
        id: 'phase_4',
        xero_phase_id: 'xero_phase_4',
        name: 'Testing',
        tracking_category_id: 'track_2',
        display_order: 4,
        color: '#EF4444',
      },
    ])
    .returning()

  // Create sample invoices
  await db.insert(invoices).values([
    {
      id: 'inv_1',
      xero_invoice_id: 'xero_inv_1',
      invoice_number: 'INV-001',
      contact_name: 'Acme Corp',
      project_id: 'proj_1',
      build_phase_id: 'phase_1',
      type: 'ACCREC',
      status: 'PAID',
      total: '5000.00',
      amount_paid: '5000.00',
      amount_due: '0.00',
      currency_code: 'GBP',
      invoice_date: '2024-01-15',
    },
    {
      id: 'inv_2',
      xero_invoice_id: 'xero_inv_2',
      invoice_number: 'INV-002',
      contact_name: 'TechStart Ltd',
      project_id: 'proj_2',
      build_phase_id: 'phase_2',
      type: 'ACCREC',
      status: 'AUTHORISED',
      total: '7500.00',
      amount_paid: '0.00',
      amount_due: '7500.00',
      currency_code: 'GBP',
      invoice_date: '2024-02-20',
    },
  ])

  // Create sample bills
  await db.insert(bills).values([
    {
      id: 'bill_1',
      xero_bill_id: 'xero_bill_1',
      bill_number: 'BILL-001',
      contact_name: 'Freelancer Inc',
      project_id: 'proj_1',
      build_phase_id: 'phase_1',
      type: 'BILL',
      status: 'PAID',
      total: '2000.00',
      amount_paid: '2000.00',
      amount_due: '0.00',
      currency_code: 'GBP',
      bill_date: '2024-01-20',
    },
    {
      id: 'bill_2',
      xero_bill_id: 'xero_bill_2',
      bill_number: 'BILL-002',
      contact_name: 'Design Studio',
      project_id: 'proj_2',
      build_phase_id: 'phase_2',
      type: 'BILL',
      status: 'AUTHORISED',
      total: '3000.00',
      amount_paid: '0.00',
      amount_due: '3000.00',
      currency_code: 'GBP',
      bill_date: '2024-02-25',
    },
  ])

  // Create sync status
  await db.insert(syncStatus).values({
    sync_type: 'FULL',
    status: 'COMPLETED',
    started_at: new Date('2024-01-01T00:00:00Z'),
    completed_at: new Date('2024-01-01T00:05:00Z'),
    records_processed: 10,
    records_created: 6,
    records_updated: 4,
    triggered_by: 'CRON',
  })

  // Refresh materialized view
  await db.execute(sql`SELECT milestone.refresh_summary()`)

  console.log('✅ Database seeded successfully!')
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error)
  process.exit(1)
})
```

### 9.2 Add Seed Script to package.json

Update `package.json`:

```json
{
  "scripts": {
    // ... existing scripts
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

## Step 10: Test Database Connection

### 10.1 Create Test Script

Create `scripts/test-db.ts`:

```typescript
import { db } from '../src/lib/db'
import { sql } from 'drizzle-orm'

async function testConnection() {
  try {
    // Test basic connection
    const result = await db.execute(sql`SELECT current_database(), version()`)
    console.log('✅ Database connected:', result.rows[0])

    // Test schema exists
    const schema = await db.execute(sql`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name = 'milestone'
    `)
    console.log('✅ Schema exists:', schema.rows[0])

    // Test tables exist
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'milestone'
      ORDER BY table_name
    `)
    console.log('✅ Tables created:', tables.rows.map(r => r.table_name))

    // Test materialized view
    const viewExists = await db.execute(sql`
      SELECT matviewname
      FROM pg_matviews
      WHERE schemaname = 'milestone'
      AND matviewname = 'project_phase_summary'
    `)
    console.log('✅ Materialized view exists:', viewExists.rows[0])

    console.log('\n🎉 Database setup complete and working!')
  } catch (error) {
    console.error('❌ Database test failed:', error)
    process.exit(1)
  }
}

testConnection()
```

### 10.2 Run Test

```bash
npx tsx scripts/test-db.ts
```

## Phase 2 Complete Checklist

- [ ] Database dependencies installed
- [ ] Environment variables configured
- [ ] Drizzle ORM configured
- [ ] Complete database schema created
- [ ] Production improvements applied
- [ ] Database connection established
- [ ] Query functions created
- [ ] Migration scripts ready
- [ ] Seed data available (optional)
- [ ] Database connection tested

## Common Issues and Solutions

### Issue: Cannot connect to database
**Solution**: Verify PostgreSQL is running and credentials in `.env.local` are correct:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: Schema 'milestone' does not exist
**Solution**: Create the schema manually:
```sql
CREATE SCHEMA IF NOT EXISTS milestone;
```

### Issue: Permission denied errors
**Solution**: Ensure your database user has proper permissions:
```sql
GRANT ALL PRIVILEGES ON SCHEMA milestone TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA milestone TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA milestone TO your_user;
```

### Issue: Materialized view refresh fails
**Solution**: Ensure unique index exists:
```sql
CREATE UNIQUE INDEX ux_project_phase_summary
ON milestone.project_phase_summary(project_id, phase_id);
```

## Next Steps

Phase 2 is complete! The database is fully configured with all tables, indexes, and production improvements.

Proceed to [Phase 3: Authentication](./phase-3-authentication.md) to:
- Set up Clerk authentication
- Configure middleware
- Create sign-in/sign-up pages
- Implement session management

## Project Status

```
✅ Phase 1: Project Initialization - COMPLETE
✅ Phase 2: Database Setup - COMPLETE
⏳ Phase 3: Authentication - PENDING
⏳ Phase 4: Dashboard Implementation - PENDING
⏳ Phase 5: Project Features - PENDING
⏳ Phase 6: Export Functionality - PENDING
⏳ Phase 7: Deployment - PENDING
```

---

*Estimated time: 3-4 hours*
*Last updated: Phase 2 Complete*
