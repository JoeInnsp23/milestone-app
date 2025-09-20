# Phase 1: Project Initialization

## Overview
This phase sets up the Next.js 15 project with TypeScript, Tailwind CSS v4, and shadcn/ui. We'll create the simplified folder structure defined in project-plan.md and configure all development tools. The UI styling will follow the existing design patterns from the MVP app referenced in `.reference/` folder.

## UI Reference from Existing MVP
The new implementation must maintain visual consistency with the existing MVP dashboard:
- **Color Scheme**: Blue gradient theme with dark/light mode support (see `.reference/public/css/dashboard.css`)
- **Layout**: Dashboard with KPI cards, charts, and project tables (see `.reference/Screenshot*.png`)
- **Typography**: System font stack with clean, modern appearance
- **Components**: Card-based layout with Chart.js visualizations

## Prerequisites
- Node.js 20 LTS or higher installed
- npm or yarn package manager
- Git installed
- Code editor (VS Code recommended)

## Deployment Target
Note: This application will be deployed using Coolify on your existing Ubuntu server where PostgreSQL and n8n are already running. Phase 7 will cover the complete deployment setup including Docker networking configuration.

## Step 1: Create Next.js Project

### 1.1 Initialize the Project

```bash
npx create-next-app@latest milestone-app
```

When prompted, select these options:
```
✔ Would you like to use TypeScript? → Yes
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like to use `src/` directory? → Yes
✔ Would you like to use App Router? (recommended) → Yes
✔ Would you like to customize the default import alias (@/*)? → No
```

### 1.2 Navigate to Project Directory

```bash
cd milestone-app
```

## Step 2: Clean Up Default Files

Remove the default Next.js boilerplate:

```bash
# Remove default styles and assets
rm -rf src/app/favicon.ico
rm -rf src/app/globals.css
rm -rf public/next.svg public/vercel.svg

# Clean up the default page
echo "" > src/app/page.tsx
```

## Step 3: Configure TypeScript

### 3.1 Update tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "target": "ES2017",
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

## Step 4: Set Up Tailwind CSS

### 4.1 Create Global Styles

