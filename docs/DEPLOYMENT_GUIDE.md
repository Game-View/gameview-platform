# Game View Platform - Deployment Guide

## Overview

This guide covers deploying Game View Studio and Player apps to Vercel with Supabase backend.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │   Studio App        │    │   Player App        │            │
│  │   (Next.js 14)      │    │   (Next.js 14)      │            │
│  │   gvdw.vercel.app   │    │   player.vercel.app │            │
│  └──────────┬──────────┘    └──────────┬──────────┘            │
└─────────────┼───────────────────────────┼──────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │   PostgreSQL    │  │    Storage      │  │   Auth (via    │  │
│  │   (Prisma)      │  │  (Videos/PLY)   │  │    Clerk)      │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Vercel account
- Supabase account (Pro plan recommended for large file uploads)
- Clerk account (authentication)
- Upstash account (Redis for job queue)

---

## Environment Variables

### Required for Studio App

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk secret key | Clerk Dashboard → API Keys |
| `DATABASE_URL` | PostgreSQL connection (pooled) | Supabase → Connect → Transaction pooler (port 6543) |
| `DIRECT_URL` | PostgreSQL connection (direct) | Supabase → Connect → Session pooler (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | Supabase → Settings → API |
| `MODAL_API_TOKEN` | Modal GPU processing token | Modal → Settings → API Tokens |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (optional) | Upstash Dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (optional) | Upstash Dashboard |

### GPU Processing (Modal)

Modal is the recommended solution for GPU processing. Format: `token-id:token-secret`

```
MODAL_API_TOKEN=ak-xxxxx:as-xxxxx
```

See `packages/processing/README.md` for full Modal setup instructions.

### Connection String Formats

**Transaction Pooler (DATABASE_URL - port 6543):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```
⚠️ **CRITICAL:** The `?pgbouncer=true` parameter is **required** for Vercel serverless functions. Without it, Prisma will fail with "Error occurred during query" errors.

**Session Pooler (DIRECT_URL - port 5432):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```
Used for migrations only. Does not need pgbouncer parameter.

---

## Vercel Configuration

### For Monorepo Deployment

Each app needs these settings in Vercel:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `gameview-platform` |
| **Build Command** | `pnpm turbo build --filter=studio` (or `--filter=player`) |
| **Output Directory** | `apps/studio/.next` (with **Override** enabled) |
| **Install Command** | `pnpm install` |

**Important:** The Output Directory override must be enabled, otherwise Vercel looks for `.next` at the root instead of in the app folder.

---

## Database Setup

### 1. Run Database Migrations

The Prisma schema needs to be pushed to Supabase. Since Prisma CLI may not work in all environments, use the SQL migration file:

```bash
# Option A: Run Prisma locally
cd packages/database
DATABASE_URL="postgresql://..." pnpm db:push

# Option B: Run SQL in Supabase Dashboard
# Go to SQL Editor → paste contents of packages/database/migration.sql → Run
```

### 2. Create Storage Buckets

In Supabase Dashboard → Storage:

| Bucket | Public | File Limit | Purpose |
|--------|--------|------------|---------|
| `production-videos` | No | 2GB | Video uploads for processing |
| `production-outputs` | Yes | 500MB | Processed PLY files, thumbnails |

**Note:** Supabase Free tier has a 50MB global file size limit. Upgrade to Pro to increase.

---

## Video Upload Architecture

Large video files (>4.5MB) cannot be uploaded through Vercel serverless functions due to body size limits. The solution:

### Signed URL Upload Flow

```
1. Client requests signed URL from /api/productions/upload-url (small JSON request)
2. API generates signed upload URL using Supabase service role
3. Client uploads directly to Supabase Storage (bypasses Vercel)
4. On completion, client has the storage path
```

This allows unlimited file sizes while staying within Vercel's limits.

---

## Deployment Checklist

### Initial Setup

- [ ] Create Vercel project for Studio
- [ ] Create Vercel project for Player
- [ ] Add all environment variables to both projects
- [ ] Set Framework Preset to "Next.js"
- [ ] Enable Output Directory override
- [ ] Set correct build commands

### Supabase Setup

- [ ] Create Supabase project
- [ ] Run database migration (SQL or Prisma)
- [ ] Create `production-videos` storage bucket
- [ ] Create `production-outputs` storage bucket
- [ ] Configure file size limits (requires Pro for >50MB)

### Clerk Setup

- [ ] Create Clerk application
- [ ] Configure sign-in/sign-up URLs
- [ ] Add redirect URLs for production domain

### Testing

- [ ] User can sign up and complete onboarding
- [ ] User profile saves to database
- [ ] Videos upload successfully
- [ ] Production workflow completes

---

## Technical Configuration Notes

### Prisma Client in Vercel Serverless

The platform uses a custom Prisma configuration to work correctly in Vercel's serverless environment:

1. **Custom Output Location**: Prisma generates to `packages/database/generated/client` instead of the default `node_modules/.prisma/client`. This ensures the client is bundled correctly.

2. **Postinstall Script**: The root `package.json` includes a postinstall script that generates the Prisma client during deployment:
   ```json
   "postinstall": "prisma generate --schema=./packages/database/prisma/schema.prisma"
   ```

3. **Next.js Configuration**: Both Studio and Player apps configure Prisma as an external package in `next.config.mjs`/`.js`:
   ```javascript
   experimental: {
     serverComponentsExternalPackages: ["@prisma/client", "prisma"],
   }
   ```
   **Note**: For Next.js 14.x, use `experimental.serverComponentsExternalPackages`. The non-experimental `serverExternalPackages` is only available in Next.js 15+.

4. **API Package Types**: The API package exports types from source files (not built `.d.ts`) to avoid compatibility issues with Prisma's TypeScript syntax.

### Important Build Order

When Vercel builds the monorepo:
1. `pnpm install` runs postinstall → generates Prisma client
2. Turbo builds packages in dependency order
3. Next.js bundles the app with Prisma as external

---

## Troubleshooting

### "No Next.js version detected"

Add `next` to the root `package.json`:

```json
{
  "devDependencies": {
    "next": "14.2.35"
  }
}
```

### "routes-manifest.json couldn't be found"

Enable Output Directory override in Vercel and set to `apps/studio/.next`.

### "Invalid response" on video upload

- Check Supabase file size limits (50MB on free tier)
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify storage bucket exists

### "Internal server error" on onboarding

- Check `DATABASE_URL` has correct password (not placeholder)
- Verify database tables exist (run migration)
- Check `CLERK_SECRET_KEY` is set

### "Error occurred during query" / PrismaClientUnknownRequestError

This error in Vercel logs means Prisma can connect but queries fail:

```
PrismaClientUnknownRequestError: Invalid 'prisma.user.findUnique()' invocation:
Error occurred during query
```

**Fix:** Your `DATABASE_URL` is missing `?pgbouncer=true`. In Vercel:
1. Go to Project Settings → Environment Variables
2. Edit `DATABASE_URL`
3. Ensure it uses **port 6543** (not 5432) and ends with `?pgbouncer=true`

Example: `postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

### 404 on deployed site

- Check Deployment Protection settings (disable for public access)
- Verify Framework Preset is "Next.js" not "Other"

### "Prisma client not available" / Mock fallback in production

If you see `[database] Prisma client not available, using mock` in logs:

1. Verify `postinstall` script exists in root `package.json`
2. Check that `packages/database/generated/client` directory exists after build
3. Ensure Next.js config has `experimental.serverComponentsExternalPackages: ["@prisma/client", "prisma"]`
4. Redeploy with fresh build (not from cache)

### TypeScript/Build errors with Prisma types

If you see errors about `ImportEquals` or Prisma type exports:

1. The API package disables tsup DTS generation (`dts: false` in tsup.config.ts)
2. Types are exported directly from source files, not built declarations
3. This is intentional - Prisma's generated types use syntax not supported by tsup's rollup plugin

---

## Monitoring & Logs

- **Vercel:** Functions tab → View logs for API errors
- **Supabase:** Logs tab → Filter by service (API, Storage, Database)
- **Clerk:** Sessions & Users tabs for auth issues

---

## Cost Considerations

See [COST_ANALYSIS.md](./COST_ANALYSIS.md) for detailed production cost breakdown.
