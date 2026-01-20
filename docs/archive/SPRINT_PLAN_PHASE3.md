# Phase 3: PLATFORM - Sprint Plan

**Status:** In Progress
**Start Date:** January 16, 2026
**Goal:** Make published experiences playable and shareable

---

## Executive Summary

Phase 2 created the full creator workflow. Phase 3 focuses on the **player experience** - letting audiences discover, play, and enjoy the experiences creators build.

The player app has excellent discovery/browse infrastructure. The critical gap is the **interactive playback system** - rendering placed objects, handling interactions, and evaluating game logic.

---

## Sprint 18: Interactive Playback (CRITICAL) - COMPLETE ✅

**Goal:** Players can actually play published experiences with full interactivity
**Status:** Complete (January 16, 2026)

### 18.1 Scene Data Fetching ✅
**Priority:** P0
**Files:**
- `apps/player/src/app/experience/[id]/play/page.tsx`
- `packages/api/src/trpc/routers/experience.ts`
- `packages/database/prisma/schema.prisma` (added scenesData, gameConfig, briefId)

**Tasks:**
- [x] Fetch placed objects from experience/scene data
- [x] Fetch game config (win conditions, objectives, scoring)
- [x] Fetch portals and spawn points
- [x] Load interaction configurations

**Implementation Notes:**
- Added `scenesData` (JSONB) and `gameConfig` (JSONB) fields to Experience model
- Updated publish API to bundle scene data with published experiences
- Created migration SQL for existing databases

### 18.2 Port Playtest Components to Player ✅
**Priority:** P0
**Files:**
- `apps/player/src/components/playback/PlaybackMode.tsx` (new)
- `apps/player/src/stores/playback-store.ts` (new)
- `apps/player/src/lib/player-runtime.ts` (new)

**Tasks:**
- [x] Port `PlaytestMode` core (without debug toolbar)
- [x] Port `FirstPersonControls` for player movement
- [x] Port `InteractionRuntime` for triggers
- [x] Port `PlayerHUD` for score/objectives/inventory
- [x] Port GLTF object rendering
- [x] Port audio playback system

**Implementation Notes:**
- Created simplified `PlaybackMode` component for player (no debug features)
- Created `playback-store` - streamlined version of playtest-store
- First-person controls with pointer lock API
- Click and proximity interaction support
- Web Audio API for sound playback

### 18.3 Win/Completion Flow ✅
**Priority:** P0
**Files:**
- `apps/player/src/components/playback/PlaybackMode.tsx` (CompletionOverlay)
- `packages/api/src/trpc/routers/playHistory.ts` (updated complete mutation)
- `packages/database/prisma/schema.prisma` (added score, collectibles, hasWon)

**Tasks:**
- [x] Show victory screen on win
- [x] Track completion in database (play history)
- [x] Show rewards/achievements earned
- [x] Option to replay or exit to experience page

**Implementation Notes:**
- Victory/failure screen with score, collectibles, time stats
- Play session recorded via tRPC `playHistory.complete` mutation
- Best score tracking (keeps highest score across plays)

