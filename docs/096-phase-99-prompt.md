# Phase 99: Production Deployment with Coolify - Implementation Prompt

## Context Initialization
You are tasked with implementing Phase 99 of the Milestone P&L Dashboard project. This phase deploys the application to production using Coolify on an Ubuntu server with Docker internal_net networking.

## Pre-Implementation Requirements

### 1. Document Review
First, thoroughly read and understand these documents in this exact order:
1. `/root/projects/milestone-app/project-plan.md` - Review deployment architecture
2. `/root/projects/milestone-app/phase-99-details.md` - Deployment specification with Coolify
3. `/root/projects/milestone-app/phase-99-tasks.md` - Study all 57 tasks (T900-T956)
4. `/root/projects/milestone-app/phase-99-QA.md` - Understand validation requirements

### 2. Context Building
Before starting implementation:
- Use WebSearch to find:
  - Coolify deployment documentation
  - Docker internal networking best practices
  - PostgreSQL in Docker containers
  - Next.js production optimization
  - Subdirectory deployment with basePath

### 3. Infrastructure Understanding
**CRITICAL**: Understand the deployment architecture:
- Coolify manages deployments on Ubuntu server
- PostgreSQL runs in Docker container
- internal_net provides secure database access
- NO external database exposure
- Production URL: dashboard.innspiredaccountancy.com/milestone-app

## Server Prerequisites

This phase requires access to:
1. Ubuntu server with Coolify installed
2. PostgreSQL running in Docker
3. Docker internal_net network configured
4. Domain pointing to server

**Note**: If server access is not available, complete all preparation tasks and document the deployment steps.

## Implementation Instructions

### Phase 99 Task Execution (T900-T956)

#### Infrastructure Verification (T901-T903):
```bash
# If you have SSH access:
ssh user@server

# Check Coolify status
docker ps | grep coolify

# Verify internal_net exists
docker network ls | grep internal_net

# Find PostgreSQL container
docker ps | grep postgres
```

If no server access, document these checks for the DevOps team.

#### Database Setup (T278-T281):
```sql
-- Database creation script
-- Save as: scripts/production-db-setup.sql

-- Create database and user
CREATE DATABASE milestone_db;
CREATE USER milestone_app WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE milestone_db TO milestone_app;

-- Enable UUID extension
\c milestone_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema
CREATE SCHEMA IF NOT EXISTS milestone;
GRANT ALL ON SCHEMA milestone TO milestone_app;

-- Create read-only role for n8n
CREATE ROLE xero_reader;
GRANT USAGE ON SCHEMA milestone TO xero_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA milestone TO xero_reader;
GRANT xero_reader TO milestone_app;

-- Performance indexes
CREATE INDEX CONCURRENTLY idx_projects_user_status ON projects(user_id, status);
CREATE INDEX CONCURRENTLY idx_invoices_project_date ON invoices(project_id, issue_date);
CREATE INDEX CONCURRENTLY idx_bills_project_date ON bills(project_id, date);
CREATE INDEX CONCURRENTLY idx_estimates_project ON estimates(project_id);
```

#### Environment Configuration (T282-T284):
Create `.env.production`:
```env
# Database - using Docker internal hostname
DATABASE_URL=postgresql://milestone_app:password@postgres-container:5432/milestone_db

# Clerk Production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/milestone-app/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/milestone-app/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/milestone-app/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/milestone-app/dashboard

# Application
NEXT_PUBLIC_APP_URL=https://dashboard.innspiredaccountancy.com/milestone-app
NODE_ENV=production
NEXT_PUBLIC_BASE_PATH=/milestone-app
```

#### Coolify Application Setup (T285-T288):

**In Coolify Dashboard:**
1. Create New Application
2. Source: GitHub
3. Repository: milestone-app
4. Branch: main
5. Auto-deploy: Enabled

**Docker Network Configuration:**
```yaml
# Coolify configuration
Networks:
  - internal_net

Environment Variables:
  # Add all from .env.production
  # DATABASE_URL uses internal hostname

Build Configuration:
  Install Command: npm ci --production=false
  Build Command: npm run build
  Start Command: npm run start
  Health Check: /milestone-app/api/health
```

#### Production Configuration Files:

**next.config.mjs Updates (T286):**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production subdirectory deployment
  basePath: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',

  // Standalone output for Docker
  output: 'standalone',

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ];
  },

  // Image optimization
  images: {
    domains: ['img.clerk.com'],
    unoptimized: true, // For self-hosted
  },
};

export default nextConfig;
```

**Dockerfile (if custom build needed):**
```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ARG NEXT_PUBLIC_BASE_PATH=/milestone-app
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Simple Monitoring Setup (T293-T295):

**Logger Implementation:**
```typescript
// src/lib/logger.ts
export class Logger {
  static error(message: string, error?: any) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error?.stack || error
    }));
  }

  static info(message: string, meta?: any) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...meta
    }));
  }
}
```

**Health Check Endpoint:**
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
```

#### Deployment Scripts (T297-T301):

**Pre-deployment Script:**
```bash
#!/bin/bash
# scripts/pre-deploy.sh

