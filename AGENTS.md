# Repository Guidelines

## Project Structure & Module Organization
- App Router code lives in `src/app`; protected routes stay in `src/app/(authenticated)` and server actions in `src/app/actions`.
- Shared UI sits in `src/components` (kebab-case folders, PascalCase exports) with supporting logic in `src/lib` and `src/hooks`.
- Database schema, migrations, and seeds live in `src/db`, `drizzle/`, and `scripts/`; assets are in `public/`, and phase playbooks stay in `docs/`—review the matching doc before altering a feature.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server at `http://localhost:3000`.
- `npm run build` / `npm run start` build and serve the production bundle.
- `npm run lint` runs the Next flat ESLint config; `npm run type-check` keeps TypeScript clean.
- `npm run db:migrate` applies Drizzle migrations; `npm run db:studio` opens the inspector; `npm run db:seed` loads fixtures.
- Use `tsx scripts/test-queries.ts` (and peers in `scripts/`) for targeted data-validation runs.

## Coding Style & Naming Conventions
- Use TypeScript end-to-end; prefer typed server actions and explicit return types where utilities are shared.
- Mirror existing formatting: 2-space indentation, double quotes on imports, Tailwind utility classes for styling, and minimal ad-hoc CSS.
- Keep modules focused and colocate component-specific helpers; run `npm run lint` after edits to stay within the enforced rules.

## Testing Guidelines
- Run `npm run lint` and `npm run type-check` before every PR; treat them as the minimum regression gate.
- Validate database changes with `npm run db:migrate` plus the relevant `tsx scripts/test-*.ts` suite.
- Follow the QA checklists in `docs/*-QA.md` for UI flows and record regressions in the same phase document.

## Commit & Pull Request Guidelines
- Match the existing history: short, imperative, problem-first messages (e.g., "Fix input backgrounds for Tailwind v4").
- Squash noisy commits locally; keep the final summary under ~70 characters and move extra detail into the body.
- PRs must outline scope, testing proof, and any env or database deltas, include screenshots/GIFs for UI changes, and flag follow-up items.

## Environment & Security Notes
- Copy `.env.example` to `.env.local`; supply `DATABASE_URL`, Clerk keys, and other secrets locally only.
- Respect the production `basePath`/`assetPrefix` logic in `next.config.ts` and align Postgres credentials with `DATABASE.md` when configuring services.
