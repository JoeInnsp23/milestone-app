# Milestone P&L Dashboard v2.0 - Complete Project Plan

## Executive Summary

### Project Overview
Complete migration of the current vanilla JavaScript P&L dashboard to a modern Next.js application with authentication, database persistence, and enhanced features for project cost tracking and management.

### System Architecture Separation
**n8n Responsibilities (Automation Platform):**
- ALL Xero API integration and authentication
- Scheduled data synchronization (every 2 hours)
- Data transformation and mapping
- Writing to PostgreSQL database
- Managing sync status and history

**Next.js App Responsibilities (User Interface):**
- User authentication via Clerk
- Reading data from PostgreSQL only
- User-entered estimates and preferences
- Data visualization and reporting
- PDF/Excel exports from database data
- Viewing sync status (read-only)
- Requesting sync via n8n webhook (optional)

### Key Objectives
1. Implement GDPR-compliant authentication using Clerk
2. Enable project cost estimation and tracking
3. Add build phase categorization and filtering
4. Create detailed project invoice views
5. Implement PDF/Excel export functionality
6. Display synchronized Xero data from PostgreSQL (sync handled by n8n)

### Success Criteria
- [ ] Zero downtime migration from current system
- [ ] Sub-2 second page load times
- [ ] 100% data accuracy from PostgreSQL
- [ ] Seamless display of n8n-synced Xero data
- [ ] GDPR compliance certification ready
- [ ] User satisfaction score >4.5/5

## System Architecture

### Technology Stack (Simplified)
```yaml
Core Stack:
  Framework: Next.js 15 (App Router)
  Language: TypeScript
  Styling: Tailwind CSS v4 + shadcn/ui
  Charts: Recharts
  Notifications: React Hot Toast
  Auth: Clerk
  Database: PostgreSQL (read from n8n-populated data)
  ORM: Drizzle ORM
  Export: jsPDF, SheetJS

Data Flow:
  Xero → n8n → PostgreSQL → Next.js Dashboard

Deployment:
  Server: Existing Ubuntu server
  Process: PM2
  Proxy: Nginx
```

## Environment Variables

```env
# .env.local

# Database (read from n8n-populated PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/milestone"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# That's it! Just DB and Auth.
```

## Complete Database Schema

### Production Improvements Required

1. **Use proper timestamps and triggers**:
   - Change all timestamps to `timestamptz`
   - Add auto-updating triggers for `updated_at` columns
   - Use UUIDs for primary keys where appropriate

2. **Fix materialized view for production**:
   - Add unique index for `REFRESH CONCURRENTLY` to work
   - Required: `CREATE UNIQUE INDEX ON project_phase_summary(project_id, phase_id)`

3. **Correct status filtering**:
   - Use positive allow-lists instead of `status != 'DELETED'`
   - Xero statuses: `DRAFT`, `SUBMITTED`, `AUTHORISED`, `PAID`, `VOIDED`
   - Filter on `WHERE status IN ('AUTHORISED', 'PAID')` for active records

4. **Tracking category mapping**:
   - Add configuration table for n8n to map which tracking category = Project vs Phase
   - Avoid brittle assumptions when Xero options change

5. **Estimates versioning**:
   - Enforce single current row per `(project, phase, estimate_type)`
   - Use partial unique index: `WHERE valid_until IS NULL`
   - Keep history via `valid_until` timestamp

6. **Performance indexes**:
   ```sql
   -- Hot query paths
   CREATE INDEX idx_inv_proj_date ON invoices(project_id, invoice_date DESC)
     WHERE status IN ('AUTHORISED','PAID');
   CREATE INDEX idx_bills_proj_date ON bills(project_id, bill_date DESC)
     WHERE status IN ('AUTHORISED','PAID');
   ```

7. **Security - Role-based access**:
   ```sql
   -- Read-only role for Xero-sourced tables
   CREATE ROLE app_ro;
   GRANT SELECT ON projects, invoices, bills, sync_status TO app_ro;

   -- Read/write only where needed
   CREATE ROLE app_rw;
   GRANT INSERT,UPDATE,DELETE ON project_estimates, export_history, user_preferences TO app_rw;
   ```

8. **Minimal audit logging**:
   - Only track: logins, estimate changes, exports
   - Sufficient for GDPR compliance without over-engineering

