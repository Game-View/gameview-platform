# Game View Infrastructure Setup Guide

Complete guide to setting up all production services for the Game View platform.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│  ┌──────────────────────┐    ┌─────────────────────┐            │
│  │   Studio App         │    │   Player App        │            │
│  │   (Next.js 14)       │    │   (Next.js 14)      │            │
│  └──────────┬───────────┘    └──────────┬──────────┘            │
└─────────────┼───────────────────────────┼──────────────────────┘
              │                           │
              ▼                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND SERVICES                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Supabase        │  │ Upstash Redis   │  │ Clerk           │  │
│  │ - PostgreSQL    │  │ - BullMQ Queue  │  │ - Auth          │  │
│  │ - Storage       │  │ - Pub/Sub       │  │ - Webhooks      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────┐
│  PROCESSING WORKER (GPU Server)                                   │
│  - Node.js Worker connecting to Redis                             │
│  - gvcore-cli for video-to-3D processing                         │
│  - Uploads results to Supabase Storage                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Supabase Setup (Database + Storage)

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users (e.g., `us-east-1`)
3. Save your database password securely

### Get Connection Strings
1. Go to **Settings** → **Database** → **Connection string**
2. Copy the **Session pooler** connection string (port 5432)

```bash
# packages/database/.env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Push Database Schema
```bash
cd packages/database
pnpm db:push
```

### Create Storage Buckets
1. Go to **Storage** → **New Bucket**
2. Create these buckets:

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| `production-videos` | No | Source video uploads |
| `production-outputs` | Yes | PLY files, thumbnails |
| `avatars` | Yes | User profile images |

### Storage Policies
For `production-videos` (private):
```sql
-- Allow authenticated uploads
CREATE POLICY "Users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'production-videos');

-- Allow reading own videos
CREATE POLICY "Users can read own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'production-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

For `production-outputs` (public read):
```sql
-- Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'production-outputs');

-- Service role write access
CREATE POLICY "Service can write outputs"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'production-outputs');
```

### Get API Keys
Go to **Settings** → **API**:
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key (backend only!)

---

## 2. Upstash Redis Setup (Queue)