echo "Running pre-deployment checks..."

# Type checking
npm run type-check || exit 1

# Linting
npm run lint || exit 1

# Build test
npm run build || exit 1

echo "✅ All checks passed!"
```

**Database Backup Script (T308):**
```bash
#!/bin/bash
# scripts/backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="postgres-container"
BACKUP_FILE="/backups/milestone_backup_${TIMESTAMP}.sql"

# Create backup from Docker container
docker exec $CONTAINER_NAME pg_dump -U postgres milestone_db > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

echo "Backup completed: ${BACKUP_FILE}.gz"
```

#### Simple Admin Dashboard (T295):
```typescript
// src/app/admin/page.tsx
import { auth } from "@clerk/nextjs";

export default async function AdminDashboard() {
  const { userId } = auth();

  // Simple admin check
  if (!userId || !process.env.ADMIN_USER_IDS?.includes(userId)) {
    return <div>Unauthorized</div>;
  }

  const stats = await db.query`
    SELECT
      (SELECT COUNT(*) FROM projects) as projects,
      (SELECT COUNT(*) FROM estimates) as estimates,
      (SELECT COUNT(DISTINCT user_id) FROM projects) as users
  `;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p>Total Projects</p>
            <p className="text-2xl">{stats.projects}</p>
          </CardContent>
        </Card>
        {/* More cards... */}
      </div>
      <p className="mt-6 text-gray-600">
        View detailed metrics in Coolify dashboard
      </p>
    </div>
  );
}
```

### Deployment Process (T325-T327):

1. **Push to GitHub:**
```bash
git add .
git commit -m "feat: prepare for Coolify deployment"
git push origin main
```

2. **Coolify Auto-Deploy:**
- Monitors main branch
- Triggers build automatically
- Deploys container
- Runs health checks

3. **Verify Deployment:**
```bash
# Test production URL
curl https://dashboard.innspiredaccountancy.com/milestone-app/api/health

# Check application
# Visit: https://dashboard.innspiredaccountancy.com/milestone-app
```

## Quality Assurance Execution

After completing ALL tasks (T274-T330), execute the QA validation:

### Phase 7 QA Validation (QA301-QA350)

Critical QA checks:
- QA301-QA309: Build and environment validation
- QA310-QA317: Coolify configuration testing
- QA318-QA329: Performance and monitoring
- QA330-QA339: Database and backups
- QA340-QA350: Final production validation

### Production Testing Checklist:
```bash
# 1. Access Testing
- Visit https://dashboard.innspiredaccountancy.com/milestone-app
- Verify redirect to sign-in
- Complete authentication flow
- Access dashboard

# 2. Functionality Testing
- Test all CRUD operations
- Verify export functionality
- Check data accuracy
- Test responsiveness

# 3. Performance Testing
- Monitor response times
- Check memory usage in Coolify
- Verify no memory leaks
- Test with concurrent users

# 4. Security Testing
- Verify HTTPS only
- Check security headers
- Test rate limiting
- Verify database isolation
```

## Success Criteria
Phase 7 is complete when:
- [ ] All 57 tasks (T274-T330) completed
- [ ] All 50 QA checks (QA301-QA350) pass
- [ ] Application deployed via Coolify
- [ ] Accessible at /milestone-app subdirectory
- [ ] Database connected via internal_net
- [ ] Auto-deploy from GitHub working
- [ ] Health checks passing
- [ ] Basic monitoring active
- [ ] Backup script created
- [ ] Production stable

## Common Issues & Solutions

1. **Database connection failing:**
   - Verify internal_net network
   - Check container names
   - Ensure no external exposure
   - Test with docker exec

2. **Subdirectory routing broken:**
   - Check basePath in next.config.mjs
   - Verify environment variables
   - Clear Next.js cache
   - Check Coolify path configuration

3. **Container memory issues:**
   - Set memory limit to 1GB
   - Monitor in Coolify dashboard
   - Optimize bundle size
   - Enable swap if needed

4. **SSL certificate issues:**
   - Verify domain DNS
   - Check Coolify SSL settings
   - Ensure port 443 open

## Verification Commands
```bash
# Check production build
npm run build
NODE_ENV=production npm run start

# Test health endpoint locally
curl http://localhost:3000/api/health

# Verify Docker setup
docker network inspect internal_net
docker ps | grep milestone

# Check logs in Coolify
# Access Coolify dashboard → Application → Logs
```

## Critical Notes
- DO NOT expose database externally
- DO NOT skip security headers
- DO NOT use complex monitoring (keep simple)
- DO NOT forget basePath configuration
- Keep deployment simple for 3-5 users
- Use Coolify's built-in features

## Post-Deployment

Once deployed:
1. Monitor Coolify dashboard for 24 hours
2. Check container resource usage
3. Verify backup script runs daily
4. Document any issues
5. Create runbook for operations team

Upon completion, Phase 7 delivers a production-ready application deployed via Coolify with secure database access, automated deployments, and basic monitoring suitable for 3-5 users.