```sql
-- Create schema for application
CREATE SCHEMA IF NOT EXISTS milestone;

-- Auto-update trigger for updated_at columns
CREATE OR REPLACE FUNCTION milestone.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Projects from Xero tracking category
CREATE TABLE milestone.projects (
    id VARCHAR(50) PRIMARY KEY,
    xero_project_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    client_contact_id VARCHAR(50),
    tracking_category_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    project_manager VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP
);

-- Build phases from Xero tracking category
CREATE TABLE milestone.build_phases (
    id VARCHAR(50) PRIMARY KEY,
    xero_phase_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tracking_category_id VARCHAR(50) NOT NULL,
    display_order INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    typical_duration_days INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project estimates (user-entered)
CREATE TABLE milestone.project_estimates (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES milestone.projects(id) ON DELETE CASCADE,
    build_phase_id VARCHAR(50) REFERENCES milestone.build_phases(id),
    estimate_type VARCHAR(50) NOT NULL, -- 'revenue', 'cost', 'hours', 'materials'
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    notes TEXT,
    valid_from DATE,
    valid_until DATE,
    created_by VARCHAR(255) NOT NULL, -- Clerk user ID
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    previous_version_id INTEGER REFERENCES milestone.project_estimates(id)
);

-- Invoices from Xero
CREATE TABLE milestone.invoices (
    id VARCHAR(50) PRIMARY KEY,
    xero_invoice_id VARCHAR(50) UNIQUE NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    contact_id VARCHAR(50),
    contact_name VARCHAR(255),
    project_id VARCHAR(50) REFERENCES milestone.projects(id),
    build_phase_id VARCHAR(50) REFERENCES milestone.build_phases(id),
    type VARCHAR(50), -- 'ACCREC' or 'ACCPAY'
    status VARCHAR(50), -- 'DRAFT', 'SUBMITTED', 'AUTHORISED', 'PAID'
    line_amount_types VARCHAR(50),
    sub_total DECIMAL(12,2),
    total_tax DECIMAL(12,2),
    total DECIMAL(12,2),
    amount_paid DECIMAL(12,2),
    amount_due DECIMAL(12,2),
    currency_code VARCHAR(3),
    invoice_date DATE,
    due_date DATE,
    fully_paid_date DATE,
    expected_payment_date DATE,
    line_items JSONB,
    payments JSONB,
    credit_notes JSONB,
    attachments JSONB,
    xero_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP
);

-- Bills/Purchase Orders from Xero
CREATE TABLE milestone.bills (
    id VARCHAR(50) PRIMARY KEY,
    xero_bill_id VARCHAR(50) UNIQUE NOT NULL,
    bill_number VARCHAR(50),
    reference VARCHAR(255),
    contact_id VARCHAR(50),
    contact_name VARCHAR(255),
    project_id VARCHAR(50) REFERENCES milestone.projects(id),
    build_phase_id VARCHAR(50) REFERENCES milestone.build_phases(id),
    type VARCHAR(50), -- 'BILL', 'PURCHASEORDER'
    status VARCHAR(50),
    sub_total DECIMAL(12,2),
    total_tax DECIMAL(12,2),
    total DECIMAL(12,2),
    amount_paid DECIMAL(12,2),
    amount_due DECIMAL(12,2),
    currency_code VARCHAR(3),
    bill_date DATE,
    due_date DATE,
    fully_paid_date DATE,
    line_items JSONB,
    payments JSONB,
    attachments JSONB,
    xero_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP
);

-- Audit logs for GDPR compliance
CREATE TABLE milestone.audit_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_action VARCHAR(50) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    user_email VARCHAR(255),
    user_ip_address INET,
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE milestone.user_preferences (
    user_id VARCHAR(255) PRIMARY KEY, -- Clerk user ID
    default_view VARCHAR(50) DEFAULT 'dashboard',
    theme VARCHAR(20) DEFAULT 'system',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    currency VARCHAR(3) DEFAULT 'GBP',
    notifications JSONB DEFAULT '{"email": true, "in_app": true}',
    dashboard_layout JSONB,
    saved_filters JSONB DEFAULT '[]',
    favorite_projects TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Export history
CREATE TABLE milestone.export_history (
    id SERIAL PRIMARY KEY,
    export_type VARCHAR(50) NOT NULL, -- 'PDF', 'EXCEL', 'CSV'
    export_scope VARCHAR(50), -- 'PROJECT', 'DASHBOARD', 'INVOICE_LIST'
    filters_applied JSONB,
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    rows_exported INTEGER,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Sync status tracking
CREATE TABLE milestone.sync_status (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL, -- 'PROJECTS', 'INVOICES', 'BILLS', 'FULL'
    status VARCHAR(50) NOT NULL, -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details JSONB,
    triggered_by VARCHAR(50), -- 'CRON', 'MANUAL', 'WEBHOOK'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_projects_active ON milestone.projects(is_active);
CREATE INDEX idx_projects_client ON milestone.projects(client_name);
CREATE INDEX idx_invoices_project ON milestone.invoices(project_id);
CREATE INDEX idx_invoices_phase ON milestone.invoices(build_phase_id);
CREATE INDEX idx_invoices_date ON milestone.invoices(invoice_date);
CREATE INDEX idx_invoices_status ON milestone.invoices(status);
CREATE INDEX idx_bills_project ON milestone.bills(project_id);
CREATE INDEX idx_bills_phase ON milestone.bills(build_phase_id);
CREATE INDEX idx_estimates_project ON milestone.project_estimates(project_id);
CREATE INDEX idx_audit_user ON milestone.audit_logs(user_id);
CREATE INDEX idx_audit_created ON milestone.audit_logs(created_at);
CREATE INDEX idx_sync_status_type ON milestone.sync_status(sync_type, status);

-- Create materialized view for dashboard performance
CREATE MATERIALIZED VIEW milestone.project_phase_summary AS
WITH invoice_summary AS (
    SELECT
        project_id,
        build_phase_id,
        SUM(CASE WHEN type = 'ACCREC' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'ACCREC' THEN amount_paid ELSE 0 END) as revenue_paid,
        COUNT(CASE WHEN type = 'ACCREC' THEN 1 END) as invoice_count
    FROM milestone.invoices
    WHERE status != 'DELETED'
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
    WHERE status != 'DELETED'
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

-- Create refresh function
CREATE OR REPLACE FUNCTION milestone.refresh_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY milestone.project_phase_summary;
END;
$$ LANGUAGE plpgsql;

-- REQUIRED: Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX ux_project_phase_summary
  ON milestone.project_phase_summary(project_id, phase_id);

-- Enforce single current estimate per project/phase/type
CREATE UNIQUE INDEX ux_estimates_current
  ON milestone.project_estimates(project_id, build_phase_id, estimate_type)
  WHERE valid_until IS NULL;
```

