# Milestone P&L Dashboard v2.0 - Implementation Guide

## Overview
This guide provides a comprehensive roadmap for building the Milestone P&L Dashboard from scratch. The application is a simplified, read-only dashboard that displays synchronized Xero data from a PostgreSQL database populated by n8n workflows.

## Architecture Summary
```
Xero API → n8n (sync) → PostgreSQL → Next.js Dashboard
```

The Next.js application:
- **NEVER** directly connects to Xero
- **READS** data from PostgreSQL (populated by n8n)
- **WRITES** only user estimates and preferences
- Uses Server Components for all data fetching
- Minimal API routes (only for mutations)

## Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Clerk
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Exports**: jsPDF + ExcelJS

## Implementation Phases

### [Phase 1: Project Initialization](./phase-1-project-initialization.md)
**Duration**: 2-3 hours

Sets up the Next.js 15 project with TypeScript, Tailwind CSS v4, and shadcn/ui. Establishes the simplified folder structure and configures development tools.

**Key Outcomes**:
- Next.js 15 app with App Router
- TypeScript configuration
- Tailwind CSS + shadcn/ui ready
- ESLint + Prettier configured
- Git repository initialized

---

### [Phase 2: Database Setup](./phase-2-database-setup.md)
**Duration**: 3-4 hours

Connects to PostgreSQL and implements the complete database schema with production improvements. Sets up Drizzle ORM with proper typing and migrations.

**Key Outcomes**:
- PostgreSQL connection established
- All tables created with proper indexes
- Materialized views configured
- Role-based security implemented
- Drizzle ORM configured

---

### [Phase 3: Authentication](./phase-3-authentication.md)
**Duration**: 2-3 hours

Implements Clerk authentication with middleware protection for routes. Creates sign-in/sign-up flows and session management.

**Key Outcomes**:
- Clerk authentication working
- Protected routes configured
- User session management
- Sign-in/sign-up pages
- Middleware protection active

---

### [Phase 4: Dashboard Implementation](./phase-4-dashboard-implementation.md)
**Duration**: 4-5 hours

Builds the main dashboard with Server Components, stats cards, and charts. Implements direct database queries for maximum performance.

**Key Outcomes**:
- Dashboard with KPI cards
- Revenue and profit charts
- Projects table
- Server Components for data fetching
- Responsive design

---

### [Phase 5: Project Features](./phase-5-project-features.md)
**Duration**: 4-5 hours

Creates project list and detail pages with estimates CRUD functionality. This is the only user-editable data in the system.

**Key Outcomes**:
- Projects list with filtering
- Project detail page
- Invoices/bills display (read-only)
- Estimates CRUD working
- Form validation

---

### [Phase 6: Export Functionality](./phase-6-export-functionality.md)
**Duration**: 3-4 hours

Implements server-side PDF and Excel export with streaming for large datasets. Uses efficient file generation techniques.

**Key Outcomes**:
- PDF export working
- Excel export with streaming
- Server-side file generation
- Progress indicators
- Large dataset support

---

### [Phase 7: Deployment](./phase-7-deployment.md)
**Duration**: 2-3 hours

Deploys the application using Coolify on Ubuntu server with Docker networking for secure database access.

**Key Outcomes**:
- Coolify deployment configured
- Docker internal_net network setup
- Application accessible at https://dashboard.innspiredaccountancy.com/milestone-app
- SSL certificates active
- Monitoring configured

---

## Total Timeline
**Development**: 8-10 days
**Testing**: 1-2 days
**Deployment**: 1 day

## Quick Start Commands

```bash
# Clone repository (after Phase 1)
git clone [your-repo]
cd milestone-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations (after Phase 2)
npm run db:migrate

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables Required

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/milestone"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Development
# Production: https://dashboard.innspiredaccountancy.com/milestone-app
```

## File Structure (Simplified)

```
milestone-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── projects/
│   │   └── api/
│   ├── components/
│   │   └── ui/
│   ├── lib/
│   │   ├── db.ts
│   │   └── queries.ts
│   └── types/
├── drizzle/
│   └── schema.ts
├── public/
└── [config files]
```

## Core Features Checklist

### Must Have (In Scope)
- [x] Dashboard with KPIs from PostgreSQL
- [x] Projects list with filtering
- [x] Project details with invoices/bills
- [x] User-managed estimates (CRUD)
- [x] PDF/Excel export
- [x] Clerk authentication
- [x] Mobile responsive
- [x] Display sync status

### Explicitly Out of Scope
- ❌ Direct Xero integration
- ❌ Complex admin panels
- ❌ User management (Clerk handles it)
- ❌ Real-time updates
- ❌ Complex caching
- ❌ Audit logs (minimal only)
- ❌ Multiple themes
- ❌ Notifications

## Key Design Decisions

1. **Server Components First**: Use Server Components for all data fetching to minimize client-side JavaScript
2. **Minimal API Routes**: Only 3-5 endpoints for mutations and exports
3. **No State Management**: React's built-in state is sufficient
4. **Read-Only Xero Data**: All Xero data is read-only from PostgreSQL
5. **Simple Architecture**: Just a glorified dashboard, no over-engineering

## Security Considerations

1. **Database**: App uses read-only role for Xero tables
2. **Authentication**: Clerk handles all auth complexity
3. **API Routes**: All protected by Clerk middleware
4. **Environment Variables**: Never expose sensitive keys
5. **SQL Injection**: Prevented by Drizzle ORM parameterized queries

## Performance Targets

- Page Load: < 2 seconds
- Dashboard Render: < 1.5 seconds
- Export Generation: < 5 seconds
- Database Queries: < 200ms

## Support & Troubleshooting

Common issues and solutions are documented in each phase guide. For production issues:

1. Check n8n workflow status for sync issues
2. Verify PostgreSQL connection
3. Review sync_status table for last update
4. Check application logs in PM2

## Next Steps

1. Start with [Phase 1: Project Initialization](./phase-1-project-initialization.md)
2. Follow each phase in sequence
3. Test thoroughly after each phase
4. Deploy only after all phases complete

---

*This implementation strictly follows the specifications in project-plan.md. Any deviation from the plan should be considered a critical failure.*