### Create Redis Database
1. Go to [upstash.com](https://upstash.com) → Create Database
2. Select region matching your Vercel deployment (e.g., `us-east-1`)
3. Choose **TLS** for security
4. Enable **Eviction** (optional, for cache-like behavior)

### Get Connection String
1. Go to your database → **REST API** or **Details**
2. Copy the Redis URL:

```bash
REDIS_URL="rediss://default:[password]@[region]-[id].upstash.io:6379"
```

**Note:** Use `rediss://` (with double 's') for TLS connections.

### Configure for BullMQ
BullMQ requires specific Redis settings. Upstash works with these options:

```typescript
// Already configured in packages/queue/src/connection.ts
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,    // Recommended for serverless
});
```

### Verify Connection
```bash
cd packages/queue
REDIS_URL="your-url" pnpm test:connection
```

---

## 3. Clerk Setup (Authentication)

### Create Application
1. Go to [clerk.com](https://clerk.com) → Create Application
2. Enable authentication methods (Email, Google, etc.)
3. Configure branding in **Customization**

### Get API Keys
Go to **API Keys**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: pk_live_xxx or pk_test_xxx
- `CLERK_SECRET_KEY`: sk_live_xxx or sk_test_xxx

### Configure Webhook (Required!)
1. Go to **Webhooks** → **Add Endpoint**
2. Configure:
   - **URL**: `https://gvdw.vercel.app/api/webhooks/clerk`
   - **Events**: `user.created`, `user.updated`, `user.deleted`
3. Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`

### Configure URLs
In **Paths**:
- Sign In: `/sign-in`
- Sign Up: `/sign-up`
- After Sign In: `/dashboard`
- After Sign Up: `/onboarding`

---

## 4. Vercel Deployment

### Environment Variables

Set ALL of these in Vercel Dashboard → Settings → Environment Variables:

```bash
# === DATABASE ===
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# === SUPABASE STORAGE ===
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === CLERK AUTH ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# === CLERK URLS ===
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# === REDIS QUEUE ===
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

# === API URLS ===
NEXT_PUBLIC_APP_URL=https://play.gameview.com
NEXT_PUBLIC_STUDIO_URL=https://studio.gameview.com

# === AI (Optional for SPARK) ===
ANTHROPIC_API_KEY=sk-ant-xxx

# === STRIPE (Optional for payments) ===
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Deploy Commands
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Studio
cd apps/studio
vercel --prod

# Deploy Player
cd apps/player
vercel --prod
```

---

## 5. GPU Processing Setup (Modal - Recommended)

Modal provides serverless GPU processing that scales to zero when idle. This is the recommended approach for production.

### Prerequisites
- Modal account (modal.com)
- Python 3.11+ installed locally
- Modal CLI authenticated

### Step 1: Install Modal CLI
```bash
pip install modal
modal token new  # Opens browser to authenticate
```

### Step 2: Create Supabase Secret in Modal
```bash
modal secret create supabase-credentials \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 3: Deploy the Worker
```bash
cd packages/processing
modal deploy modal_worker.py
```

### Step 4: Add Modal Token to Vercel
1. Go to Modal Dashboard → Settings → API Tokens
2. Create a new token
3. Add to Vercel environment variables:
   - `MODAL_API_TOKEN` = `token-id:token-secret` format

### Modal Pricing
- **T4 GPU**: ~$0.10/hr (~$0.05-0.15 per production)
- **A10G GPU**: ~$0.30/hr (~$0.15-0.30 per production)
- **A100 GPU**: ~$2.00/hr (~$0.50-1.00 per production)

Modal only charges when processing - zero cost when idle.

---

## 5b. Alternative: Self-hosted Worker (Legacy)

For self-hosted GPU processing, use the BullMQ worker:

### Option A: Local Development
```bash
# Start worker locally
cd packages/queue
REDIS_URL="your-upstash-url" \
DATABASE_URL="your-supabase-url" \
SUPABASE_SERVICE_ROLE_KEY="your-key" \
NEXT_PUBLIC_SUPABASE_URL="your-url" \
pnpm worker
```

### Option B: Docker Container
```dockerfile
# Dockerfile.worker
FROM node:18-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/queue ./packages/queue
COPY packages/database ./packages/database

# Install
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Set working directory
WORKDIR /app/packages/queue

# Run worker
CMD ["pnpm", "worker"]
```

Build and run:
```bash
docker build -f Dockerfile.worker -t gv-worker .
docker run -d \
  -e REDIS_URL="rediss://..." \
  -e DATABASE_URL="postgresql://..." \
  -e SUPABASE_SERVICE_ROLE_KEY="..." \
  -e NEXT_PUBLIC_SUPABASE_URL="..." \
  gv-worker
```

### Option C: Railway/Render Deployment
1. Create new service from GitHub repo
2. Set root directory to `packages/queue`
3. Set start command: `pnpm worker`
4. Add all environment variables
5. Deploy

### Option D: GPU Cloud (RunPod/Lambda Labs)
For actual video processing with gvcore-cli:
1. Rent GPU instance (RTX 3090+ recommended)
2. Install CUDA, FFmpeg, gvcore-cli
3. Clone repo and run worker
4. Configure as systemd service for auto-restart

---

## 6. Testing the Full Pipeline

### 1. Test Database Connection
```bash
cd packages/database
pnpm db:push  # Should complete without errors
```

### 2. Test Redis Connection
```bash
cd packages/queue
REDIS_URL="your-url" node -e "
const Redis = require('ioredis');
const r = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
r.ping().then(res => { console.log('Redis:', res); r.quit(); });
"
```

### 3. Test Queue Operations
```bash
# Terminal 1: Start worker
cd packages/queue
REDIS_URL="..." pnpm worker

# Terminal 2: Add test job
curl -X POST https://gvdw.vercel.app/api/productions/queue \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=..." \
  -d '{"productionId":"test-123","experienceId":"exp-123","creatorId":"cr-123","sourceVideos":[{"url":"...","filename":"test.mp4","size":1000}],"preset":"fast"}'
```

### 4. Test End-to-End
1. Sign in to Studio app
2. Create new production
3. Upload videos
4. Select quality preset
5. Submit → Should show "Queued" status
6. Worker picks up job → Progress updates
7. Completion → PLY file available

---

## 7. Monitoring & Debugging

### Upstash Console
- View queue length
- Monitor Redis memory usage
- See connection count

### Vercel Logs
```bash
vercel logs --follow
```

### Worker Logs
The worker outputs progress:
```
[Worker] Starting production worker...
[Worker] Connected to Redis
[Worker] Processing job: prod_xxx
[Worker] Stage: downloading (5%)
[Worker] Stage: frame_extraction (20%)
[Worker] Stage: colmap (40%)
[Worker] Stage: brush (90%)
[Worker] Stage: uploading (95%)
[Worker] Job completed: prod_xxx
```

### BullMQ Dashboard (Optional)
Install bull-board for visual monitoring:
```bash
npm install @bull-board/express @bull-board/api
```

---

## 8. Cost Estimates

| Service | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| Supabase | 500MB DB, 1GB Storage | $25/mo Pro | Pro needed for >50MB uploads |
| Upstash | 10K commands/day | $10-25/mo | Based on usage |
| Clerk | 10K MAU | $25/mo Pro | Scale with users |
| Vercel | 100GB bandwidth | $20/mo Pro | Scale with traffic |
| GPU Processing | - | $0.50-2/hr | Per production job |

**MVP Monthly:** ~$25-50 (fixed costs)
**100 productions/mo:** ~$100-200 (including GPU time)

---

## 9. Security Checklist

- [ ] All secrets in environment variables, never in code
- [ ] Supabase RLS policies enabled
- [ ] CLERK_WEBHOOK_SECRET validates webhook signatures
- [ ] SUPABASE_SERVICE_ROLE_KEY only on backend
- [ ] CORS configured for production domains
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all endpoints

---

## Quick Reference: All Environment Variables

```bash
# Database
DATABASE_URL=
DIRECT_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Redis (optional if using Modal)
REDIS_URL=

# Modal GPU Processing (Recommended)
MODAL_API_TOKEN=

# URLs
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_STUDIO_URL=

# AI (Optional)
ANTHROPIC_API_KEY=

# Stripe (Optional)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Worker (for processing server only)
GVCORE_CLI_PATH=/usr/local/bin/gvcore-cli
BRUSH_PATH=/opt/brush
WORK_DIR=/tmp/gv-processing
WORKER_CONCURRENCY=1
```