## Simplified Project Structure

```
milestone-app/
├── .env.local                   # DB connection, Clerk keys
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── drizzle.config.ts
├── middleware.ts                # Clerk auth
│
├── public/
│   └── favicon.ico
│
├── drizzle/
│   └── schema.ts               # DB schema definitions
│
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with Clerk
│   │   ├── page.tsx             # Redirect to dashboard
│   │   ├── globals.css
│   │   │
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Main dashboard with all stats
│   │   │
│   │   ├── projects/
│   │   │   ├── page.tsx        # Projects table view
│   │   │   └── [id]/page.tsx  # Project detail with estimates
│   │   │
│   │   └── api/
│   │       ├── projects/route.ts          # GET projects
│   │       ├── projects/[id]/route.ts    # GET project detail
│   │       ├── estimates/route.ts        # CRUD estimates
│   │       ├── export/route.ts           # PDF/Excel export
│   │       └── sync-status/route.ts      # GET last sync time
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (auto-installed)
│   │   ├── nav-header.tsx      # Top navigation with user menu
│   │   ├── stats-cards.tsx     # KPI cards for dashboard
│   │   ├── revenue-chart.tsx   # Main revenue chart
│   │   ├── profit-chart.tsx    # Profit/margin chart
│   │   ├── project-table.tsx   # Projects data table
│   │   ├── estimate-form.tsx   # Add/edit estimates
│   │   └── export-dialog.tsx   # PDF/Excel export options
│   │
│   ├── lib/
│   │   ├── db.ts                # Drizzle DB connection
│   │   ├── utils.ts             # Helper functions
│   │   └── queries.ts           # All DB queries
│   │
│   └── types/
│       └── index.ts             # All type definitions
│
└── README.md                     # Setup and deployment notes
```

