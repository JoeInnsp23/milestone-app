# CLAUDE.md - AI Assistant Guide

This file provides critical guidance to Claude Code (claude.ai/code) when working with this repository. **All information in this document is essential and must be followed exactly.**

# 🚨 CRITICAL BEHAVIOUR
 - **ALWAYS** use best practices never implement quick fixes
 - **ALWAYS** use context7 and websearch to double check syntax before programming
 - **ALWAYS** commit any code changes after finishing a task
 - **ALWAYS** use big.js for any calculaitons for the frontend

## 🚨 CRITICAL DATABASE INFORMATION

**Database Setup**: This application uses a **dedicated PostgreSQL container** completely separate from n8n's database.

```yaml
Container: milestone-postgres
Port: 5433 (exposed to host)
Database: milestone
User: milestone_user
Password: J22/+cGJpFZaLSffuzOymJIvke/whllGRGHMrW8n7ys=
Network: n8n_n8n-network (for inter-container communication)
```

**Connection Strings**:
- From Host (Next.js): `postgresql://milestone_user:[password]@localhost:5433/milestone`
- From Docker Network: `postgresql://milestone_user:[password]@milestone-postgres:5432/milestone`

**Database Management**:
- ✅ Can safely use `npm run db:push` - we have our own database
- ✅ Full control over schema and migrations
- ✅ No risk to n8n operations

## 📊 Project Status

| Phase | Status | QA Results | Date Completed |
|-------|--------|------------|----------------|
| Phase 1: Next.js Setup | ✅ COMPLETE | 50/50 Passed (100%) | Sept 17, 2025 |
| Phase 2: Database | ✅ COMPLETE | 48/50 Passed (100%) | Sept 17, 2025 |
| Phase 3: Authentication | ✅ COMPLETE | 51/51 Passed (100%) | Sept 18, 2025 |
| Phase 4: Dashboard | ✅ COMPLETE | 48/48 Passed (100%) | Sept 18, 2025 |
| Phase 5: CRUD Features | ✅ COMPLETE | 100% Complete | Sept 20, 2025 |
| Phase 6: Export | ✅ COMPLETE | 100% Complete | Sept 20, 2025 |
| Phase 7: UI Fixes | ✅ COMPLETE | 55/55 Passed (100%) | Sept 20, 2025 |
| Phase 8: Construction Phases | ⏳ Pending | - | - |
| Phase 9: Landing Page SEO | ⏳ Pending | - | - |
| Phase 99: Deployment | ⏳ Pending | - | - |

## 🎯 Project Overview

**Milestone P&L Dashboard** - A read-only dashboard for construction/professional services companies to track project profitability.

**Data Flow**:
```
Xero API → n8n (reads & writes) → PostgreSQL ← Next.js Dashboard (reads only)
```
- App NEVER directly connects to Xero
- n8n handles ALL Xero API interactions and database updates
- App has read-only access to Xero data in PostgreSQL
- App only writes user-generated content (estimates, preferences)

## 💻 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Database operations (safe with dedicated database)
npm run db:push      # Push schema to database
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio GUI
npm run db:seed      # Run seed data (comprehensive dataset with 50+ projects)
npm run db:seed:minimal  # Run minimal seed data (4 projects for testing)

