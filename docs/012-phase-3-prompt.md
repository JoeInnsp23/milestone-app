# Phase 3: Authentication with Clerk - Implementation Prompt

## Context Initialization
You are tasked with implementing Phase 3 of the Milestone P&L Dashboard project. This phase integrates Clerk authentication with custom sign-in/sign-up pages matching the MVP design.

## Pre-Implementation Requirements

### 1. Document Review
First, thoroughly read and understand these documents in this exact order:
1. `/root/projects/milestone-app/project-plan.md` - Review authentication requirements
2. `/root/projects/milestone-app/phase-3-authentication.md` - Review auth specification
3. `/root/projects/milestone-app/phase-3-tasks.md` - Study all 45 tasks (T071-T114 including T080a)
4. `/root/projects/milestone-app/phase-3-QA.md` - Understand validation requirements
5. Review `.reference` folder screenshots for MVP design patterns

### 2. Context Building
Before starting implementation:
- Use `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs` to research:
  - Clerk with Next.js App Router
  - Clerk middleware configuration
  - Clerk custom pages styling
  - UserButton component customization
- Use WebSearch to find:
  - Latest Clerk Next.js setup (2024)
  - Clerk custom sign-in page styling
  - Clerk webhook configuration
  - basePath configuration with Clerk

### 3. Pre-requisites Check
Ensure Phase 1 and 2 are complete:
```bash
# Check project structure
ls -la src/app/ src/db/

# Verify database schema exists
cat src/db/schema.ts | grep -E "audit_log|estimates"
```

## Clerk Account Setup (External)

**IMPORTANT**: Before starting tasks, you need a Clerk account:
1. Go to https://clerk.com
2. Sign up for a free account
3. Create a new application
4. Get your keys:
   - Publishable Key (starts with `pk_test_` or `pk_live_`)
   - Secret Key (starts with `sk_test_` or `sk_live_`)

## Implementation Instructions

### Phase 3 Task Execution (T071-T114)

#### Critical Setup Tasks:

**Environment Configuration (T071-T074):**
Add to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Package Installation (T075-T076):**
```bash
npm install @clerk/nextjs
```

**ClerkProvider Setup (T077-T081):**
Update `src/app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**CRITICAL - basePath Configuration (T080a):**
Update `next.config.mjs`:
```javascript
const nextConfig = {
  basePath: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
}
```

**Middleware Configuration (T082-T084):**
Create `src/middleware.ts`:
```typescript
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhooks/n8n"
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

**Custom Sign-In/Sign-Up Pages (T085-T090):**

Directory structure:
```
src/app/
├── sign-in/
│   └── [[...sign-in]]/
│       └── page.tsx
└── sign-up/
    └── [[...sign-up]]/
        └── page.tsx
```

Sign-in page with MVP styling:
```typescript
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen gradient-bg-light dark:gradient-bg-dark flex items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white/95 backdrop-blur",
          }
        }}
      />
    </div>
  );
}
```

**User Sync Function (T098-T101):**
Create `src/lib/user-sync.ts`:
```typescript
export async function syncUserToDatabase(userId: string, email: string) {
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    table_name: 'user_sync',
    operation: 'LOGIN',
    user_id: userId,
    user_email: email,
    changed_at: new Date(),
  });
}
```

**UserButton Integration (T102-T106):**
In authenticated layouts:
```typescript
import { UserButton } from "@clerk/nextjs";

export default function AuthenticatedLayout() {
  return (
    <header>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
```

### Key Implementation Details:

1. **MVP Design Adherence:**
   - Gradient background on auth pages
   - White/translucent cards with backdrop blur
   - Consistent color scheme from `.reference` folder

2. **Route Protection:**
   - Public routes: /, /sign-in, /sign-up, /api/webhooks/n8n
   - All other routes require authentication
   - Redirect to /sign-in when unauthorized

3. **Database Sync:**
   - Log user actions to audit_log table
   - Use UUID for audit entries
   - Track user_id from Clerk

4. **Testing Considerations:**
   - Create test user via Clerk dashboard
   - Test sign-in/sign-up flow
   - Verify protected route access
   - Check UserButton functionality

## Quality Assurance Execution

After completing ALL tasks (T071-T114), execute the QA validation:

### Phase 3 QA Validation (QA101-QA150)

Critical QA checks:
- QA101-QA106: Clerk setup verification
- QA106a: basePath configuration test
- QA107-QA115: Provider and middleware testing
- QA116-QA125: Sign-in/sign-up page validation
- QA126-QA135: Route protection testing
- QA136-QA145: User sync and database integration
- QA146-QA150: Final auth flow testing

### Testing Commands:
```bash
# Start dev server
npm run dev

# Test routes:
# 1. Visit http://localhost:3000 - should be accessible
# 2. Visit http://localhost:3000/dashboard - should redirect to sign-in
# 3. Sign in and verify access to /dashboard
# 4. Check UserButton appears and works
# 5. Test sign-out redirects to /
```

## Success Criteria
Phase 3 is complete when:
- [ ] All 45 tasks completed (including T080a)
- [ ] All 51 QA checks pass (including QA106a)
- [ ] Sign-in page styled with gradient background
- [ ] Sign-up page styled consistently
- [ ] Middleware protects authenticated routes
- [ ] UserButton integrated and functional
- [ ] Database sync logs user actions
- [ ] basePath configured for production
- [ ] Test user can complete full auth flow

## Common Issues & Solutions

1. **Clerk keys not working:**
   - Verify keys match your Clerk application
   - Check for spaces or quotes in .env.local
   - Ensure NEXT_PUBLIC_ prefix for client keys

2. **Middleware not protecting routes:**
   - Check middleware.ts is in src/ root
   - Verify matcher configuration
   - Clear Next.js cache: `rm -rf .next`

3. **Sign-in page not styled:**
   - Verify gradient classes in globals.css
   - Check Tailwind configuration
   - Ensure ClerkProvider wraps entire app

4. **Database sync failing:**
   - Verify audit_log table exists
   - Check database connection
   - Ensure UUID generation works

## Verification Commands
```bash
# Check Clerk installation
npm list @clerk/nextjs

# Verify middleware exists
ls -la src/middleware.ts

# Check auth pages
ls -la src/app/sign-in/[[...sign-in]]/page.tsx
ls -la src/app/sign-up/[[...sign-up]]/page.tsx

# Test environment variables
node -e "console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Clerk key set' : 'Missing Clerk key')"
```

## Critical Notes
- DO NOT hardcode any Clerk keys
- DO NOT create custom JWT handling - use Clerk's built-in
- DO NOT skip the basePath configuration (T080a)
- Keep sign-in/sign-up pages simple - let Clerk handle complexity
- Remember: n8n webhook must remain public (no auth)

Upon completion, Phase 3 should provide complete authentication with Clerk, ready for dashboard implementation in Phase 4.