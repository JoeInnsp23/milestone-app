# Phase 2: Database Setup - Task Breakdown

## Overview
Complete task-oriented breakdown for setting up PostgreSQL database, Drizzle ORM, and implementing the schema for n8n data synchronization.

## Prerequisites Check
**T031-Database Prerequisites**: ✅ Verify database requirements
- Check PostgreSQL availability (local or cloud)
- Verify database connection credentials
- Check n8n webhook access (if available)
- Confirm Phase 1 completion
- Dependencies: Phase 1 Complete
- Estimated Time: 5 minutes

## PostgreSQL Setup Tasks

**T032-Install PostgreSQL Locally**: ✅ Set up local PostgreSQL (if needed)
- Install PostgreSQL 15+
- Create database user
- Set user password
- Create milestone database
- Dependencies: T031
- Estimated Time: 15 minutes

**T033-Test Database Connection**: ✅ Verify PostgreSQL access
- Connect using psql or GUI tool
- Verify database exists
- Check user permissions
- Test remote access (if applicable)
- Dependencies: T032
- Estimated Time: 5 minutes

## Drizzle ORM Installation

**T034-Install Drizzle Dependencies**: ✅ Add Drizzle packages
- Install `drizzle-orm`
- Install `@types/pg`
- Install `postgres` driver
- Install `drizzle-kit` as dev dependency
- Dependencies: T033
- Estimated Time: 3 minutes

**T035-Install Additional Dependencies**: ✅ Add supporting packages
- Install `dotenv` for environment variables
- Install `zod` for validation
- Install date utilities
- Dependencies: T034
- Estimated Time: 2 minutes

## Environment Configuration

**T036-Configure Database Environment**: ✅ Set up connection strings
- Update `.env.local` with DATABASE_URL
- Add DATABASE_POOL_SIZE variable
- Add DATABASE_SSL_MODE variable
- Update `.env.example` with placeholders
- Dependencies: T035
- Estimated Time: 3 minutes

**T037-Create Drizzle Config**: ✅ Set up Drizzle configuration
- Create `drizzle.config.ts`
- Configure schema path
- Set output directory for migrations
- Configure database connection
- Dependencies: T036
- Estimated Time: 5 minutes

## Schema Definition Tasks

**T038-Create Schema Directory**: ✅ Set up schema structure
- Create `src/db/` directory
- Create `src/db/schema.ts` file for complete schema
- Create `drizzle/migrations/` directory for migrations
- Dependencies: T037
- Estimated Time: 1 minute

**T039-Define Schema and Enums**: ✅ Create schema foundation
- Create `src/db/schema.ts`
- Define milestone schema
- Create status enums (invoice, bill, estimate, etc.)
- Define type enums for categorization
- Dependencies: T038
- Estimated Time: 5 minutes

**T040-Define Projects Schema**: ✅ Create projects table schema
- Add projects table to schema.ts
- Use varchar IDs (Xero managed)
- Add all tracking fields
- Add indexes for active and client queries
- Mark as read-only from app perspective
- Dependencies: T039
- Estimated Time: 10 minutes

**T041-Define Invoices Schema**: ✅ Create invoices table schema
- Add invoices table to schema.ts
- Use varchar IDs (Xero managed)
- Add foreign keys to projects and phases
- Add performance indexes for hot paths
- Mark as read-only from app perspective
- Dependencies: T040
- Estimated Time: 8 minutes

**T042-Define Bills Schema**: ✅ Create bills table schema
- Add bills table to schema.ts
- Use varchar IDs (Xero managed)
- Add foreign keys to projects and phases
- Add performance indexes for hot paths
- Mark as read-only from app perspective
- Dependencies: T041
- Estimated Time: 8 minutes

**T043-Define Estimates Schema**: ✅ Create estimates table schema
- Add project_estimates table to schema.ts
- Use UUID primary keys (user-generated content)
- Add partial unique index for versioning
- Add valid_from/valid_until for history
- Mark as read-write for app
- Dependencies: T042
- Estimated Time: 5 minutes

**T044-Add Supporting Tables**: ✅ Create audit and preference tables
- Add minimal audit_logs table (UUIDs)
- Add user_preferences table
- Add export_history table (UUIDs)
- Add sync_status table (n8n managed)
- Dependencies: T043
- Estimated Time: 8 minutes

## Database Views and Functions

**T045-Create Metrics View**: ✅ Define project_phase_summary materialized view
- Create SQL for materialized view
- Calculate revenue and cost by project/phase
- Calculate profit margins
- Add unique index for concurrent refresh
- Create refresh function
- Dependencies: T044
- Estimated Time: 10 minutes

**T046-Create Database Roles**: ✅ Set up role-based security
- Create milestone_app role
- Grant SELECT on Xero tables
- Grant full CRUD on user tables
- Grant sequence usage for UUIDs
- Set up default privileges
- Dependencies: T045
- Estimated Time: 8 minutes

**T047-Create Update Triggers**: ✅ Add automatic timestamp triggers
- Create touch_updated_at function
- Apply triggers to all tables with updated_at
- Test trigger functionality
- Add tracking_config table for n8n
- Dependencies: T046
- Estimated Time: 10 minutes

## Database Client Setup

**T048-Create Database Connection**: ✅ Set up Drizzle client
- Create `src/lib/db.ts`
- Configure postgres.js connection pool
- Import schema from @/db/schema
- Export db instance and schema
- Dependencies: T047
- Estimated Time: 5 minutes