Create `src/app/globals.css` (matching the color scheme from `.reference/public/css/dashboard.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Matching MVP light theme from .reference/public/css/dashboard.css */
    --background: 0 0% 100%;
    --foreground: 215 13.8% 34.1%;
    --card: 0 0% 97.3%;
    --card-foreground: 215 13.8% 34.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 215 13.8% 34.1%;
    --primary: 221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;
    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;
    --accent: 187 92% 69%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 221 83% 53%;
    --radius: 0.375rem;
    --chart-1: 158 64% 52%;
    --chart-2: 0 84% 60%;
    --chart-3: 25 95% 53%;
    --chart-4: 199 89% 48%;
    --chart-5: 217 91% 60%;

    /* Additional MVP-specific colors */
    --positive: 158 64% 52%;
    --negative: 0 84% 60%;
    --warning: 25 95% 53%;
  }

  .dark {
    /* Matching MVP dark theme from .reference/public/css/dashboard.css */
    --background: 222 47% 11%;
    --foreground: 0 0% 91%;
    --card: 222 47% 15%;
    --card-foreground: 0 0% 91%;
    --popover: 222 47% 11%;
    --popover-foreground: 0 0% 91%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 11%;
    --secondary: 222 47% 20%;
    --secondary-foreground: 0 0% 91%;
    --muted: 217 33% 28%;
    --muted-foreground: 215 16% 57%;
    --accent: 217 91% 60%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 70% 65%;
    --destructive-foreground: 0 0% 100%;
    --border: 217 33% 28%;
    --input: 217 33% 28%;
    --ring: 217 91% 60%;
    --chart-1: 156 64% 58%;
    --chart-2: 0 73% 70%;
    --chart-3: 38 92% 50%;
    --chart-4: 199 89% 48%;
    --chart-5: 217 91% 60%;

    /* Additional MVP-specific colors */
    --positive: 156 64% 58%;
    --negative: 0 73% 70%;
    --warning: 38 92% 50%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* MVP-specific gradient backgrounds from .reference/public/css/dashboard.css */
.gradient-bg-light {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%);
  background-attachment: fixed;
}

.gradient-bg-dark {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%);
  background-attachment: fixed;
}

/* Card hover effects matching MVP */
.card-hover {
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
```

### 4.2 Update Tailwind Config

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // MVP-specific colors from .reference/public/css/dashboard.css
        positive: "hsl(var(--positive))",
        negative: "hsl(var(--negative))",
        warning: "hsl(var(--warning))",
        // Blue gradient colors for backgrounds
        "blue-dark": "#1e3a8a",
        "blue-medium": "#1e40af",
        "blue-light": "#2563eb",
        "navy-dark": "#1a1a2e",
        "navy-medium": "#16213e",
        "navy-light": "#0f172a",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

## Step 5: Install shadcn/ui

### 5.1 Install Dependencies

```bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
```

### 5.2 Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted, select:
```
✔ Which style would you like to use? → Default
✔ Which color would you like to use as base color? → Neutral
✔ Would you like to use CSS variables for colors? → Yes
```

### 5.3 Create lib/utils.ts

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5.4 Create components.json

Create `components.json` in the root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Step 6: Set Up Project Structure

Following the simplified folder structure defined in project-plan.md:
- `/src/app` - Next.js app router pages
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and database client
- `/src/hooks` - Custom React hooks
- `/src/types` - TypeScript type definitions

### 6.1 Create Folder Structure

```bash
# Create all necessary directories
mkdir -p src/app/dashboard
mkdir -p src/app/projects
mkdir -p src/app/api/projects
mkdir -p src/app/api/estimates
mkdir -p src/app/api/export
mkdir -p src/app/api/sync-status
mkdir -p src/app/sign-in/[[...sign-in]]
mkdir -p src/app/sign-up/[[...sign-up]]
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/types
mkdir -p drizzle
```

### 6.2 Create Type Definitions

Create `src/types/index.ts`:

```typescript
// Database types (will be expanded in Phase 2)
export interface Project {
  id: string;
  xero_project_id: string;
  name: string;
  client_name: string | null;
  client_contact_id: string | null;
  tracking_category_id: string;
  status: string;
  start_date: Date | null;
  end_date: Date | null;
  project_manager: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  last_synced_at: Date | null;
}

export interface BuildPhase {
  id: string;
  xero_phase_id: string;
  name: string;
  description: string | null;
  tracking_category_id: string;
  display_order: number;
  color: string;
  icon: string | null;
  is_active: boolean;
  typical_duration_days: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectEstimate {
  id: number;
  project_id: string;
  build_phase_id: string | null;
  estimate_type: 'revenue' | 'cost' | 'materials';
  amount: number;
  currency: string;
  confidence_level: number | null;
  notes: string | null;
  valid_from: Date | null;
  valid_until: Date | null;
  created_by: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  version: number;
  previous_version_id: number | null;
}

export interface Invoice {
  id: string;
  xero_invoice_id: string;
  invoice_number: string;
  reference: string | null;
  contact_id: string | null;
  contact_name: string | null;
  project_id: string | null;
  build_phase_id: string | null;
  type: 'ACCREC' | 'ACCPAY';
  status: string;
  sub_total: number | null;
  total_tax: number | null;
  total: number | null;
  amount_paid: number | null;
  amount_due: number | null;
  currency_code: string | null;
  invoice_date: Date | null;
  due_date: Date | null;
  fully_paid_date: Date | null;
  created_at: Date;
  updated_at: Date;
  last_synced_at: Date | null;
}

export interface Bill {
  id: string;
  xero_bill_id: string;
  bill_number: string | null;
  reference: string | null;
  contact_id: string | null;
  contact_name: string | null;
  project_id: string | null;
  build_phase_id: string | null;
  type: 'BILL' | 'PURCHASEORDER';
  status: string;
  sub_total: number | null;
  total_tax: number | null;
  total: number | null;
  amount_paid: number | null;
  amount_due: number | null;
  currency_code: string | null;
  bill_date: Date | null;
  due_date: Date | null;
  fully_paid_date: Date | null;
  created_at: Date;
  updated_at: Date;
  last_synced_at: Date | null;
}

export interface DashboardStats {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  profitMargin: number;
  activeProjects: number;
  pendingInvoices: number;
  overdueInvoices: number;
  lastSyncTime: Date | null;
}

export interface ProjectSummary {
  project_id: string;
  project_name: string;
  client_name: string | null;
  project_status: string;
  actual_revenue: number;
  actual_costs: number;
  profit: number;
  profit_margin: number;
  estimated_revenue: number;
  estimated_cost: number;
  estimated_profit: number;
  invoice_count: number;
  bill_count: number;
}
```

## Step 7: Configure ESLint and Prettier

### 7.1 Install Prettier

```bash
npm install --save-dev prettier eslint-config-prettier prettier-plugin-tailwindcss
```

### 7.2 Create Prettier Config

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "./tailwind.config.ts"
}
```

### 7.3 Update ESLint Config

Update `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "off",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}
```

## Step 8: Create Base Layout

### 8.1 Create Root Layout

Create `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}
```

### 8.2 Create Placeholder Home Page

Create `src/app/page.tsx`:

```typescript
export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Milestone Dashboard</h1>
        <p className="mt-4 text-muted-foreground">
          Project initialization complete. Ready for Phase 2.
        </p>
      </div>
    </div>
  )
}
```

## Step 9: Set Up Environment Variables

### 9.1 Create Environment File

Create `.env.local`:

```env
# Database (will be configured in Phase 2)
DATABASE_URL=""

