import {
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
  pgEnum,
  serial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Define milestone schema
const milestone = pgSchema('milestone');

// Enums
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'DRAFT',
  'SUBMITTED',
  'AUTHORISED',
  'PAID',
  'VOIDED',
]);

export const billStatusEnum = pgEnum('bill_status', [
  'DRAFT',
  'SUBMITTED',
  'AUTHORISED',
  'PAID',
  'VOIDED',
]);

export const invoiceTypeEnum = pgEnum('invoice_type', ['ACCREC', 'ACCPAY']);
export const billTypeEnum = pgEnum('bill_type', ['BILL', 'PURCHASEORDER']);

export const estimateTypeEnum = pgEnum('estimate_type', [
  'revenue',
  'cost',
  'hours',
  'materials',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'EXPORT',
]);

export const exportTypeEnum = pgEnum('export_type', ['PDF', 'EXCEL', 'CSV']);
export const syncStatusEnum = pgEnum('sync_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
]);

// Projects table (from Xero tracking category) - uses Xero IDs
export const projects = milestone.table(
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
);

// Build phases table (from Xero tracking category) - uses Xero IDs
export const buildPhases = milestone.table('build_phases', {
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
});

// Project estimates table (user-entered) - uses UUID for user-generated content
export const projectEstimates = milestone.table(
  'project_estimates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: varchar('project_id', { length: 50 })
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    build_phase_id: varchar('build_phase_id', { length: 50 }).references(
      () => buildPhases.id
    ),
    description: varchar('description', { length: 500 }).notNull().default('Estimate'),
    estimate_type: estimateTypeEnum('estimate_type').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    estimate_date: date('estimate_date').notNull().defaultNow(),
    confidence_level: integer('confidence_level').default(3),
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
);

// Invoices table (from Xero)
export const invoices = milestone.table(
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
);

// Bills table (from Xero)
export const bills = milestone.table(
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
);

// Audit logs table (minimal - only logins, estimates, exports)
export const auditLogs = milestone.table(
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
);

// User preferences table
export const userPreferences = milestone.table('user_preferences', {
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
});

// Export history table
export const exportHistory = milestone.table(
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
);

// Sync status table
export const syncStatus = milestone.table(
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
);