# CLAUDE.md

Carrier self-service portal: Next.js 15 App Router + React 19 + TypeScript.
See README.md for architecture and env vars.

## Commands

- Install: `npm ci`
- Test: `npm test`
- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- Build: `npm run build` (must pass before opening a PR; CI runs all four)

## Conventions

- Server-only code calls shipment-api through `lib/shipment-api.ts`. Don't call it from client components.
- Validate all Server Action input with the zod schemas in `lib/schemas.ts`, even if the form already did.
- Every shipment-api call is scoped to `session.carrierId`; never take a carrier id from the client.
- Tests live next to the code (`*.test.ts`).

## Dependencies

- Versions in `package.json` are pinned exactly. Change one with `npm install --save-exact <pkg>@<version>`
  so `package.json` and `package-lock.json` move together, and commit both. CI uses `npm ci` and fails if they drift.
- `next` and `eslint-config-next` move together, same version.

## Git and PRs

- Branch from `main` as `fix/<topic>` (or `feat/<topic>`, `chore/<topic>`).
- Open PRs with `gh pr create`. Fill in what changed and how you verified it.
- Security fixes put the CVE in the PR title, e.g. `fix: bump next to 15.x.y (CVE-2025-XXXXX)`.
