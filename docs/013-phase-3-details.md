# Phase 3: Authentication Setup

## Overview
This phase implements Clerk authentication with middleware protection for routes. We'll create sign-in/sign-up pages styled to match the MVP's design, configure session management, and ensure all protected routes are secured.

## UI Reference from Existing MVP
The authentication pages should maintain consistency with the MVP's design:
- **Background**: Blue gradient theme consistent with dashboard (see `.reference/public/css/dashboard.css`)
- **Layout**: Centered authentication card with subtle shadow
- **Typography**: Clean, modern font stack
- **Color Scheme**: Blue primary colors with proper contrast

## Prerequisites
- Phase 1 and Phase 2 completed successfully
- Clerk account created at [clerk.com](https://clerk.com)
- Application created in Clerk Dashboard

## Step 1: Create Clerk Account and Application

### 1.1 Sign Up for Clerk

1. Go to [clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application
4. Choose "Next.js" as your framework
5. Name your application "Milestone Dashboard"

### 1.2 Get API Keys

From the Clerk Dashboard:
1. Navigate to "API Keys"
2. Copy the Publishable Key (starts with `pk_`)
3. Copy the Secret Key (starts with `sk_`)

## Step 2: Install Clerk Dependencies

### 2.1 Install Packages

```bash
npm install @clerk/nextjs @clerk/themes
```

## Step 3: Configure Environment Variables

### 3.1 Update .env.local

```env
# Database (from Phase 2)
DATABASE_URL="postgresql://postgres:password@localhost:5432/milestone"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-key-here"
CLERK_SECRET_KEY="sk_test_your-secret-key-here"

# Clerk URLs (required for subdirectory deployment)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/milestone-app/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/milestone-app/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/milestone-app/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/milestone-app/dashboard"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_PATH="/milestone-app"  # For production subdirectory
NODE_ENV="development"
```

## Step 4: Configure Next.js for Subdirectory Deployment

### 4.1 Update next.config.mjs

Update `next.config.mjs` to handle subdirectory deployment:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // For production deployment at /milestone-app
  basePath: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
}

export default nextConfig
```

## Step 5: Configure Clerk Provider

### 5.1 Update Root Layout

Update `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Milestone P&L Dashboard',
  description: 'Project profitability and invoice tracking dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

## Step 6: Create Middleware for Route Protection

### 5.1 Create Middleware

Create `src/middleware.ts`:

```typescript
import { authMiddleware } from '@clerk/nextjs/server'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    `${basePath}/`,
    `${basePath}/sign-in`,
    `${basePath}/sign-up`,
    '/api/webhooks/n8n',  // n8n webhook for data sync
  ],
  // Skip Clerk auth for n8n webhooks
  ignoredRoutes: [
    '/api/webhooks/n8n',
  ],
  afterAuth(auth, req) {
    // Log successful sign-ins for audit trail
    if (auth.userId && auth.sessionId && req.nextUrl.pathname === `${basePath}/dashboard`) {
      // This runs after successful authentication
      // Actual logging will be done in dashboard page to avoid middleware complexity
    }
  },
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

## Step 7: Create Sign-In Page

### 7.1 Create Sign-In Component

Create `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    // Using gradient background from .reference/public/css/dashboard.css
    <div className="flex min-h-screen items-center justify-center gradient-bg-light dark:gradient-bg-dark">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Milestone Dashboard
          </h1>
          <p className="mt-2 text-sm text-white/90">
            Sign in to access your project dashboard
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                'bg-accent hover:bg-accent/90 text-white',
              card: 'shadow-2xl bg-white/95 backdrop-blur',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              formFieldInput: 'bg-white',
              footerActionLink: 'text-blue-600 hover:text-blue-700',
            },
            layout: {
              socialButtonsVariant: 'iconButton',
              socialButtonsPlacement: 'bottom',
            },
          }}
          redirectUrl="/milestone-app/dashboard"
        />
      </div>
    </div>
  )
}
```

## Step 8: Create Sign-Up Page

### 8.1 Create Sign-Up Component

Create `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    // Using gradient background from .reference/public/css/dashboard.css
    <div className="flex min-h-screen items-center justify-center gradient-bg-light dark:gradient-bg-dark">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-white/90">
            Sign up to get started with Milestone Dashboard
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                'bg-accent hover:bg-accent/90 text-white',
              card: 'shadow-2xl bg-white/95 backdrop-blur',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              formFieldInput: 'bg-white',
              footerActionLink: 'text-blue-600 hover:text-blue-700',
            },
            layout: {
              socialButtonsVariant: 'iconButton',
              socialButtonsPlacement: 'bottom',
            },
          }}
          redirectUrl="/milestone-app/dashboard"
        />
      </div>
    </div>
  )
}
```

## Step 9: Create Navigation Header Component

### 9.1 Create Header with User Button

**Note**: Based on Next.js 15 best practices, we use route groups `(auth)` and `(protected)` to organize routes without affecting URLs. This is the recommended approach for separating public and protected routes.

Create `src/components/nav-header.tsx`:

```typescript
'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FolderOpen,
  RefreshCw,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const navItems: NavItem[] = [
  {
    href: `${basePath}/dashboard`,
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: `${basePath}/projects`,
    label: 'Projects',
    icon: FolderOpen,
  },
]

