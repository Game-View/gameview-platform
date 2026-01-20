# Game View: Sprint Plan to Beta
## Balanced Timeline (~3-4 weeks)
**Version 1.0 | December 2024**

---

## Executive Summary

This plan takes Game View from development to beta using a balanced approach:
- **Timeline**: ~3-4 weeks of focused development
- **Scope**: Brief 1.2 core features (Spark + Build + Platform basics)
- **Approach**: Ship working features daily, iterate based on testing
- **GPU Processing**: ✅ Implemented with Modal + CUDA-accelerated GLOMAP
- **Deferred**: iPhone LiDAR, WebGPU browser viewer

---

## Current State

### What's Built

| Component | Status | Notes |
|-----------|--------|-------|
| **Spark (Phase 1)** | ✅ 90% Complete | AI brief creation, conversation flow, brief storage |
| **Studio App** | 🔄 Deploying | TypeScript fixes in progress, deploying to Vercel |
| **Player App** | ⏳ Ready | Built, needs deployment |
| **Shared Packages** | ✅ Built | @gameview/api, database, queue, types, ui |
| **3D Viewer** | 🔄 Partial | GaussianSplats component exists, needs integration |
| **Object Library** | 🔄 Partial | UI exists, needs population + upload flow |
| **Interactions** | 🔄 Partial | Types defined, needs UI + runtime |
| **Game Logic** | 🔄 Partial | Types defined, needs UI + runtime |

### Infrastructure

| Service | Status | Environment |
|---------|--------|-------------|
| **Clerk** | ✅ Configured | Keys set, auth working |
| **Supabase** | ✅ Configured | Database + storage buckets |
| **Upstash Redis** | ✅ Configured | BullMQ queue ready |
| **Prisma** | ✅ Configured | v6 schema deployed |
| **Vercel** | ✅ Deployed | Studio live, Player pending |
| **Modal** | ✅ Configured | GPU processing with CUDA GLOMAP |

---

## Environment Strategy

### Development Environment
```
URL: gameview-studio-dev.vercel.app / gameview-player-dev.vercel.app
Purpose: Active development, testing, breaking things
Clerk: Development keys (pk_test_...)
Supabase: Same project, different branch or prefixed tables
Redis: Upstash dev database
```

### Production Environment (Beta)
```
URL: studio.gameview.app / play.gameview.app (or Vercel subdomains)
Purpose: Beta users, real data, stable
Clerk: Production keys (pk_live_...)
Supabase: Production project or main branch
Redis: Upstash prod database
```

### Setup Steps
1. Complete current Studio deployment (dev)
2. Deploy Player app (dev)
3. Create production Vercel projects
4. Configure production environment variables
5. Set up custom domains (optional for beta)

---

## Sprint Structure

**Sprint Length**: 2-3 days
**Daily Rhythm**:
- Morning: Review overnight builds, fix issues
- Day: Implement features, commit frequently
- Evening: Deploy, test, document blockers

**Release Cadence**: Deploy to dev on every push, promote to prod when stable

---

## Sprint Plan

### Sprint 0: Foundation (Days 1-2)
**Theme: "Get everything running"**

| Task | Priority | Owner | Status |
|------|----------|-------|--------|
| Complete Studio Vercel deployment | P0 | Claude | In Progress |
| Deploy Player app to Vercel | P0 | Claude | Pending |
| Verify Clerk auth works end-to-end | P0 | Claude | Pending |
| Verify Supabase connection | P0 | Claude | Pending |
| Verify Redis queue connection | P0 | Claude | Pending |
| Test Spark conversation flow | P1 | James | Pending |
| Document environment variables | P1 | Claude | Pending |

**Exit Criteria**:
- ✅ Studio loads at Vercel URL
- ✅ Player loads at Vercel URL
- ✅ User can sign up/sign in
- ✅ Spark conversation works
- ✅ Brief saves to database

---

### Sprint 1: Video Upload + 3D Processing (Days 3-5)
**Theme: "Video in, 3D out"**

| Task | Priority | Notes |
|------|----------|-------|
| Video upload UI component | P0 | Drag-drop, multi-file, progress |
| Video storage to Supabase | P0 | Store in productions bucket |
| Create production record in DB | P0 | Link video to brief/project |
| 3D processing queue job | P0 | BullMQ job to process video |
| Processing status UI | P0 | Show progress, estimated time |
| Scene storage | P0 | Store .ply/.splat to Supabase |

**Note**: For beta, we may simulate 3D processing with sample Gaussian splats if CLI integration is complex. Real processing can be post-beta enhancement.

**Exit Criteria**:
- ✅ Creator uploads video
- ✅ Processing job is queued
- ✅ Progress is visible
- ✅ Scene appears when complete

---

