# Vercel Deployment Guide

## Overview

Game View Platform is a Turborepo monorepo with two deployable Next.js applications:
- **Studio** (`apps/studio`) - Creator platform for building experiences
- **Player** (`apps/player`) - Player platform for discovering and playing experiences

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository connected: `Game-View/gameview-platform`
- Environment variables ready (see below)

## Step 1: Import Repository to Vercel

1. Go to https://vercel.com/new
2. Import from GitHub: `Game-View/gameview-platform`
3. You'll create **two projects** from the same repo

## Step 2: Create Studio Project

**Project Settings:**
- Project Name: `gameview-studio`
- Framework Preset: Next.js
- Root Directory: `apps/studio`
- Build Command: `cd ../.. && pnpm turbo build --filter=studio`
- Output Directory: `.next`
- Install Command: `pnpm install`

**Note:** The build command uses `turbo build --filter=studio` to build only the studio app and its dependencies.

## Step 3: Create Player Project

**Project Settings:**
- Project Name: `gameview-player`
- Framework Preset: Next.js
- Root Directory: `apps/player`
- Build Command: `cd ../.. && pnpm turbo build --filter=player`
- Output Directory: `.next`
- Install Command: `pnpm install`

## Step 4: Configure Environment Variables

Add these environment variables to **both** projects in Vercel Dashboard → Project Settings → Environment Variables:

### Required for Both Apps

```
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]?pgbouncer=true
DIRECT_URL=postgresql://[user]:[password]@[host]:5432/[database]

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### Studio-Only Variables

```
ANTHROPIC_API_KEY=sk-ant-xxx
MODAL_ENDPOINT_URL=https://xxx--xxx.modal.run
```

### Optional (Redis for Queues)

```
REDIS_URL=redis://xxx
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

## Step 5: Configure Domains (Optional)

In each project's settings, add custom domains:
- Studio: `studio.gameview.io` (or your domain)
- Player: `play.gameview.io` (or your domain)

## Step 6: Deploy

Vercel will automatically deploy on push to connected branches:
- **Production**: `main` branch
- **Preview**: All other branches (including `development`, `claude/*`)

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy studio (from repo root)
cd apps/studio && vercel

# Deploy player (from repo root)
cd apps/player && vercel
```

## Build Configuration

The monorepo uses Turborepo for optimized builds. Key configurations:

**turbo.json** defines:
- Build task dependencies
- Global environment variables
- Prisma generation as a build dependency

**Each app's vercel.json** defines:
- Framework preset (Next.js)
- Function timeouts (studio has 60s for import API)

## Troubleshooting

### Prisma Client Generation

If builds fail with Prisma errors, ensure:
1. `DATABASE_URL` is set in environment variables
2. Build command includes Prisma generate (already in `package.json` scripts)

### Build Timeouts

For large builds, increase function timeout in vercel.json:
```json
{
  "functions": {
    "src/app/api/processing/trigger/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### Monorepo Dependencies

If package resolution fails:
1. Ensure `pnpm-workspace.yaml` includes all packages
2. Use `workspace:*` for internal dependencies
3. Build command should run from root with turbo filter

## Environment Variable Reference

| Variable | Required | Used By | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | Both | Supabase PostgreSQL connection (with pgbouncer) |
| DIRECT_URL | Yes | Both | Direct PostgreSQL connection for migrations |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Yes | Both | Clerk public key |
| CLERK_SECRET_KEY | Yes | Both | Clerk secret key |
| NEXT_PUBLIC_SUPABASE_URL | Yes | Both | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Both | Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | Yes | Studio | Supabase service role for uploads |
| ANTHROPIC_API_KEY | Yes | Studio | Claude API for Spark chat |
| MODAL_ENDPOINT_URL | Yes | Studio | Modal GPU endpoint for 3D processing |
| REDIS_URL | Optional | Studio | Redis for job queues |