export function NavHeader() {
  const pathname = usePathname()
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Fetch last sync time from n8n populated database
    fetch(`${basePath}/api/sync-status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.lastSync) {
          setLastSync(new Date(data.lastSync))
        }
      })
      .catch(console.error)
  }, [])

  const formatLastSync = () => {
    if (!lastSync) return 'Never synced'

    const now = new Date()
    const diff = now.getTime() - lastSync.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <div className="mr-4 flex md:mr-8">
          <Link href={`${basePath}/dashboard`} className="flex items-center space-x-2">
            <span className="text-xl font-bold">Milestone</span>
          </Link>
        </div>

        {/* Navigation - Responsive without complex mobile menu */}
        <nav className="flex flex-1 items-center space-x-4 md:space-x-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-1 md:space-x-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right side items */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Sync Status */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            <span>Last sync: {formatLastSync()}</span>
          </div>

          {/* User Button */}
          <UserButton
            afterSignOutUrl={`${basePath}/`}
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}
```

### 9.2 No Additional UI Components Needed

We're keeping it simple - no complex mobile menus or sheets needed for 3-5 users.

## Step 10: Create Protected Layout

### 10.1 Create Dashboard Layout

Create `src/app/(protected)/layout.tsx`:

**Note**: The `(protected)` folder is a route group that doesn't affect URLs but keeps all protected routes organized together.

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { NavHeader } from '@/components/nav-header'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  if (!userId) {
    redirect(`${basePath}/sign-in`)
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <div className="container py-6">
        {children}
      </div>
    </div>
  )
}
```

## Step 11: Update Home Page with Auth Check

### 11.1 Update Home Page

Update `src/app/page.tsx`:

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const { userId } = auth()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  if (userId) {
    redirect(`${basePath}/dashboard`)
  }

  // Simple landing page - just redirect to sign-in
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Milestone P&L Dashboard</h1>
        <p className="mt-4 text-gray-600">
          Track project profitability with real-time Xero data
        </p>
        <div className="mt-8 space-x-4">
          <Link href={`${basePath}/sign-in`}>
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href={`${basePath}/sign-up`}>
            <Button variant="outline" size="lg">Sign Up</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

## Step 12: Create Dashboard Placeholder with Login Audit

### 12.1 Create Dashboard Page with Audit Logging

Create `src/app/(protected)/dashboard/page.tsx`:

```typescript
import { auth, currentUser } from '@clerk/nextjs/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAuditLog } from '@/lib/queries'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const { userId } = auth()
  const user = await currentUser()

  // Check if this is a new login (simple session tracking)
  const sessionCookie = cookies().get('last_audit_session')
  const currentSessionId = auth().sessionId

  if (!sessionCookie?.value || sessionCookie.value !== currentSessionId) {
    // Log the login event
    await createAuditLog({
      event_type: 'login',
      event_action: 'create',
      user_id: userId!,
      user_email: user?.primaryEmailAddress?.emailAddress,
      metadata: {
        timestamp: new Date().toISOString(),
        method: 'clerk'
      },
    })

    // Set session cookie to avoid duplicate logging
    cookies().set('last_audit_session', currentSessionId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your projects.
        </p>
      </div>

      {/* Placeholder for stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£0.00</div>
            <p className="text-xs text-muted-foreground">
              Awaiting data sync
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£0.00</div>
            <p className="text-xs text-muted-foreground">
              Awaiting data sync
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£0.00</div>
            <p className="text-xs text-muted-foreground">
              Awaiting data sync
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profit Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Awaiting data sync
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            User ID: {userId}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Authentication is now configured. Proceed to Phase 4 to implement
            the full dashboard functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Step 13: Create Projects Placeholder

### 13.1 Create Projects Page

Create `src/app/(protected)/projects/page.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">
          Manage and view all your projects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No projects found. Projects will appear here once synchronized from Xero.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Step 14: Create API Route for Sync Status

### 14.1 Create Sync Status API

This API returns the last time n8n successfully synced data from Xero. It's used by the navigation header to show "Last sync: 2 hours ago" to users.

Create `src/app/api/sync-status/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getLastSyncStatus } from '@/lib/queries'

export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const syncStatus = await getLastSyncStatus()

    return NextResponse.json({
      lastSync: syncStatus?.completed_at || null,
      status: syncStatus?.status || 'NEVER',
      recordsProcessed: syncStatus?.records_processed || 0,
    })
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    )
  }
}
```

## Step 15: User Management Note

**Important**: Since this is a small application for 3-5 users, user management is handled directly through the Clerk dashboard:

1. Users are invited via Clerk dashboard
2. No self-registration needed
3. No webhook handlers needed for user creation
4. Login events are logged to our audit_logs table for compliance

## Step 16: Test Authentication Flow

### 16.1 Start Development Server

```bash
npm run dev
```

### 16.2 Test Authentication

1. Navigate to `http://localhost:3000` (development) or `https://dashboard.innspiredaccountancy.com/milestone-app` (production)
2. Click "Sign In" or "Sign Up"
3. Create a new account or sign in
4. Verify redirect to `/dashboard`
5. Check user button in header
6. Test sign out functionality

### 16.3 Test Protected Routes

Try accessing these routes:
- `/milestone-app/dashboard` - Should redirect to sign-in if not authenticated
- `/milestone-app/projects` - Should redirect to sign-in if not authenticated
- `/milestone-app/` - Should redirect to dashboard if authenticated

**Note**: In development, paths work without the basePath prefix. In production, all paths will be under `/milestone-app/`.

## Step 17: Configure Clerk Dashboard Settings

### 17.1 In Clerk Dashboard

1. Navigate to "User & Authentication"
2. Configure email/password or social logins
3. Set up email verification if desired
4. Configure session settings

### 17.2 Customize Appearance (Optional)

In Clerk Dashboard:
1. Navigate to "Customization"
2. Customize colors to match your brand
3. Update logo and branding

## Phase 3 Complete Checklist

- [ ] Clerk account created and configured
- [ ] Environment variables set (including basePath)
- [ ] Next.js basePath configured for subdirectory deployment
- [ ] Clerk Provider configured
- [ ] Middleware for route protection with basePath support
- [ ] Sign-in page created in (auth) route group
- [ ] Sign-up page created in (auth) route group
- [ ] Navigation header with dynamic route highlighting
- [ ] Protected layout created in (protected) route group
- [ ] Simple home page with auth check
- [ ] Dashboard with login audit logging
- [ ] Projects placeholder created
- [ ] Sync status API route (shows n8n sync time)
- [ ] Authentication flow tested

## Common Issues and Solutions

### Issue: Middleware not protecting routes
**Solution**: Ensure middleware.ts is in the `src` directory (not in app folder)

### Issue: UserButton not showing
**Solution**: Verify Clerk environment variables are set correctly and restart dev server

### Issue: Infinite redirect loop
**Solution**: Check publicRoutes in middleware include basePath prefix for subdirectory deployment

### Issue: Session not persisting
**Solution**: Clear cookies and local storage, then sign in again

### Issue: Routes not working in production
**Solution**: Ensure basePath is configured in next.config.mjs and all internal links use the basePath prefix

## Security Best Practices

1. **Environment Variables**: Never commit API keys to git
2. **Middleware**: Always protect sensitive routes
3. **User Management**: Invite users through Clerk dashboard (no self-registration)
4. **Audit Logging**: Log all login events to database for compliance
5. **Session Management**: Use Clerk's built-in session handling

## Next Steps

Phase 3 is complete! Authentication is fully configured with Clerk.

Proceed to [Phase 4: Dashboard Implementation](./phase-4-dashboard-implementation.md) to:
- Build the full dashboard with real data
- Implement stats cards and charts
- Create project tables
- Add data visualization

## Project Status

```
✅ Phase 1: Project Initialization - COMPLETE
✅ Phase 2: Database Setup - COMPLETE
✅ Phase 3: Authentication - COMPLETE
⏳ Phase 4: Dashboard Implementation - PENDING
⏳ Phase 5: Project Features - PENDING
⏳ Phase 6: Export Functionality - PENDING
⏳ Phase 7: Deployment - PENDING
```

---

*Estimated time: 2-3 hours*
*Last updated: Phase 3 Complete*