# Game View Platform - Production Cost Analysis

## Overview

This document analyzes the cost structure for running Game View productions to inform pricing decisions.

---

## Cost Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    COST PER PRODUCTION                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Video Storage (input)         → Supabase Storage            │
│  2. 3D Processing (GPU)           → Cloud GPU / On-premise      │
│  3. Output Storage (PLY + assets) → Supabase Storage            │
│  4. Database Operations           → Supabase Database           │
│  5. Bandwidth/Egress              → Supabase + Vercel           │
│  6. API Compute                   → Vercel Functions            │
│  7. AI (Spark chat)               → Claude API                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Pricing Reference

### Supabase Pricing (as of Dec 2024)

| Plan | Price | Database | Storage | Egress | File Size Limit |
|------|-------|----------|---------|--------|-----------------|
| **Free** | $0/mo | 500MB | 1GB | 5GB | 50MB |
| **Pro** | $25/mo | 8GB | 100GB | 250GB | Configurable |
| **Team** | $599/mo | Custom | Custom | Custom | Custom |

**Pro Overages:**
- Storage: $0.021/GB after 100GB
- Egress: $0.09/GB after 250GB
- Database: $0.125/GB after 8GB

### Vercel Pricing

| Plan | Price | Serverless | Bandwidth | Build Minutes |
|------|-------|------------|-----------|---------------|
| **Hobby** | $0/mo | 100GB-hrs | 100GB | 6000 min |
| **Pro** | $20/mo/member | 1000GB-hrs | 1TB | Unlimited |

### Claude API Pricing (Anthropic)

| Model | Input | Output |
|-------|-------|--------|
| Claude 3 Sonnet | $3/M tokens | $15/M tokens |
| Claude 3 Haiku | $0.25/M tokens | $1.25/M tokens |

### GPU Processing (Estimated)

| Provider | GPU | Cost/Hour | Notes |
|----------|-----|-----------|-------|
| RunPod | RTX 4090 | ~$0.44/hr | Spot pricing |
| Lambda Labs | A10 | ~$0.60/hr | On-demand |
| AWS | g5.xlarge | ~$1.00/hr | On-demand |
| **Target (serverless)** | Various | ~$0.30/job | Future goal per Appendix F |

---

## Production Size Tiers

### Tier Definitions

| Tier | Cameras | Input Video | Processing Time | Output Size |
|------|---------|-------------|-----------------|-------------|
| **Small** | 2-3 | ~500MB | 15-30 min | ~100MB |
| **Medium** | 4-6 | ~1GB | 30-60 min | ~200MB |
| **Large** | 8-12 | ~2GB | 60-120 min | ~400MB |
| **Enterprise** | 12+ | 4GB+ | 2-4 hrs | ~800MB |

### Assumptions

- Average video file: ~150-200MB per camera angle
- Video duration: 30-60 seconds per camera
- PLY output: ~100KB per 1000 splats, typical 500K-2M splats
- cameras.json: ~1-5MB
- Thumbnails/previews: ~10-20MB total

---

## Cost Per Production (Detailed)

### Small Production (2-3 cameras, ~500MB input)

| Component | Calculation | Cost |
|-----------|-------------|------|
| **Input Storage** | 500MB × $0.021/GB | $0.01 |
| **GPU Processing** | 0.5 hr × $0.50/hr | $0.25 |
| **Output Storage** | 100MB × $0.021/GB | $0.002 |
| **Database Ops** | Minimal | ~$0.001 |
| **Spark AI (5K tokens)** | 5K × $3/M | $0.015 |
| **Egress (1 view)** | 100MB × $0.09/GB | $0.009 |
| **TOTAL (creation)** | | **~$0.29** |
| **TOTAL (per view)** | | **~$0.01** |

### Medium Production (4-6 cameras, ~1GB input)

| Component | Calculation | Cost |
|-----------|-------------|------|
| **Input Storage** | 1GB × $0.021/GB | $0.02 |
| **GPU Processing** | 1 hr × $0.50/hr | $0.50 |
| **Output Storage** | 200MB × $0.021/GB | $0.004 |
| **Database Ops** | Minimal | ~$0.002 |
| **Spark AI (10K tokens)** | 10K × $3/M | $0.03 |
| **Egress (1 view)** | 200MB × $0.09/GB | $0.018 |
| **TOTAL (creation)** | | **~$0.56** |
| **TOTAL (per view)** | | **~$0.02** |

### Large Production (8-12 cameras, ~2GB input)

| Component | Calculation | Cost |
|-----------|-------------|------|
| **Input Storage** | 2GB × $0.021/GB | $0.04 |
| **GPU Processing** | 2 hr × $0.50/hr | $1.00 |
| **Output Storage** | 400MB × $0.021/GB | $0.008 |
| **Database Ops** | Minimal | ~$0.003 |
| **Spark AI (15K tokens)** | 15K × $3/M | $0.045 |
| **Egress (1 view)** | 400MB × $0.09/GB | $0.036 |
| **TOTAL (creation)** | | **~$1.10** |
| **TOTAL (per view)** | | **~$0.04** |

---

## Monthly Fixed Costs

