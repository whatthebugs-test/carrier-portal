# carrier-portal

Self-service portal for Kestrel Freight carrier partners. Carriers sign in to
tender LTL shipments, follow them through pickup and delivery, upload BOLs and
PODs, and cancel tenders before pickup. Each shipment also has a public
tracking page (`/tracking/<PRO>`) that carriers share with shippers and
consignees.

Production: <https://portal.kestrelfreight.io>

## Stack

- Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript
- next-auth 4 (credentials provider backed by shipment-api, JWT sessions)
- TanStack Query for client-side polling, react-hook-form + zod for forms
- Tailwind CSS, Radix primitives, Recharts, Mapbox GL
- Vitest for unit tests

All shipment data lives in [shipment-api](https://github.com/kestrelfreight/shipment-api).
The portal has no database of its own; it calls shipment-api server-side with a
service token and scopes every request to the signed-in user's carrier.

```
app/
  page.tsx                    dashboard
  login/                      sign-in (next-auth credentials)
  shipments/                  list, detail, tender form
    new/actions.ts            createShipmentAction (Server Action)
    [id]/actions.ts           cancelShipmentAction (Server Action)
  tracking/[pro]/             public tracking page
  api/
    auth/[...nextauth]/       next-auth
    health/                   ALB health check
    tracking/[pro]/           JSON used by the tracking page to poll
    shipments/[id]/documents/ document upload proxy
lib/
  shipment-api.ts             typed shipment-api client (fetch + timeout)
  schemas.ts                  zod schemas for API responses and form input
  auth.ts, session.ts         next-auth config and server-side session helpers
  format.ts                   display formatters
components/                   shared UI
middleware.ts                 redirects unauthenticated requests to /login
```

## Local development

Requires Node 20.18 (`nvm use`).

```sh
npm ci
cp .env.example .env.local   # fill in NEXTAUTH_SECRET and SHIPMENT_API_TOKEN
npm run dev                  # http://localhost:3000
```

Run shipment-api locally (`docker compose up` in that repo) or point
`SHIPMENT_API_URL` at staging (`https://shipment-api.staging.kestrelfreight.io`)
with a staging service token from 1Password ("carrier-portal staging").

| Command | What it does |
| --- | --- |
| `npm test` | unit tests (Vitest) |
| `npx tsc --noEmit` | typecheck |
| `npm run lint` | ESLint (`next lint`) |
| `npm run build` | production build |

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXTAUTH_URL` | yes | Public base URL, e.g. `https://portal.kestrelfreight.io` |
| `NEXTAUTH_SECRET` | yes | Session JWT signing secret |
| `SHIPMENT_API_URL` | yes | Base URL of shipment-api |
| `SHIPMENT_API_TOKEN` | yes | Service token with the `portal` scope |
| `SHIPMENT_API_TIMEOUT_MS` | no | Per-request timeout, default 8000 |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | no | Enables the map on tracking pages |
| `GIT_SHA` | no | Reported by `/api/health`; set by the deploy pipeline |

Server-side variables are validated on first use (`lib/env.ts`), not at build
time, so CI builds without secrets.

## Deploy

The portal runs as an ECS Fargate service (`carrier-portal`, cluster
`prod-apps`, us-east-1) behind an ALB at `portal.kestrelfreight.io`. The ALB
health check hits `GET /api/health`. Secrets come from SSM Parameter Store
under `/carrier-portal/prod/*`.

Merges to `main` build the Docker image, push it to ECR and roll the service
(staging first, then production after the smoke check passes). Roll back by
redeploying the previous task definition revision.

## Ownership

Platform team: Maya Okafor, Daniel Reyes. Questions in #carrier-portal.
