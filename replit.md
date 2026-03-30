# Workspace

## Overview

pnpm workspace monorepo using TypeScript. 1ur.in URL shortener application with Clerk auth, Turso database, and Razorpay payments.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: Turso (libSQL) via `@libsql/client`
- **Auth**: Clerk (`@clerk/express` backend, `@clerk/react` frontend)
- **Payments**: Razorpay
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── url-shortener/      # React + Vite frontend (1ur.in)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection (PostgreSQL, unused - using Turso)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## URL Shortener App (1ur.in)

### Features
- Shorten URLs with auto-generated or custom slugs
- Click tracking per link
- User authentication via Clerk
- Free plan: 5 URLs
- Paid plans via Razorpay:
  - Starter: ₹50 → 50 URLs
  - Pro: ₹100 → 100 URLs
  - Business: ₹150 → 200 URLs
  - Custom: Contact Sales

### Pages
- `/` - Landing page with URL shortener form and pricing
- `/dashboard` - User's URLs, plan info, create new links
- `/pricing` - Full pricing page with Razorpay checkout
- `/demo` - Interactive live demo (no sign-up required)
- `/docs` - Full REST API documentation with code examples
- `/contact` - Contact form with sales/support info
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service

### API Routes (all under /api)
- `GET /api/healthz` - Health check
- `GET /api/urls` - List user's URLs (auth required)
- `POST /api/urls` - Create short URL (auth required)
- `DELETE /api/urls/:id` - Delete URL (auth required)
- `GET /api/user/me` - Get user profile & plan (auth required)
- `POST /api/payments/create-order` - Create Razorpay order (auth required)
- `POST /api/payments/verify` - Verify payment & activate plan (auth required)
- `GET /api/r/:slug` - Redirect to original URL (public)
- `GET /api/keys` - List API keys (Business plan, auth required)
- `POST /api/keys` - Create API key (Business plan, auth required)
- `DELETE /api/keys/:id` - Revoke API key (auth required)
- `GET /api/v1/urls` - List URLs via API key
- `POST /api/v1/urls` - Create URL via API key (supports expiresAt)
- `DELETE /api/v1/urls/:slug` - Delete URL via API key
- `GET /api/v1/me` - Get account info via API key

### Environment Variables Required
- `CLERK_PUBLISHABLE_KEY` - Clerk publishable key (backend)
- `CLERK_SECRET_KEY` - Clerk secret key (backend)
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (frontend, set as env var)
- `TURSO_DATABASE_URL` - Turso database URL
- `TURSO_AUTH_TOKEN` - Turso auth token
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay key secret
- `REDIS_URL` - (Optional) Redis URL for caching redirects. Falls back gracefully if not set.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API types from OpenAPI spec
