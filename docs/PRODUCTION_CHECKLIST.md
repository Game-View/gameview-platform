# Game View Production Checklist

Complete checklist for running GVDW in production. Check each item.

---

## 1. Supabase PostgreSQL Database

### Setup
- [ ] Supabase project created
- [ ] Database password saved securely

### Environment Variables (Vercel)
- [ ] `DATABASE_URL` - Connection string (Session pooler, port 5432)
  ```
  postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
  ```

### Database Schema
- [ ] Schema pushed to Supabase
  ```bash
  cd packages/database && pnpm db:push
  ```
- [ ] Verify tables exist: `User`, `Creator`, `Experience`, `ProcessingJob`, etc.

### Verification
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

## 2. Supabase Storage

### Buckets Required
| Bucket | Public | Purpose |
|--------|--------|---------|
| `production-videos` | No | Source video uploads |
| `production-outputs` | Yes | PLY files, thumbnails |
| `avatars` | Yes | User profile images |

### Setup Steps
1. Go to Supabase Dashboard → Storage → New Bucket
2. Create each bucket with correct public/private setting
3. Add storage policies (see below)

### Storage Policies
For **production-videos** (private):
```sql
-- Allow authenticated uploads
CREATE POLICY "Users can upload videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'production-videos');
```

For **production-outputs** (public):
```sql
-- Public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'production-outputs');
```

### Environment Variables (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Project URL
  ```
  https://[project-ref].supabase.co
  ```
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (backend only!)

### Verification
- [ ] Can upload test file to `production-videos` bucket
- [ ] Can read from `production-outputs` bucket

---

## 3. Clerk Authentication

### Setup
- [ ] Clerk application created
- [ ] Sign-in methods configured (Email, Google, etc.)

### Environment Variables (Vercel)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - pk_live_xxx or pk_test_xxx
- [ ] `CLERK_SECRET_KEY` - sk_live_xxx or sk_test_xxx
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/dashboard`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/onboarding`

### Webhook Configuration (CRITICAL!)
1. Go to Clerk Dashboard → Webhooks → Add Endpoint
2. Configure:
   - **URL**: `https://gvdw.vercel.app/api/webhooks/clerk`
   - **Events**: `user.created`, `user.updated`, `user.deleted`
3. Copy Signing Secret

- [ ] `CLERK_WEBHOOK_SECRET` - whsec_xxx (from webhook endpoint)

### Verification
- [ ] Can sign up new user
- [ ] User appears in Clerk Dashboard
- [ ] User appears in Supabase `User` table (via webhook OR fallback)

---

## 4. Upstash Redis (Queue)

### Setup
- [ ] Upstash database created
- [ ] Region matches Vercel (e.g., us-east-1)
- [ ] TLS enabled

### Environment Variables (Vercel)
- [ ] `REDIS_URL` - Redis connection string with TLS
  ```
  rediss://default:[password]@[host].upstash.io:6379
  ```
  **Note**: Must be `rediss://` (double 's') for TLS

### Verification
```bash
# Test connection (run locally with env var)
node -e "
const Redis = require('ioredis');
const r = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
r.ping().then(res => { console.log('Redis:', res); r.quit(); });
"
```

---

## 5. Vercel Deployment

### Environment Variables Summary
All variables must be set in Vercel → Settings → Environment Variables:

| Variable | Source | Required |
|----------|--------|----------|
| `DATABASE_URL` | Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | ✅ |
| `CLERK_SECRET_KEY` | Clerk | ✅ |
| `CLERK_WEBHOOK_SECRET` | Clerk Webhooks | ✅ |
| `REDIS_URL` | Upstash | ✅ |
| `ANTHROPIC_API_KEY` | Anthropic | Optional (SPARK AI) |
| `STRIPE_SECRET_KEY` | Stripe | Optional (Payments) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | Optional (Payments) |

### Deployment
- [ ] All environment variables set
- [ ] Fresh deployment (not from cache)
- [ ] No build errors

---

## 6. Paid Tier Requirements

### Free Tier Limits (May Cause Issues)

| Service | Free Limit | Upgrade If... |
|---------|------------|---------------|
| **Supabase** | 500MB DB, 1GB storage, 50MB file upload | Files > 50MB |
| **Upstash** | 10K commands/day | High traffic |
| **Clerk** | 10K MAU | > 10K users |
| **Vercel** | 100GB bandwidth | High traffic |

### Recommended for Production
- [ ] Supabase Pro ($25/mo) - Required for video uploads > 50MB
- [ ] Upstash Pay-as-you-go - Scales with usage
- [ ] Clerk Pro ($25/mo) - If > 10K users
- [ ] Vercel Pro ($20/mo) - For team features, more bandwidth

---

## 7. End-to-End Test

### Test Sequence
1. [ ] Sign out completely (clear cookies if needed)
2. [ ] Sign up with new email
3. [ ] Complete onboarding (4 steps)
4. [ ] Arrive at Dashboard
5. [ ] Click "New Production"
6. [ ] Upload 2+ video files (< 50MB each for free tier)
7. [ ] Select quality preset
8. [ ] Click Submit
9. [ ] See "Queued" status (not "Failed")

### If Production Still Fails
1. Check Vercel Runtime Logs for error details
2. Verify user exists in Supabase `User` table
3. Verify Creator exists in Supabase `Creator` table
4. Check Redis connection in Upstash console

---

## 8. Common Issues & Solutions

### "Failed to create production"
- **Cause**: User/Creator not in database
- **Fix**: Redeploy with latest code (includes fallback creation)

### "Profile not found"
- **Cause**: User in Clerk but not Supabase
- **Fix**: Set up Clerk webhook OR redeploy (includes fallback)

### Upload fails for large files
- **Cause**: Supabase free tier 50MB limit
- **Fix**: Upgrade to Supabase Pro

### "Unable to connect to Redis"
- **Cause**: Wrong REDIS_URL format
- **Fix**: Ensure `rediss://` (double 's') for TLS

### Webhook not firing
- **Cause**: CLERK_WEBHOOK_SECRET not set or wrong
- **Fix**: Copy exact secret from Clerk webhook endpoint

---

## Quick Verification Commands

### Check Supabase Tables
```sql
-- Count users
SELECT COUNT(*) FROM "User";

-- Check if your user exists
SELECT * FROM "User" WHERE email = 'your@email.com';

-- Check Creator records
SELECT * FROM "Creator";
```

### Check Redis
```bash
# In Upstash Console → CLI tab
PING
KEYS *
```

### Check Vercel Logs
1. Vercel Dashboard → Project → Logs
2. Filter by "error" or look for red entries
3. Look for `[tRPC]` prefixed messages

---

## Status Summary

Fill in as you verify:

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase DB | ⬜ | |
| Supabase Storage | ⬜ | |
| Clerk Auth | ⬜ | |
| Clerk Webhook | ⬜ | |
| Upstash Redis | ⬜ | |
| Vercel Deploy | ⬜ | |
| E2E Test | ⬜ | |

Legend: ✅ Working | ⚠️ Partial | ❌ Failed | ⬜ Not Tested