### Sprint 2: 3D Scene Viewer (Days 6-8)
**Theme: "See and navigate your space"**

| Task | Priority | Notes |
|------|----------|-------|
| Integrate GaussianSplats viewer | P0 | Already have component, wire it up |
| Load scene from Supabase storage | P0 | Fetch .ply/.splat, render |
| Navigation controls (WASD/mouse) | P0 | First-person navigation |
| Viewer toolbar | P1 | Fullscreen, reset view, help |
| Scene loading progress | P1 | Show loading state |
| Performance optimization | P2 | LOD, culling if needed |

**Exit Criteria**:
- ✅ Creator sees their processed 3D scene
- ✅ Can navigate with WASD + mouse
- ✅ 60fps on mid-tier hardware
- ✅ Works in browser (no download)

---

### Sprint 3: Object Library + Placement (Days 9-12)
**Theme: "Add things to your world"**

| Task | Priority | Notes |
|------|----------|-------|
| Object library panel UI | P0 | Categories, search, grid view |
| Populate pre-loaded objects | P0 | 25-50 starter objects (.glb) |
| Object preview (3D thumbnail) | P1 | See object before placing |
| Object upload flow | P1 | Creator uploads custom .glb |
| Drag-drop to scene | P0 | Drag from library, drop in 3D |
| Object placement (position) | P0 | Click/drag to position |
| Object manipulation (rotate/scale) | P0 | Transform gizmo |
| Save placements to DB | P0 | Persist object positions |
| Undo/redo | P2 | Nice to have for beta |

**Exit Criteria**:
- ✅ Library shows 25+ objects
- ✅ Creator drags object to scene
- ✅ Object can be moved, rotated, scaled
- ✅ Placements persist on reload

---

### Sprint 4: Interactions + Game Logic (Days 13-16)
**Theme: "Make it playable"**

| Task | Priority | Notes |
|------|----------|-------|
| Interaction panel UI | P0 | Select object → add interactions |
| Click/touch trigger | P0 | "When player clicks..." |
| Proximity trigger | P0 | "When player gets near..." |
| Collect action | P0 | Add item to inventory |
| Play sound action | P1 | Play audio clip |
| Show message action | P0 | Display text |
| Hide object action | P0 | Object disappears |
| Inventory system | P0 | Track collected items |
| Score system | P1 | Track points |
| Win condition UI | P0 | "When X happens, player wins" |
| Win condition runtime | P0 | Detect and trigger completion |

**Exit Criteria**:
- ✅ Creator configures "When clicked, add to inventory"
- ✅ Creator sets "Find all 5 items to win"
- ✅ Interactions work in test mode
- ✅ Win condition triggers completion

---

### Sprint 5: Testing + Player Experience (Days 17-19)
**Theme: "Test it, play it, share it"**

| Task | Priority | Notes |
|------|----------|-------|
| Testing mode (Studio) | P0 | Creator plays their experience |
| Debug overlay | P1 | Show triggers, hitboxes |
| Reset to start | P0 | Restart from beginning |
| Player app experience viewer | P0 | Load and play experience |
| Experience discovery page | P1 | Browse available experiences |
| Share link generation | P0 | Get link to share experience |
| Mobile-responsive player | P1 | Works on phone/tablet |

**Exit Criteria**:
- ✅ Creator tests complete experience
- ✅ Player loads experience via link
- ✅ Full play-through works
- ✅ Win condition awards completion

---

### Sprint 6: Polish + Beta Launch (Days 20-22)
**Theme: "Ship it"**

| Task | Priority | Notes |
|------|----------|-------|
| Production environment setup | P0 | Separate Vercel project |
| Production Clerk instance | P0 | Live keys, real users |
| Error handling pass | P0 | User-friendly errors |
| Loading states pass | P1 | Skeleton screens, spinners |
| Analytics setup | P2 | Basic event tracking |
| Beta invite flow | P1 | How users get access |
| Documentation for beta users | P1 | Quick start guide |
| Smoke test all features | P0 | End-to-end verification |
| **BETA LAUNCH** | P0 | 🚀 |

**Exit Criteria**:
- ✅ Production environment live
- ✅ First beta users can sign up
- ✅ Full flow works: Spark → Build → Test → Share → Play
- ✅ No critical bugs

---

## Feature Scope for Beta

### Included in Beta (Brief 1.2 Core)