## Data Flow Architecture

```mermaid
graph TD
    subgraph "Xero Cloud"
        X[Xero API]
    end

    subgraph "n8n Automation"
        N1[Cron Scheduler]
        N2[Xero Integration]
        N3[Data Transform]
    end

    subgraph "PostgreSQL Database"
        DB1[(Projects)]
        DB2[(Invoices)]
        DB3[(Bills)]
        DB4[(Estimates)]
        DB5[(Sync Status)]
    end

    subgraph "Next.js Application"
        A1[Dashboard Views]
        A2[Project Management]
        A3[Estimate CRUD]
        A4[Export Functions]
        A5[Sync Status Display]
    end

    X -->|API Calls| N2
    N1 -->|Trigger| N2
    N2 --> N3
    N3 -->|Write| DB1
    N3 -->|Write| DB2
    N3 -->|Write| DB3
    N3 -->|Update| DB5

    DB1 -->|Read Only| A1
    DB2 -->|Read Only| A1
    DB3 -->|Read Only| A1
    DB4 -->|Read/Write| A3
    DB5 -->|Read Only| A5

    A2 -->|Read| DB1
    A4 -->|Read| DB1
    A4 -->|Read| DB2
    A4 -->|Read| DB3

    A5 -.->|Request Sync| N1

    style X fill:#ff9999
    style N2 fill:#99ccff
    style DB1 fill:#99ff99
    style DB2 fill:#99ff99
    style DB3 fill:#99ff99
    style DB4 fill:#99ff99
    style DB5 fill:#99ff99
    style A1 fill:#ffcc99
```

**Key Points:**
- The Next.js app NEVER directly connects to Xero
- All Xero data flows through n8n to PostgreSQL
- The app only reads Xero-sourced data from the database
- User-created estimates are managed directly by the app
- Sync requests are optional and go through n8n webhooks

## Business Workflows

### 1. User Authentication Flow
```mermaid
graph LR
    A[User Visits] --> B{Authenticated?}
    B -->|No| C[Redirect to Sign In]
    B -->|Yes| D[Load Dashboard]
    C --> E[Clerk Auth]
    E --> F[Create Session]
    F --> G[Create Audit Log]
    G --> H[Query PostgreSQL]
    H --> I[Display DB Data]
    I --> D
```

### 2. Project Data Sync Flow (n8n Managed)
```mermaid
graph TD
    A[n8n Cron Schedule] --> B[n8n Workflow]
    B --> C[Fetch Xero Projects]
    B --> D[Fetch Xero Invoices]
    B --> E[Fetch Xero Bills]
    C --> F[Update PostgreSQL]
    D --> F
    E --> F
    F --> G[Refresh Materialized View]
    G --> H[Update Sync Status]
    H --> I[App Reads Latest Data]
    J[User Views Sync Status] --> K[App Queries sync_status Table]
    L[User Requests Sync] --> M[App Calls n8n Webhook]
    M --> B
```

### 3. Estimate Management Flow
```mermaid
graph LR
    A[User Opens Project] --> B[View Current Estimates]
    B --> C{Edit Estimate?}
    C -->|Yes| D[Open Form]
    D --> E[Validate Input]
    E --> F[Save to DB]
    F --> G[Create Audit Log]
    G --> H[Recalculate Totals]
    H --> I[Update UI]
```

### 4. Export Flow
```mermaid
graph TD
    A[User Selects Export] --> B[Choose Format]
    B --> C{PDF or Excel?}
    C -->|PDF| D[Generate PDF]
    C -->|Excel| E[Generate Excel]
    D --> F[Create Export Record]
    E --> F
    F --> G[Audit Log]
    G --> H[Download File]
```

## Simplified UI Structure

```yaml
App:
  ClerkProvider:
    Layout:
      NavHeader:
        - Logo
        - Dashboard Link
        - Projects Link
        - UserButton (Clerk)
        - Sync Status Badge

      Dashboard Page:
        - 4 Stats Cards (Revenue, Costs, Profit, Margin)
        - 2 Charts (Revenue trend, Profit by project)
        - Projects Table
        - Export Button

      Projects Page:
        - Data Table with filters
        - Search
        - Export Button

      Project Detail Page:
        - Project Info Header
        - Invoices Table
        - Bills Table
        - Estimates Section (CRUD)
        - Export Button
```