# Docker operations
docker compose up -d     # Start PostgreSQL container
docker compose down      # Stop container
docker compose logs -f   # View logs
```

## 🏗️ Architecture & Key Decisions

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM (dedicated container)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Charts**: Recharts
- **Notifications**: React Hot Toast (NOT Sonner)
- **Deployment**: Coolify on Ubuntu server

### Key Architectural Decisions
1. **Server Components First**: Minimize client-side JavaScript
2. **No Complex State Management**: React's built-in state is sufficient
3. **Read-Only Xero Data**: All Xero data comes via n8n
4. **User Can Only Edit**: Estimates and preferences
5. **Keep It Simple**: This is a dashboard, not a complex application

### Folder Structure
```
src/
├── app/
│   ├── (authenticated)/    # Protected routes
│   ├── api/                # API routes (minimal, only for mutations)
│   └── actions/            # Server Actions
├── components/             # React components
├── db/                     # Database schema & config
├── lib/                    # Utility functions
└── types/                  # TypeScript types
```

## 🚨 CRITICAL: Phase Implementation Workflow

**YOU MUST FOLLOW THIS EXACT WORKFLOW FOR EACH PHASE:**

### 1. Read the Documents (in order)
   - `docs/XXX-phase-N-prompt.md` - Complete implementation instructions
   - `docs/XXX-phase-N-details.md` - Technical specifications
   - `docs/XXX-phase-N-tasks.md` - Task breakdown
   - `docs/XXX-phase-N-QA.md` - QA validation items

### 2. Execute ALL Tasks
   - **CRITICAL**: Every task (T001, T002, etc.) MUST be completed
   - Tasks are ordered - complete them sequentially
   - DO NOT skip any tasks
   - Update task status in the markdown file as you complete them

### 3. Run Complete QA Validation
   - Execute ALL QA items (QA001, QA002, etc.)
   - QA CANNOT PASS until ALL items are complete
   - Any failed QA item must be fixed before marking phase complete
   - Update QA status in the QA markdown file as you complete them

### Why This Matters
- Previous Claude instances have missed tasks
- Skipping tasks causes QA failures
- Each phase builds on the previous one
- Incomplete phases compound into larger issues

## 📋 Implementation Phases

1. **Phase 1**: Next.js setup with TypeScript and Tailwind ✅ **COMPLETE**
2. **Phase 2**: Database setup with Drizzle ORM ✅ **COMPLETE**
   - All tables, views, and functions created
   - Seed data loaded
   - Note: Webhook tasks (T060-T062) not needed - n8n writes directly to DB
3. **Phase 3**: Clerk authentication integration ✅ **COMPLETE**
   - Middleware protecting routes
   - Custom sign-in page with gradients
   - Invite-only configuration (no sign-up)
   - Fixed critical Edge Runtime "self is not defined" error
4. **Phase 4**: Dashboard implementation ✅ **COMPLETE**
   - All KPI cards implemented with real-time data
   - Revenue distribution donut chart
   - Monthly revenue trend line chart
   - Profit by project bar chart
   - Projects table with all metrics
   - Full Clerk theme integration
5. **Phase 5**: Project features & estimates CRUD ✅ **COMPLETE**
   - Full CRUD operations for project estimates
   - Versioning system implemented
   - Form validation and error handling
6. **Phase 6**: Export functionality (PDF/Excel) ✅ **COMPLETE**
   - PDF export with formatting
   - Excel export with multiple sheets
   - Export history tracking
7. **Phase 7**: Frontend UI fixes and data validation ✅ **COMPLETE**
   - All UI consistency issues resolved
   - Dark mode improvements
   - Input validation enhanced
8. **Phase 8**: Construction Phases Feature
   - 17 specific construction phases tracking
   - Phase summary table with Excel-like cost tracking
   - Manual phase assignment for invoices/bills/estimates
   - Progress tracking with ±5% adjustments
   - Webhook integration for n8n synchronization
9. **Phase 9**: Landing Page SEO Optimization
   - Technical SEO with meta tags and structured data
   - UK construction/accountancy keyword targeting
   - Location-based landing pages for UK cities
   - Blog and case study content system
   - Strategic backlinks to innspiredaccountancy domains
99. **Phase 99**: Production deployment with Coolify

## 🗄️ Database Schema Overview

### Xero-Synced Tables (varchar IDs from Xero)
- `projects` - Project data from Xero
- `invoices` - Invoice data from Xero
- `bills` - Bill/expense data from Xero
- `build_phases` - Build phase categories from Xero

### User-Generated Tables (UUID primary keys)
- `project_estimates` - User-created estimates with versioning
- `audit_logs` - Minimal audit trail for changes
- `export_history` - Export tracking
- `user_preferences` - User settings

### Performance Optimizations
- Materialized view: `project_phase_summary` for dashboard
- Auto-update triggers for `updated_at` columns
- Strategic indexes for hot query paths
- Partial unique indexes for estimate versioning

## 🔒 Security & Best Practices

### Database Security
- Parameterized queries through Drizzle ORM
- Role-based access control (when deployed)
- No direct Xero API access from app
- SSL/TLS in production

### Code Standards
- **DO NOT ADD COMMENTS** unless specifically requested
- Follow existing code conventions
- Use existing libraries and utilities
- Check neighboring files for patterns
- Never commit secrets or keys

## 🌐 Production Environment

- **URL**: https://dashboard.innspiredaccountancy.com/milestone-app
- **Deployment**: Coolify on Ubuntu server
- **Database**: PostgreSQL in Docker
- **SSL**: Handled by Coolify/reverse proxy

## 📚 Reference Materials

The `.reference/` directory contains:
- MVP Screenshots from original dashboard
- Legacy implementation code
- This directory is excluded from git

## ⚠️ Important Constraints

1. **Never directly connect to Xero** - all data via n8n
2. **Read-only for Xero data** - only n8n writes these tables
3. **User can only edit** - estimates and preferences
4. **Use Server Components** - minimize client JavaScript
5. **No unnecessary documentation** - only create docs when requested

## 🎯 Success Criteria

- Sub-2 second page load times
- 100% data accuracy from PostgreSQL
- GDPR compliance ready
- All QA items passing before phase completion
- Clean, maintainable code following patterns

---

**Remember**: This is a focused dashboard application, not a complex system. Keep implementations simple and follow the established patterns.