### 18.4 Player-Specific Adjustments ✅
**Priority:** P1
**Tasks:**
- [x] Remove debug tools (player doesn't need them)
- [x] Add "Report Issue" button
- [x] Add share button on completion
- [ ] Mobile touch controls (stretch goal - deferred)

**Implementation Notes:**
- No debug toolbar in player app
- Report Issue opens email with experience ID pre-filled
- Share button copies experience URL to clipboard
- Pause/Resume button in HUD

**Sprint 18 Exit Criteria:** ALL MET ✅
- [x] Published experience loads with all placed objects
- [x] Interactions work (click, proximity, collect, look)
- [x] Win conditions trigger victory screen
- [x] Play session recorded in database

---

## Sprint 19: Analytics & Creator Dashboard

**Goal:** Creators can see how their experiences perform

### 19.1 Play Session Tracking
**Priority:** P1
**Tasks:**
- [ ] Track session start/end times
- [ ] Track completion status
- [ ] Track score achieved
- [ ] Track time spent

### 19.2 Creator Analytics Page
**Priority:** P1
**Files:**
- `apps/studio/src/app/analytics/page.tsx` (new)

**Tasks:**
- [ ] Total plays over time chart
- [ ] Completion rate
- [ ] Average session duration
- [ ] Top experiences by plays
- [ ] Geographic distribution (if available)

### 19.3 Experience-Level Stats
**Priority:** P2
**Tasks:**
- [ ] Play count on experience cards
- [ ] Completion percentage badge
- [ ] Average rating display

**Sprint 19 Exit Criteria:**
- [ ] Creators can see play counts and completion rates
- [ ] Analytics page shows trends over time

---

## Sprint 20: Payments & Monetization

**Goal:** Creators can charge for experiences, players can purchase

### 20.1 Stripe Integration
**Priority:** P1
**Tasks:**
- [ ] Set up Stripe Connect for creators
- [ ] Create checkout flow for paid experiences
- [ ] Handle webhooks for payment confirmation
- [ ] Store purchase records

### 20.2 Purchase Verification
**Priority:** P1
**Tasks:**
- [ ] Check ownership before allowing play
- [ ] Show purchase prompt for unpurchased paid content
- [ ] Handle free experiences (no gate)

### 20.3 Creator Payouts
**Priority:** P2
**Tasks:**
- [ ] Dashboard showing earnings
- [ ] Payout request flow
- [ ] Transaction history

**Sprint 20 Exit Criteria:**
- [ ] Players can purchase paid experiences
- [ ] Creators receive payments via Stripe

---

## Sprint 21: Social & Engagement

**Goal:** Players share experiences, follow creators, build community

### 21.1 Share System
**Priority:** P1
**Tasks:**
- [ ] Generate shareable links
- [ ] Social media share buttons (Twitter, Facebook)
- [ ] Copy link functionality
- [ ] Open Graph meta tags for previews

### 21.2 Rating & Reviews
**Priority:** P2
**Tasks:**
- [ ] Star rating on completion
- [ ] Written review option
- [ ] Display ratings on experience cards

### 21.3 Leaderboards
**Priority:** P2
**Tasks:**
- [ ] Per-experience leaderboards (by score)
- [ ] Global leaderboards
- [ ] Friend leaderboards

**Sprint 21 Exit Criteria:**
- [ ] Players can share experiences
- [ ] Ratings displayed on experience cards

---

## Phase 3 Completion Checklist

### P0 - Must Have (Sprint 18) ✅
- [x] Interactive playback works end-to-end
- [x] Published experiences are playable
- [x] Win conditions trigger properly
- [x] Play sessions tracked

### P1 - Should Have (Sprint 19-20)
- [ ] Creator analytics dashboard
- [ ] Payment integration (Stripe)
- [ ] Purchase verification

### P2 - Nice to Have (Sprint 21)
- [ ] Social sharing
- [ ] Ratings/reviews
- [ ] Leaderboards

---

## Technical Architecture

### Shared Code Strategy

The playtest system from Studio can be largely reused in Player:

| Studio Component | Player Usage |
|------------------|--------------|
| `PlaytestMode.tsx` | Core, remove debug features |
| `FirstPersonControls.tsx` | Direct reuse |
| `InteractionRuntime.tsx` | Direct reuse |
| `PlayerHUD.tsx` | Adapt (remove edit features) |
| `playtest-store.ts` | Direct reuse |
| `player-runtime.ts` | Direct reuse |

**Option A:** Copy components to player app (simple, some duplication)
**Option B:** Create shared `@gameview/playtest` package (cleaner, more setup)

Recommendation: **Option A** for speed, refactor later if needed.

---

## Success Metrics

**Phase 3 Exit Criteria (from Product Brief):**
> Players can discover, play, and complete published experiences. Creators can see analytics and earn revenue.

**Validation Test:**
1. Publish experience from Studio
2. Open player app, find experience in browse
3. Click Play, load into 3D scene
4. See placed objects and interact with them
5. Complete win condition, see victory screen
6. Check creator analytics shows the play

---

*Document created: January 16, 2026*
*Building on Phase 2 completion*