## API Endpoints

## Simplified API Endpoints

```typescript
// Minimal API - Use Server Components for reads!

// Only mutations need API routes:
POST /api/estimates          // Create/update estimates
DELETE /api/estimates/[id]   // Delete estimate
POST /api/export             // Generate PDF/Excel (streaming)

// Server Components handle these (no API needed):
// - Reading projects, invoices, bills
// - Dashboard stats
// - Sync status display
```

### Server Component Pattern:
```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  // Direct DB query in Server Component
  const stats = await db.select().from(projectPhaseSummary);
  return <DashboardClient initialData={stats} />;
}
```

## n8n Workflows (Handles All Xero Integration)

### 1. Master Sync Workflow (n8n Managed)
```yaml
Name: Xero Master Sync
Trigger:
  - Cron (0 */2 * * *) # Every 2 hours
  - Webhook from Next.js app (manual sync request)
Nodes:
  1. Start:
     - Log sync start to PostgreSQL sync_status table
     - Set status = 'RUNNING'

  2. Get Tracking Categories:
     - Xero API: GET /TrackingCategories
     - Extract Projects and Build Phases

  3. Upsert Categories:
     - PostgreSQL: UPSERT projects table
     - PostgreSQL: UPSERT build_phases table

  4. Get Invoices:
     - Xero API: GET /Invoices?ModifiedAfter={{lastSync}}
     - Include tracking categories

  5. Process Invoices:
     - Code: Map tracking to project_id and phase_id
     - PostgreSQL: UPSERT invoices table

  6. Get Bills:
     - Xero API: GET /Bills?ModifiedAfter={{lastSync}}
     - Include tracking categories

  7. Process Bills:
     - Code: Map tracking to project_id and phase_id
     - PostgreSQL: UPSERT bills table

  8. Refresh Views:
     - PostgreSQL: CALL refresh_summary()

  9. Complete:
     - Update sync_status table (status = 'COMPLETED')
     - Optionally notify Next.js app via webhook
```

### 2. Manual Sync Request Handler
```yaml
Name: Handle Manual Sync Request
Trigger: Webhook POST /webhook/manual-sync
Nodes:
  1. Validate Request:
     - Check request comes from Next.js app
     - Verify admin user token

  2. Check Current Status:
     - Query sync_status table
     - If already running, return status

  3. Trigger Master Sync:
     - Execute Master Sync Workflow

  4. Response:
     - Return sync initiated confirmation
```

### 3. Sync Status Notification
```yaml
Name: Notify App of Sync Completion
Trigger: Called by Master Sync Workflow
Nodes:
  1. Prepare Notification:
     - Get sync summary from sync_status

  2. Call App Webhook:
     - POST to Next.js /api/webhooks/n8n
     - Include sync results

  3. Log Response:
     - Record notification sent
```

## Simplified Implementation Plan

### Week 1: Core Dashboard
**Day 1-2: Setup**
- [ ] Create Next.js app with TypeScript
- [ ] Add Tailwind + shadcn/ui
- [ ] Setup Clerk auth
- [ ] Connect to PostgreSQL

**Day 3-4: Dashboard**
- [ ] Dashboard page with stats cards
- [ ] Revenue and profit charts
- [ ] Projects table

**Day 5: Projects**
- [ ] Project detail page
- [ ] Estimates CRUD

### Week 2: Polish & Deploy
**Day 6-7: Export & UI**
- [ ] PDF/Excel export
- [ ] Responsive design
- [ ] Loading states

**Day 8-9: Testing**
- [ ] Test with real data
- [ ] Fix bugs

**Day 10: Deploy**
- [ ] Setup PM2
- [ ] Configure Nginx
- [ ] Go live

## What Makes This Simple

1. **Just 3 pages**: Dashboard, Projects list, Project detail
2. **5 API endpoints**: Minimal backend complexity
3. **Read-only Xero data**: No complex sync logic in the app
4. **Standard React patterns**: No custom state management needed
5. **shadcn/ui components**: Pre-built, accessible UI
6. **10-day build**: Realistic timeline for a dashboard

## Core Features Only

### What's In:
✅ Dashboard with KPIs from PostgreSQL
✅ Projects list with filtering
✅ Project details with invoices/bills
✅ User-managed estimates (CRUD)
✅ PDF/Excel export
✅ Clerk authentication
✅ Mobile responsive
✅ Display sync status

