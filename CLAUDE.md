# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
1. **Phase 1**: Next.js setup with TypeScript and Tailwind
2. **Phase 2**: Database setup with Drizzle ORM
3. **Phase 3**: Clerk authentication integration
4. **Phase 4**: Dashboard implementation
5. **Phase 5**: Project features & estimates CRUD
6. **Phase 6**: Export functionality (PDF/Excel)
7. **Phase 7**: Production deployment with Coolify

Each phase has detailed documentation in `docs/` with tasks and QA checklists.

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

## Important Constraints

- Server Components first approach - minimize client-side JavaScript
- No complex state management libraries - React's built-in state is sufficient
- Read-only for all Xero data
- User can only edit estimates and preferences
- Keep it simple - this is a dashboard, not a complex application