# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📊 Project Status

| Phase | Status | QA Results | Date Completed |
|-------|--------|------------|----------------|
| Phase 1: Next.js Setup | ✅ COMPLETE | 50/50 Passed | Sept 17, 2025 |
| Phase 2: Database | ⏳ Pending | - | - |
| Phase 3: Authentication | ⏳ Pending | - | - |
| Phase 4: Dashboard | ⏳ Pending | - | - |
| Phase 5: CRUD Features | ⏳ Pending | - | - |
| Phase 6: Export | ⏳ Pending | - | - |
| Phase 7: Deployment | ⏳ Pending | - | - |

## Project Overview

Milestone P&L Dashboard - A read-only dashboard for construction/professional services companies to track project profitability. Data flows from Xero → n8n → PostgreSQL → Next.js app (Clerk auth).

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm run start

# Database migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Architecture & Key Decisions

**Data Flow**: The app NEVER directly connects to Xero. All Xero data is read-only from PostgreSQL (populated by n8n webhooks). The app only writes user estimates and preferences.

**Stack**:
- Next.js 15 with App Router
- TypeScript
- PostgreSQL with Drizzle ORM
- Clerk for authentication
- Tailwind CSS v4 + shadcn/ui
- React Hot Toast for notifications (not Sonner)
- Server Components for all data fetching
- Minimal API routes (only for mutations)

**Folder Structure**:
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

## Implementation Phases

The project is structured in 7 phases (see docs/ folder):
1. **Phase 1**: Next.js setup with TypeScript and Tailwind ✅ **COMPLETE (50/50 QA passed)**
2. **Phase 2**: Database setup with Drizzle ORM
3. **Phase 3**: Clerk authentication integration
4. **Phase 4**: Dashboard implementation
5. **Phase 5**: Project features & estimates CRUD
6. **Phase 6**: Export functionality (PDF/Excel)
7. **Phase 7**: Production deployment with Coolify

## 🚨 CRITICAL: Phase Implementation Workflow

**YOU MUST FOLLOW THIS EXACT WORKFLOW FOR EACH PHASE:**

1. **Read the Prompt Document** (`docs/XXX-phase-N-prompt.md`)
   - Contains the complete implementation instructions
   - Specifies exact requirements and constraints

2. **Read the Details Document** (`docs/XXX-phase-N-details.md`)
   - Technical specifications
   - Architecture decisions
   - Component details

3. **Execute ALL Tasks** (`docs/XXX-phase-N-tasks.md`)
   - **CRITICAL**: Every task (T001, T002, etc.) MUST be completed
   - Tasks are ordered - complete them sequentially
   - DO NOT skip any tasks
   - Each task has dependencies - respect them

4. **Run Complete QA Validation** (`docs/XXX-phase-N-QA.md`)
   - Execute ALL QA items (QA001, QA002, etc.)
   - **QA CANNOT PASS until ALL items are complete**
   - Any failed QA item must be fixed before marking phase complete
   - Document all QA results

### Why This Matters:
- Previous Claude instances have missed tasks
- Skipping tasks causes QA failures
- Each phase builds on the previous one
- Incomplete phases compound into larger issues

### Phase Status:
- ✅ Phase 1: COMPLETE (50/50 QA items passed)
- ⏳ Phase 2-7: Pending

## Database Notes

- Use read-only database role for Xero tables
- Only write to estimates and user preference tables
- Materialized views for dashboard performance
- All queries through Drizzle ORM (parameterized for security)

## Production Environment

- **URL**: https://dashboard.innspiredaccountancy.com/milestone-app
- **Deployment**: Coolify on Ubuntu server
- **Database**: PostgreSQL in Docker with internal_net
- **SSL**: Handled by Coolify/reverse proxy

## Reference Materials

The `.reference/` directory contains:
- **MVP Screenshots**: Visual reference from the original dashboard (`Screenshot*.png`)
- **Legacy Implementation**: Original vanilla JavaScript code (`public/` subdirectory)
- **Scripts**: Deployment and caching scripts from the legacy system
- This directory is excluded from git for security/size reasons

## Important Constraints

- Server Components first approach - minimize client-side JavaScript
- No complex state management libraries - React's built-in state is sufficient
- Read-only for all Xero data
- User can only edit estimates and preferences
- Keep it simple - this is a dashboard, not a complex application