# Sprint 21: MVP Polish & Social Features

> Created: January 19, 2026
> Status: Planning

---

## Context: What We Just Learned

During testing of the "complete" Phase 2 BUILD, we discovered critical issues:

| Issue | Status | Impact |
|-------|--------|--------|
| Splats not rendering in web editor | ✅ Fixed | Blocking - couldn't see 3D scenes |
| OrbitControls not responding | ✅ Fixed | Blocking - couldn't navigate scenes |
| WebGL context exhaustion | ✅ Fixed | Crash after navigation |
| First-person controls missing | ✅ Fixed | Motion exploration broken |
| Motion playback (timeline) | ❓ Untested | Core feature for motion rendering |
| Play button functionality | ❓ Untested | Core feature |

**Key Insight:** The HANDOFF document said "Scene Viewer: Complete" but real-world testing revealed critical gaps. We need more rigorous testing before declaring features complete.

---

## MVP Definition: What Actually Matters

From the product brief, the core value proposition is:
> "Film your venue. Describe your vision. Publish your experience."

**The unique differentiator is MOTION - not still 3D images.**

### Must-Have for MVP (Priority 1)
1. ✅ Video upload and 3D processing
2. ✅ Splat rendering in editor
3. ✅ First-person controls (WASD, mouse look)
4. ❓ **Motion playback** - play button, timeline scrubbing
5. ✅ Object placement and interactions
6. ✅ Publishing and shareable URLs
7. ✅ Payment integration

### Important but Can Ship Without (Priority 2)
1. Social features (sharing, ratings)
2. Leaderboards
3. Advanced analytics
4. Multiple quality levels

### Future (Priority 3)
1. Multiplayer
2. AR/VR support
3. LiDAR capture
4. AI-generated objects

---

## Sprint 21 Priorities

### Week 1: Motion & Quality

#### P0 - Motion Playback (Must Fix)
- [ ] Investigate motion data format in .ply files
- [ ] Implement timeline scrubbing
- [ ] Wire up play/pause button
- [ ] Test with actual motion captures
- [ ] Compare quality with desktop app

**Why first:** Motion is the product's core differentiator. Without it, we're just another 3D viewer.

#### P1 - Quality Parity with Desktop
- [ ] Compare web vs desktop render quality
- [ ] Identify settings differences
- [ ] Implement quality presets (Performance/Quality)

**Why second:** Users notice quality. If web looks worse than desktop, adoption suffers.

### Week 2: Stability & Polish

#### P1 - End-to-End Testing
- [ ] Full creator flow: Upload → Process → Edit → Test → Publish
- [ ] Full player flow: Discover → Purchase → Play → Complete
- [ ] Document any broken flows
- [ ] Fix critical blockers

#### P2 - Known Bugs
- [ ] Fix "Saved Never" checkbox UI issue
- [ ] Review console errors on all pages
- [ ] Fix any TypeScript errors in build

### Week 3: Social & Growth

#### P2 - Social Features (if time permits)
- [ ] Share experience to social media
- [ ] Copy shareable link
- [ ] Basic ratings (thumbs up/down)
- [ ] Simple leaderboard per experience

---

## Technical Debt Backlog

Found during exploration - not blocking MVP but should address:

| File | Issue | Priority |
|------|-------|----------|
| `packages/splat/src/hooks/useSplatLoader.ts:35` | TODO: Implement actual PLY parsing | Low (using library) |
| `packages/splat/src/SplatViewer.tsx:88` | TODO: Implement PLY loading | Low (using SceneViewer) |
| `packages/queue/src/worker.ts:334,367` | TODO: Update database with output/error | Medium |
| `api/processing/callback/route.ts:97,120` | TODO: Send notifications | Low |

---

## Testing Protocol

Before marking any feature "Complete":

### Functional Test
1. Does the feature work in development?
2. Does it work after React Fast Refresh?
3. Does it work in production build?
4. Does it work on mobile?

### Quality Test
1. Any console errors?
2. Any TypeScript errors?
3. Performance acceptable?
4. Matches design specs?

### User Test
1. Can a non-technical user complete the flow?
2. Is the UX intuitive?
3. Are error states handled?

---

## Definition of Done: MVP

MVP is ready when a creator can:

1. ✅ Sign up and authenticate
2. ✅ Create a project brief via AI chat
3. ✅ Upload video and wait for 3D processing
4. ✅ View their 3D scene in the editor
5. ✅ Navigate the scene with first-person controls
6. ❓ **Play back captured motion**
7. ✅ Place objects from the library
8. ✅ Configure interactions and game logic
9. ✅ Test the experience end-to-end
10. ✅ Publish and get a shareable URL

And a player can:

1. ✅ Discover experiences to play
2. ✅ Purchase paid experiences
3. ✅ Play with full interactivity
4. ✅ Track their progress and score
5. ❓ **Experience the motion capture**
6. ✅ Complete and see results

---

## Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| First load time | < 5s | User retention |
| Time to first scene view | < 10s | Activation |
| Motion playback frame rate | 30 fps | Core experience |
| Creator completion rate | > 50% | Funnel health |
| Player completion rate | > 30% | Content quality |

---

## Daily Rhythm

- **Morning:** Review what's working, what's broken
- **Midday:** Build/fix priority items
- **Evening:** Test in production preview, update docs

---

## Open Questions

1. **Motion format:** How is motion stored in PLY files from OpenSplat? Do we need the desktop app's motion data?
2. **Quality delta:** Why does web render look worse than desktop? Is it settings or fundamental?
3. **Browser support:** What's our minimum browser requirement? WebGL 2 only?

---

## Next Actions

1. [ ] Create GitHub issues for P0/P1 items
2. [ ] Test motion playback in current build
3. [ ] Compare web vs desktop quality side-by-side
4. [ ] Update HANDOFF.md with honest status