### What's Out:
❌ Complex admin panels
❌ User management (Clerk handles it)
❌ Direct Xero integration
❌ Real-time updates (not needed)
❌ Complex caching (DB is local)
❌ Audit logs (overkill for read-only)
❌ Multiple themes (just light mode)
❌ Notifications (not needed)

## Why This Approach Works

### Simple Architecture:
- **n8n** does the heavy lifting (Xero sync)
- **PostgreSQL** stores everything
- **Next.js** just displays data
- **Clerk** handles all auth complexity

### Fast Development:
- Use shadcn/ui components off the shelf
- Simple table queries, no complex joins
- Standard CRUD patterns
- No custom authentication code

### Easy Maintenance:
- Minimal dependencies
- Clear separation of concerns
- No complex state management
- Standard Next.js patterns

## Production Optimizations

### Database Performance:
- Use Server Components for direct DB queries (no API overhead for reads)
- Composite indexes on hot query paths
- Materialized views with proper unique indexes
- Read-only database role for security

### Export Handling:
- **Large files**: Use ExcelJS streaming mode
- **PDFs**: Server-side generation with PDFKit/pdf-lib
- Store temp files and return signed URLs
- Prevents blocking on large exports

### Sync Status UX:
- Display "Data as of [timestamp]" from `sync_status.completed_at`
- Disable manual sync trigger if job is RUNNING
- Implement cooldown period between manual syncs
- Clear visual feedback on data freshness


## Deployment Configuration

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'milestone-app',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '500M'
  }]
};
```

### Nginx Configuration
```nginx
upstream milestone_app {
    least_conn;
    server localhost:3000;
    server localhost:3001;
}

server {
    listen 443 ssl http2;
    server_name dashboard.innspiredaccountancy.com;

    location / {
        proxy_pass http://milestone_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Quick Start Guide

```bash
# 1. Clone and install
git clone [repo]
cd milestone-app
npm install

# 2. Setup environment
cp .env.example .env.local
# Add DATABASE_URL and Clerk keys

# 3. Setup database
npx drizzle-kit generate
npx drizzle-kit migrate

# 4. Run development
npm run dev

# 5. Build for production
npm run build
npm start
```


## Success Metrics

### Technical KPIs
- Page load time < 2 seconds (95th percentile)
- API response time < 500ms (95th percentile)
- System uptime > 99.9%
- Zero critical security vulnerabilities

### Business KPIs
- User adoption rate > 90% within 30 days
- Time to generate reports reduced by 80%
- Data accuracy improved to 99.9%
- User satisfaction score > 4.5/5

## Go-Live Checklist

### Pre-Launch (T-7 days)
- [ ] Production environment ready
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy tested
- [ ] Security scan completed

### Launch Day
- [ ] Database migrated
- [ ] Application deployed
- [ ] DNS updated
- [ ] Health checks passing
- [ ] User access configured

### Post-Launch (T+7 days)
- [ ] Performance metrics reviewed
- [ ] User feedback collected
- [ ] Issues logged and prioritized
- [ ] Documentation updated
- [ ] Training completed

## Team Responsibilities

### Development Team
- Frontend implementation (Next.js, React)
- Backend API development
- Database design and optimization
- Testing and bug fixes

### DevOps
- Infrastructure setup
- CI/CD pipeline
- Monitoring configuration
- Security hardening

### Project Manager
- Timeline management
- Stakeholder communication
- Risk management
- Resource allocation

### QA Team
- Test plan execution
- Bug reporting
- UAT coordination
- Performance testing

## Budget Estimate

```yaml
Infrastructure:
  Clerk Auth: $0 (free tier)
  Hosting: $0 (existing server)
  SSL: $0 (Let's Encrypt)
  Monitoring: $0 (self-hosted)
  Total: $0/month

Development:
  Initial Build: 160 hours
  Testing: 40 hours
  Deployment: 20 hours
  Documentation: 20 hours
  Total: 240 hours

Ongoing:
  Maintenance: 10 hours/month
  Support: 5 hours/month
  Updates: 5 hours/month
  Total: 20 hours/month
```

---

This project plan provides everything needed to migrate the Milestone P&L Dashboard from vanilla JavaScript to a modern Next.js application with full feature implementation.