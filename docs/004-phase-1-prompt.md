# Phase 1: Next.js Setup & Configuration - Implementation Prompt

## Context Initialization
You are tasked with implementing Phase 1 of the Milestone P&L Dashboard project. This phase establishes the foundation using Next.js 14 with App Router, TypeScript, and Tailwind CSS.

## Pre-Implementation Requirements

### 1. Document Review
First, thoroughly read and understand these documents in this exact order:
1. `/root/projects/milestone-app/project-plan.md` - Understand the overall architecture
2. `/root/projects/milestone-app/phase-1-nextjs-setup.md` - Review the phase specification
3. `/root/projects/milestone-app/phase-1-tasks.md` - Study all 35 tasks (T001-T035)
4. `/root/projects/milestone-app/phase-1-QA.md` - Understand validation requirements

### 2. Context Building
Before starting implementation:
- Use `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs` to research:
  - Next.js 14 App Router best practices
  - TypeScript configuration for Next.js
  - Tailwind CSS setup with Next.js
  - shadcn/ui component installation
- Use WebSearch to find:
  - Latest Next.js 14 with App Router patterns
  - Current shadcn/ui installation procedures
  - Best practices for project structure

### 3. Existing Code Review
Check if any code exists:
```bash
ls -la /root/projects/milestone-app/
```
If a project exists, review its current state before proceeding.

## Implementation Instructions

### Phase 1 Task Execution (T001-T035)

Execute each task in exact order. For each task:
1. Read the task description completely
2. Execute the task exactly as specified
3. Verify completion before moving to next task
4. Update any existing files rather than creating new ones unless specifically required

#### Critical Implementation Details:

**Project Initialization (T001-T004):**
- Project name: `milestone-app` (NOT milestone-dashboard)
- Use `npx create-next-app@latest` with these EXACT options:
  - TypeScript: Yes
  - ESLint: Yes
  - Tailwind CSS: Yes
  - `src/` directory: Yes
  - App Router: Yes
  - Import alias: No

**Configuration Updates (T005-T010):**
- Modify `next.config.mjs` for basePath in production:
```javascript
const nextConfig = {
  basePath: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
}
```

**Component Library (T011-T015):**
- Install shadcn/ui using: `npx shadcn@latest init`
- Configure with:
  - Style: New York
  - Base color: Zinc
  - CSS variables: Yes

**Core Components (T016-T020):**
- Install these shadcn components ONLY:
  - card, button, input, label, select
  - table, tabs, badge, dialog
- Install React Hot Toast for notifications (not Sonner)

**File Structure (T021-T030):**
- Create directories but DO NOT create placeholder files unless specified
- Structure:
```
src/
├── app/
│   ├── (authenticated)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   └── projects/
│   ├── api/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   └── ui/ (shadcn components)
├── lib/
│   └── utils.ts
└── types/
```

**Styling (T031-T035):**
- Add gradient utilities to globals.css:
```css
@layer utilities {
  .gradient-bg-light {
    @apply bg-gradient-to-r from-blue-600 to-purple-600;
  }
  .gradient-bg-dark {
    @apply bg-gradient-to-r from-blue-800 to-purple-800;
  }
}
```

### Important Constraints:
1. DO NOT create any files not explicitly mentioned in tasks
2. DO NOT install packages beyond those specified
3. DO NOT create placeholder content or dummy data
4. DO NOT deviate from the task specifications
5. ALWAYS check if a file exists before creating it
6. ALWAYS use Edit instead of Write when modifying existing files

## Quality Assurance Execution

After completing ALL tasks (T001-T035), execute the QA validation:

### Phase 1 QA Validation (QA001-QA050)

For each QA item:
1. Execute the test exactly as described
2. Document any failures
3. Fix issues before proceeding
4. Re-test after fixes

#### Critical QA Checks:
- QA001-QA005: Project structure validation
- QA006-QA015: Dependency verification
- QA016-QA025: Configuration validation
- QA026-QA035: Build and development server tests
- QA036-QA045: Component availability
- QA046-QA050: Final integration tests

### QA Execution Commands:
```bash
# Build test (QA034)
npm run build

# Type checking (QA037)
npm run type-check || npx tsc --noEmit

# Development server (QA026)
npm run dev
```

## Success Criteria
Phase 1 is complete when:
- [ ] All 35 tasks (T001-T035) completed exactly as specified
- [ ] All 50 QA checks (QA001-QA050) pass successfully
- [ ] Project builds without errors
- [ ] TypeScript compilation successful
- [ ] Development server runs at localhost:3000
- [ ] All required directories exist
- [ ] Configuration files properly set up
- [ ] No extra files or dependencies added

## Error Handling
If any task fails:
1. Stop immediately
2. Diagnose the issue
3. Fix only what's necessary
4. Resume from the failed task
5. Document any deviations required

## Final Verification
Run these commands to verify Phase 1 completion:
```bash
# Verify project structure
find src -type d | sort

# Check dependencies
npm list --depth=0

# Verify build
npm run build && echo "✅ Build successful"

# Check for TypeScript errors
npx tsc --noEmit && echo "✅ No TypeScript errors"
```

## Notes
- This is a greenfield project - no migration needed
- Focus on clean, minimal setup
- Do not add features beyond Phase 1 scope
- Keep all configurations production-ready
- Remember: production URL will be dashboard.innspiredaccountancy.com/milestone-app

Upon completion, Phase 1 should provide a clean Next.js 14 foundation ready for Phase 2 database setup.