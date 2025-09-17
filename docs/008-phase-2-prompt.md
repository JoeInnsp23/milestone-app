# Phase 2: Database Setup & Configuration - Implementation Prompt

## Context Initialization
You are tasked with implementing Phase 2 of the Milestone P&L Dashboard project. This phase establishes the PostgreSQL database with Drizzle ORM, implementing the schema for Xero data synchronization via n8n.

## Pre-Implementation Requirements

### 1. Document Review
First, thoroughly read and understand these documents in this exact order:
1. `/root/projects/milestone-app/project-plan.md` - Understand n8n/Xero architecture
2. `/root/projects/milestone-app/phase-2-details.md` - Review database specification
3. `/root/projects/milestone-app/phase-2-tasks.md` - Study all 35 tasks (T036-T070)
4. `/root/projects/milestone-app/phase-2-QA.md` - Understand validation requirements

### 2. Context Building
Before starting implementation:
- Use `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs` to research:
  - Drizzle ORM with PostgreSQL
  - Drizzle Kit for migrations
  - PostgreSQL with Node.js
  - UUID usage in PostgreSQL
- Use WebSearch to find:
  - Drizzle ORM best practices
  - PostgreSQL schema design for multi-tenant SaaS
  - n8n webhook data structures
  - Database role-based security

### 3. Environment Check
Verify PostgreSQL availability:
```bash
# Check if PostgreSQL is installed locally or accessible
which psql || echo "PostgreSQL client not found"
```

## Implementation Instructions

### Phase 2 Task Execution (T036-T070)

**CRITICAL**: This phase requires a PostgreSQL database. Ensure you have:
- Database URL format: `postgresql://user:password@localhost:5432/milestone_local`
- For local development, you may need to set up PostgreSQL first

#### Task Groups:

**Dependency Installation (T036-T039):**
```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit @types/pg
npm install dotenv
```

**Schema Creation (T040-T055):**
Create schema in `src/db/schema.ts` (NOT src/lib/db/schema.ts):

Key requirements:
- ALL user-generated content uses UUID primary keys
- Xero-synced data uses string IDs (from Xero)
- Use `uuid('id').primaryKey().defaultRandom()` for:
  - estimates table
  - audit_log table
  - export_history table

Example schema structure:
```typescript
import { pgTable, uuid, text, timestamp, decimal, integer, varchar } from 'drizzle-orm/pg-core';

// Xero-synced table (string ID from Xero)
export const projects = pgTable('projects', {
  id: varchar('id', { length: 50 }).primaryKey(), // Xero ID
  user_id: text('user_id').notNull(), // Clerk user ID
  // ... other fields
});

// User-generated content (UUID)
export const estimates = pgTable('estimates', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: varchar('project_id', { length: 50 }).references(() => projects.id),
  // ... other fields
});
```

**Database Configuration (T056-T058):**
Create `src/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

**Migration Setup (T059-T062):**
Create `drizzle.config.ts` in project root:
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Database Initialization (T063-T066):**
```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate
```

**Webhook Endpoint (T067-T070):**
Create `/src/app/api/webhooks/n8n/route.ts`:
- Public endpoint (no auth required)
- Receives Xero data from n8n
- Updates projects, invoices, bills tables
- Use upsert operations for idempotency

### Important Schema Details:

#### Tables from n8n (Xero-synced):
- `projects` - Main project data
- `invoices` - Project invoices
- `bills` - Project bills
- `project_metrics` - Calculated metrics (materialized view)

#### User-generated tables:
- `estimates` - User-created estimates (UUID primary key)
- `audit_log` - Track all changes (UUID primary key)
- `export_history` - Track exports (UUID primary key)

#### Indexes needed:
```sql
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_bills_project ON bills(project_id);
CREATE INDEX idx_estimates_project ON estimates(project_id);
```

### Environment Setup:
Create/update `.env.local`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/milestone_local
```

## Quality Assurance Execution

After completing ALL tasks (T036-T070), execute the QA validation:

### Phase 2 QA Validation (QA051-QA100)

Critical QA checks:
- QA051-QA055: Package installation verification
- QA056-QA065: Schema validation (check UUID usage)
- QA066-QA075: Migration testing
- QA076-QA085: Database connection testing
- QA086-QA095: Webhook endpoint testing
- QA096-QA100: Final integration

### Test Commands:
```bash
# Test database connection
npm run db:studio

# Verify schema
npx drizzle-kit generate

# Test webhook endpoint (create test file first)
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Success Criteria
Phase 2 is complete when:
- [ ] All 35 tasks (T036-T070) completed
- [ ] All 50 QA checks (QA051-QA100) pass
- [ ] Database schema created with proper UUID usage
- [ ] Migrations run successfully
- [ ] Webhook endpoint accepts POST requests
- [ ] Drizzle Studio shows correct tables
- [ ] All indexes created
- [ ] Environment variables configured

## Common Issues & Solutions

1. **PostgreSQL not available:**
   - Document the issue
   - Use a connection string to a remote database if provided
   - Note: Docker internal_net will be configured in Phase 7

2. **Migration fails:**
   - Check DATABASE_URL is correct
   - Ensure PostgreSQL is running
   - Verify user has CREATE privileges

3. **UUID extension missing:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

## Verification Commands
```bash
# Check schema file exists
ls -la src/db/schema.ts

# Verify migrations generated
ls -la drizzle/

# Test database connection
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? 'DB URL set' : 'DB URL missing')"

# Run Drizzle Studio
npm run db:studio
```

## Critical Notes
- n8n handles ALL Xero integration - app NEVER connects to Xero directly
- n8n writes directly to PostgreSQL - NO webhooks needed in the app
- App has READ-ONLY access to Xero data (projects, invoices, bills)
- App has READ-WRITE access for user content (estimates, preferences)
- Use UUIDs for user-generated content ONLY
- Xero-synced data uses varchar IDs from Xero

Upon completion, Phase 2 should provide a complete database layer ready for authentication in Phase 3.