| Feature | Phase | Priority |
|---------|-------|----------|
| User onboarding + profile | 1 | P0 |
| Spark AI conversation | 1 | P0 |
| Brief generation + editing | 1 | P0 |
| Brief storage + retrieval | 1 | P0 |
| Video upload | 2 | P0 |
| 3D scene processing | 2 | P0* |
| 3D scene viewer | 2 | P0 |
| Object library (25+ pre-loaded) | 2 | P0 |
| Object upload (.glb) | 2 | P1 |
| Drag-drop placement | 2 | P0 |
| Object manipulation | 2 | P0 |
| Interactions (click, proximity) | 2 | P0 |
| Actions (collect, message, hide) | 2 | P0 |
| Inventory tracking | 2 | P0 |
| Win condition | 2 | P0 |
| Testing mode | 2 | P0 |
| Player experience viewer | 3 | P0 |
| Share link | 3 | P0 |

*Note: May use sample scenes initially, full CLI processing is enhancement

### Deferred to Post-Beta

| Feature | Why Deferred |
|---------|--------------|
| iPhone LiDAR capture app | Innovation - requires native app development |
| ~~Serverless GPU~~ | ✅ **IMPLEMENTED** - Modal + CUDA GLOMAP |
| WebGPU browser viewer | Innovation - requires new renderer |
| Multi-venue experiences | Adds complexity, can do single-venue for beta |
| Player payments | Requires Stripe integration |
| Prize pools | Requires payment + legal |
| Creator subscriptions | Can be free for beta |
| Leaderboards | Enhancement |
| Advanced analytics | Enhancement |

---

## Risk Mitigation

### Risk 1: 3D Processing Too Complex
**Status**: ✅ **RESOLVED** - GPU-accelerated GLOMAP pipeline implemented on Modal
**Details**: Full video→3D pipeline operational with CUDA acceleration. Processing times reduced from ~8 hours (CPU) to ~10-30 minutes (GPU).

### Risk 2: Performance Issues
**Mitigation**: Limit scene size (max splats), implement LOD, test on target hardware early. If needed, reduce default quality.

### Risk 3: Object Library Too Small
**Mitigation**: Focus on quality over quantity. 25 good objects that work is better than 100 broken ones. Prioritize: collectibles, props, interactive objects.

### Risk 4: Scope Creep
**Mitigation**: This document is the scope. If it's not listed, it's post-beta. When in doubt, cut it.

---

## Daily Checklist During Sprints

### Every Day
- [ ] Pull latest changes
- [ ] Check Vercel deployments
- [ ] Fix any build errors
- [ ] Commit working code (small, frequent commits)
- [ ] Push to dev branch
- [ ] Test new features in dev environment
- [ ] Document blockers or decisions
- [ ] Update sprint tracking

### Every Sprint End
- [ ] All sprint tasks complete or explicitly deferred
- [ ] Dev environment stable
- [ ] Demo-able progress
- [ ] Sprint retrospective (what worked, what didn't)
- [ ] Plan adjustment if needed

---

## Beta Launch Checklist

### Pre-Launch (Day before)
- [ ] Production environment deployed
- [ ] All environment variables set
- [ ] DNS/domains configured (if using custom)
- [ ] Clerk production keys active
- [ ] Supabase production database has schema
- [ ] Sample experience works end-to-end
- [ ] Error monitoring active (Sentry or similar)
- [ ] Backup strategy confirmed

### Launch Day
- [ ] Smoke test all critical flows
- [ ] Invite first beta users
- [ ] Monitor for errors
- [ ] Be available for quick fixes
- [ ] Celebrate! 🎉

### Post-Launch (First week)
- [ ] Daily bug triage
- [ ] User feedback collection
- [ ] Quick fixes for critical issues
- [ ] Start prioritizing next iteration

---

## Success Metrics for Beta

### Technical
- [ ] Studio and Player load in <3 seconds
- [ ] 3D viewer runs at 60fps on mid-tier hardware
- [ ] No critical errors in first week
- [ ] <5% user-facing error rate

### User Experience
- [ ] Creator can complete Spark→Build→Test in <2 hours
- [ ] 80%+ of beta users complete their first brief
- [ ] 50%+ of beta users place at least one object
- [ ] At least 1 complete experience shared and played

### Business
- [ ] Beta users actively engaged
- [ ] Qualitative feedback collected
- [ ] Clear prioritization for next iteration
- [ ] Confidence in product direction

---

## Post-Beta Roadmap (Next Iteration)

### Immediate (Week after beta)
1. Bug fixes from beta feedback
2. Performance optimizations
3. UX improvements based on user struggles

### Short-term (2-4 weeks post-beta)
1. Full video→3D processing pipeline
2. Multi-venue support
3. More object library content
4. Audio system (sounds, music)

### Medium-term (1-2 months post-beta)
1. iPhone LiDAR capture app
2. Serverless GPU processing
3. WebGPU browser viewer
4. Creator subscriptions
5. Player payments

### Long-term (3+ months)
1. Prize pool management
2. Leaderboards + competitions
3. AI-generated objects
4. Vision Pro native app

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial sprint plan based on Brief 1.2 |