# Clerk (will be configured in Phase 3)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 9.2 Create Example Environment File

Create `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/milestone"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Step 10: Update package.json

### 10.1 Add Scripts and Dependencies

Update `package.json`:

```json
{
  "name": "milestone-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.438.0",
    "next": "14.2.13",
    "react": "^18",
    "react-dom": "^18",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.13",
    "eslint-config-prettier": "^9.1.0",
    "postcss": "^8",
    "prettier": "^3.2.4",
    "prettier-plugin-tailwindcss": "^0.5.11",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

## Step 11: Initialize Git Repository

### 11.1 Initialize Git

```bash
git init
```

### 11.2 Create .gitignore

Create/update `.gitignore`:

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# drizzle
drizzle/*.sql
.drizzle

# editor
.vscode
.idea
```

### 11.3 Make Initial Commit

```bash
git add .
git commit -m "Initial project setup with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui"
```

## Step 12: Install UI Components

### 12.1 Install Essential shadcn/ui Components

```bash
# Install components we'll need
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add skeleton
# Note: Using React Hot Toast instead of shadcn toast
npm install react-hot-toast
```

## Step 13: Verify Installation

### 13.1 Start Development Server

```bash
npm run dev
```

### 13.2 Check Browser

Navigate to `http://localhost:3000` and verify:
- Page loads without errors
- Styling is applied correctly
- Console shows no errors

### 13.3 Run Type Check

```bash
npm run type-check
```

### 13.4 Run Linter

```bash
npm run lint
```

### 13.5 Format Code

```bash
npm run format
```

## Phase 1 Complete Checklist

- [ ] Next.js 15 project created with App Router
- [ ] TypeScript configured with strict mode
- [ ] Tailwind CSS configured with custom theme
- [ ] shadcn/ui initialized and components installed
- [ ] Project folder structure created
- [ ] Type definitions added
- [ ] ESLint and Prettier configured
- [ ] Environment variables template created
- [ ] Git repository initialized
- [ ] Development server running successfully

## Common Issues and Solutions

### Issue: Module not found errors
**Solution**: Ensure all dependencies are installed:
```bash
npm install
```

### Issue: TypeScript errors in .tsx files
**Solution**: Restart TypeScript server in VS Code:
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
- Type "TypeScript: Restart TS Server"

### Issue: Tailwind styles not applying
**Solution**: Ensure globals.css is imported in layout.tsx and restart dev server

### Issue: shadcn/ui component installation fails
**Solution**: Ensure components.json is properly configured and run:
```bash
npx shadcn@latest init --force
```

## Next Steps

Phase 1 is complete! The project is now initialized with all necessary tools and configurations.

Proceed to [Phase 2: Database Setup](./phase-2-database-setup.md) to:
- Connect to PostgreSQL
- Set up Drizzle ORM
- Create database schema
- Implement migrations

## Project Status

```
✅ Phase 1: Project Initialization - COMPLETE
⏳ Phase 2: Database Setup - PENDING
⏳ Phase 3: Authentication - PENDING
⏳ Phase 4: Dashboard Implementation - PENDING
⏳ Phase 5: Project Features - PENDING
⏳ Phase 6: Export Functionality - PENDING
⏳ Phase 7: Deployment - PENDING
```

---

*Estimated time: 2-3 hours*
*Last updated: Phase 1 Complete*