**T049-Create Connection Helper**: ✅ Add connection utilities
- Create retry logic for connections
- Add connection health check
- Add connection error handling
- Dependencies: T048
- Estimated Time: 5 minutes

## Query Functions Implementation

**T050-Create Base Queries**: ✅ Implement core query functions
- Create `src/lib/queries.ts`
- Add getDashboardStats function
- Add getProjectSummaries function
- Add type-safe return types
- Dependencies: T049
- Estimated Time: 10 minutes

**T051-Create Project Queries**: ✅ Add project-specific queries
- Add getProjects function
- Add getProjectById function
- Add getProjectWithDetails function
- Add filtering and sorting
- Dependencies: T050
- Estimated Time: 8 minutes

**T052-Create Invoice Queries**: ✅ Add invoice query functions
- Add getInvoicesByProject function
- Add getPendingInvoices function
- Add getOverdueInvoices function
- Dependencies: T051
- Estimated Time: 8 minutes

**T053-Create Bill Queries**: ✅ Add bill query functions
- Add getBillsByProject function
- Add getUnpaidBills function
- Add bill aggregation queries
- Dependencies: T052
- Estimated Time: 8 minutes

**T054-Create Estimate Queries**: ✅ Add estimate CRUD queries
- Add createEstimate with UUID and audit logging
- Add updateEstimate with audit logging
- Add soft delete with valid_until
- Handle partial unique constraint for versions
- Dependencies: T053
- Estimated Time: 10 minutes

## Migration Tasks

**T055-Generate Initial Schema**: ✅ Create database schema
- Run `npm run db:push`
- Verify schema created in PostgreSQL
- Check milestone schema exists
- Review all tables created
- Dependencies: T054
- Estimated Time: 5 minutes

**T056-Apply Production SQL**: ✅ Run production improvements
- Create production-improvements.sql
- Apply triggers and views
- Set up roles and permissions
- Create refresh function
- Dependencies: T055
- Estimated Time: 5 minutes

**T057-Verify Schema**: ✅ Confirm database structure
- Connect to database
- List all tables
- Check table structures
- Verify relationships
- Dependencies: T056
- Estimated Time: 5 minutes

## Seed Data Tasks

**T058-Create Seed Script**: ✅ Build data seeding script
- Create `src/db/seed.ts`
- Add sample projects (Xero IDs)
- Add sample build phases
- Add sample invoices/bills
- Add sync status record
- Dependencies: T057
- Estimated Time: 15 minutes

**T059-Run Seed Script**: ⏳ Populate test data (pending)
- Execute seed script
- Verify data inserted
- Check data relationships
- Test query functions
- Dependencies: T058
- Estimated Time: 5 minutes

## n8n Integration Setup

**NOTE: Tasks T060-T062 are NOT NEEDED**
- n8n writes directly to PostgreSQL
- The Milestone app does NOT receive webhooks
- The app only reads data that n8n has already written to the database

**T060-Create Webhook Schema**: ❌ NOT NEEDED
- n8n handles all data transformation and writes directly to PostgreSQL

**T061-Create Sync Functions**: ❌ NOT NEEDED
- n8n handles all synchronization directly with the database

**T062-Create Webhook Handler**: ❌ NOT NEEDED
- The app does not receive webhooks from n8n

## Testing Tasks

**T063-Test Database Queries**: ✅ Verify all queries work
- Test getDashboardStats
- Test project queries
- Test invoice/bill queries
- Test estimate CRUD
- Dependencies: T062
- Estimated Time: 10 minutes

**T064-Test Data Relationships**: ✅ Verify foreign keys
- Test cascade deletes
- Test orphan prevention
- Test referential integrity
- Dependencies: T063
- Estimated Time: 5 minutes

**T065-Performance Testing**: ✅ Check query performance
- Test with large datasets
- Check index usage
- Optimize slow queries
- Dependencies: T064
- Estimated Time: 10 minutes

## Documentation Tasks

**T066-Document Schema**: ✅ Create schema documentation (DATABASE.md)
- Document table structures
- Document relationships
- Document indexes and views
- Add query examples
- Dependencies: T065
- Estimated Time: 10 minutes

**T067-Create Migration Guide**: ✅ Document migration process
- Add migration commands
- Document rollback process
- Add troubleshooting guide
- Dependencies: T066
- Estimated Time: 5 minutes

## Final Verification

**T068-Integration Test**: ✅ Test with Phase 1
- Create test page using queries
- Display data from database
- Verify TypeScript types
- Check error handling
- Dependencies: T067
- Estimated Time: 10 minutes

**T069-Backup Configuration**: ✅ Set up backup strategy
- Document backup commands
- Create backup script
- Test restore process
- Dependencies: T068
- Estimated Time: 8 minutes

**T070-Phase Completion Check**: ✅ Final verification
- Review all schemas created
- Verify all queries functional
- Check n8n integration ready
- Commit database setup
- Dependencies: T069
- Estimated Time: 5 minutes

---

## Summary
- Total Tasks: 40 (T031-T070)
- Estimated Total Time: 5-6 hours
- Critical Path: T031 → T032-T033 → T034-T037 → T038-T044 → T055-T057 → T058-T070

## Success Criteria
- [ ] PostgreSQL database configured and accessible
- [ ] Drizzle ORM installed and configured
- [ ] All tables created with proper schemas
- [ ] Materialized views and triggers working
- [ ] Query functions implemented and tested
- [ ] Seed data available for testing
- [ ] n8n has direct database access configured
- [ ] All TypeScript types properly defined