### Minimum Viable Infrastructure

| Service | Plan | Cost/Month | Notes |
|---------|------|------------|-------|
| Supabase | Pro | $25 | Required for >50MB files |
| Vercel | Hobby→Pro | $0-20 | Hobby works for testing |
| Clerk | Free→Pro | $0-25 | Free tier: 10K MAU |
| Upstash | Free→Pay-as-go | $0-10 | Free tier: 10K requests/day |
| **TOTAL** | | **$25-80/mo** | |

### At Scale (100+ productions/month)

| Service | Plan | Cost/Month | Notes |
|---------|------|------------|-------|
| Supabase | Pro + overages | $50-200 | Depends on storage/egress |
| Vercel | Pro | $20+ | Per team member |
| Clerk | Pro | $25+ | Depends on MAU |
| GPU | Variable | $50-500 | Depends on volume |
| **TOTAL** | | **$145-745/mo** | |

---

## Revenue Model Scenarios

### Scenario 1: SaaS Subscription Only

| Tier | Price/Month | Included | Overage |
|------|-------------|----------|---------|
| **Starter** | $29 | 3 small productions | $5/additional |
| **Pro** | $99 | 10 medium productions | $8/additional |
| **Enterprise** | $499 | Unlimited | Custom |

**Margin Analysis (Pro tier):**
- Revenue: $99
- Cost (10 medium productions): ~$5.60
- Infrastructure: ~$8/user share
- **Gross Margin: ~86%**

### Scenario 2: Pay-Per-Production

| Production Size | Price | Our Cost | Margin |
|-----------------|-------|----------|--------|
| Small | $9.99 | ~$0.30 | 97% |
| Medium | $19.99 | ~$0.56 | 97% |
| Large | $39.99 | ~$1.10 | 97% |

### Scenario 3: Hybrid (Free tier + paid publishing)

| Component | Price |
|-----------|-------|
| Platform access | Free |
| Create productions | Free |
| Publish to platform | $4.99/production |
| Premium features | $19.99/month |

---

## Player/Viewer Costs

Each time a player views an experience:

| Component | Cost per View |
|-----------|--------------|
| PLY download (200MB avg) | $0.018 |
| Streaming/bandwidth | ~$0.005 |
| API calls | ~$0.001 |
| **TOTAL** | **~$0.02-0.04** |

### At Scale (10K views)

- 10,000 views × $0.03 = **$300 egress cost**
- Need to factor into creator pricing or player pricing

---

## Cost Optimization Strategies

### 1. CDN Caching
- Cache PLY files at edge
- Reduce Supabase egress
- Estimated savings: 50-70% on egress

### 2. Progressive Loading
- Stream PLY data instead of full download
- Reduce initial bandwidth
- Better user experience

### 3. Compression
- DRACO compression for PLY files
- Reduce file sizes 50-80%
- Trade-off: slight quality loss, CPU decode time

### 4. Storage Tiering
- Move old productions to cold storage
- Supabase doesn't have tiering yet
- Future optimization

### 5. GPU Optimization
- Batch processing
- Spot/preemptible instances
- Target: $0.30/production (per Appendix F)

---

## Break-Even Analysis

### Monthly Fixed Costs: ~$50 (minimum)

| Productions/Month | Avg Revenue Each | Monthly Revenue | Profit |
|-------------------|------------------|-----------------|--------|
| 5 | $20 | $100 | $50 |
| 10 | $20 | $200 | $150 |
| 25 | $20 | $500 | $450 |
| 50 | $20 | $1000 | $950 |

**Break-even: ~3 productions/month at $20 each**

---

## Recommendations

### Phase 1 (Beta/Launch)
- Start with **Supabase Pro** ($25/mo) - required for video uploads
- Use **Vercel Hobby** (free) - sufficient for initial traffic
- **Clerk Free** tier - 10K MAU is plenty initially
- **Total: ~$25/mo** fixed

### Phase 2 (Growing)
- Add CDN for PLY caching (CloudFlare free tier)
- Move to Vercel Pro if needed ($20/mo)
- Implement GPU job queue with spot pricing
- **Target: <$0.50/production cost**

### Phase 3 (Scale)
- Negotiate enterprise rates with Supabase
- Implement serverless GPU ($0.30/job target)
- Consider self-hosted processing for volume
- **Target: <$0.20/production cost**

---

## Key Metrics to Track

| Metric | Why It Matters |
|--------|----------------|
| Cost per production | Core unit economics |
| Cost per view | Player economics |
| Storage growth rate | Capacity planning |
| Egress by production | Popular content costs more |
| Processing time | GPU cost driver |
| Claude token usage | AI cost driver |

---

## Summary

| Metric | Value |
|--------|-------|
| **Min monthly cost** | ~$25 (Supabase Pro) |
| **Cost per small production** | ~$0.30 |
| **Cost per medium production** | ~$0.56 |
| **Cost per large production** | ~$1.10 |
| **Cost per view** | ~$0.02-0.04 |
| **Recommended starting price** | $9.99-39.99/production |
| **Target gross margin** | 85-97% |

---

*Last updated: December 2024*
