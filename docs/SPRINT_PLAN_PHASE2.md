# Phase 2: BUILD - Sprint Completion Plan

**Status:** 78% Complete
**Remaining Sprints:** 2-3 sprints to completion
**Start Date:** January 2026

---

## Executive Summary

Phase 2 has solid foundations but one **critical blocker**: placed objects render as blue placeholder boxes during playtest instead of actual 3D models. This breaks the entire player experience and must be fixed before any other work.

---

## Sprint 15: Critical Path (Object Rendering & Interactions)

**Goal:** Players can see and interact with placed 3D objects

### 15.1 Fix Playtest Object Rendering [CRITICAL]
**Priority:** P0
**Files:**
- `apps/studio/src/components/playtest/PlaytestMode.tsx` (lines 258-304)
- `apps/studio/src/components/editor/SceneEditor.tsx` (GLTFModel reference)

**Current Issue:** `PlacedObjectsRenderer` renders `boxGeometry` regardless of `modelUrl`

**Solution:**
```typescript
// Replace box placeholder with actual GLTF loading
// Use existing GLTFObject component pattern from SceneEditor
// Ensure models load with proper transforms (position/rotation/scale)
```

**Tasks:**
- [ ] Create `GLTFPlaytestObject` component with model loading
- [ ] Replace box geometry with GLTF loader in PlacedObjectsRenderer
- [ ] Add loading state (placeholder while model loads)
- [ ] Handle missing models gracefully (show error mesh)
- [ ] Test with various object formats (.glb, .gltf)

### 15.2 Implement Click Interactions
**Priority:** P0
**Files:**
- `apps/studio/src/components/playtest/InteractionRuntime.tsx`
- `apps/studio/src/components/playtest/PlaytestMode.tsx`

**Current Issue:** Click trigger type exists in UI but no raycasting in playtest

**Tasks:**
- [ ] Add raycaster to PlaytestMode
- [ ] Implement `onClick` detection for placed objects
- [ ] Connect click events to InteractionRuntime
- [ ] Add click trigger processing to runtime
- [ ] Visual cursor change when hovering over clickable objects

### 15.3 Interactive Object Hover Feedback
**Priority:** P1
**Files:**
- `apps/studio/src/components/playtest/PlaytestMode.tsx`

**Tasks:**
- [ ] Highlight objects on hover (outline or glow effect)
- [ ] Show interaction hint (e.g., "Press E to collect")
- [ ] Different highlights for different trigger types
- [ ] Cursor state management (pointer, grab, etc.)

### 15.4 Audio Integration
**Priority:** P1
**Files:**
- `apps/studio/src/components/playtest/InteractionRuntime.tsx`
- `apps/studio/src/lib/audio-manager.ts` (new file)

**Tasks:**
- [ ] Create AudioManager singleton for playtest
- [ ] Implement `play_sound` action handler
- [ ] Preload audio files at playtest start
- [ ] Support positional audio (3D sound)
- [ ] Volume controls in debug toolbar

**Sprint 15 Exit Criteria:**
- [ ] Creators can place objects and see them in playtest
- [ ] Click interactions work
- [ ] Players can see which objects are interactive
- [ ] Sound plays when triggered

---

## Sprint 16: Creator Experience Polish

**Goal:** Smooth creator workflow from object library to placed objects

### 16.1 Drag-and-Drop Object Placement
**Priority:** P1
**Files:**
- `apps/studio/src/app/project/[briefId]/scene/[sceneId]/page.tsx`
- `apps/studio/src/components/editor/SceneEditor.tsx`

**Current:** Select object → Click "Place" button
**Target:** Drag object from library → Drop on 3D canvas

**Tasks:**
- [ ] Add drop zone to SceneEditor canvas
- [ ] Calculate drop position using raycaster on Gaussian splat surface
- [ ] Create PlacedObject at drop location
- [ ] Show ghost preview while dragging
- [ ] Snap to grid option during drop

### 16.2 Complete Look Trigger
**Priority:** P2
**Files:**
- `apps/studio/src/components/playtest/InteractionRuntime.tsx`
- `apps/studio/src/components/editor/TriggerZoneVisualization.tsx`

**Tasks:**
- [ ] Track player camera direction in playtest
- [ ] Calculate angle to trigger zone
- [ ] Implement look duration tracking
- [ ] Trigger when angle + duration met
- [ ] Visual indicator when "looking at" triggers

### 16.3 In-Scene Object Editing
**Priority:** P2
**Files:**
- `apps/studio/src/components/editor/SceneEditor.tsx`
- `apps/studio/src/components/objects/ObjectPreview.tsx`

**Current:** Objects render as boxes in editor too
**Target:** Show actual 3D models in editor

**Tasks:**
- [ ] Load GLTF models in editor view (not just preview modal)
- [ ] Ensure transform controls work with GLTF meshes
- [ ] Maintain performance with many objects (LOD or instancing)

### 16.4 Undo/Redo UI
**Priority:** P3
**Files:**
- `apps/studio/src/stores/editor-store.ts` (already has logic)
- `apps/studio/src/components/editor/EditorToolbar.tsx`

**Tasks:**
- [ ] Add undo/redo buttons to toolbar
- [ ] Show keyboard shortcut hints (Ctrl+Z, Ctrl+Y)
- [ ] Indicate undo stack depth
- [ ] Handle edge cases (empty stack, etc.)

**Sprint 16 Exit Criteria:**
- [ ] Drag-and-drop placement works
- [ ] Look triggers function correctly
- [ ] Objects display as actual models in editor
- [ ] Undo/redo accessible from UI

---

## Sprint 17: Game Logic & Polish

**Goal:** Complete game loop and prepare for Phase 3

### 17.1 Objective Progress Tracking
**Priority:** P1
**Files:**
- `apps/studio/src/components/playtest/PlayerHUD.tsx`
- `apps/studio/src/stores/playtest-store.ts`

**Tasks:**
- [ ] Real-time objective progress display
- [ ] Visual feedback on objective completion
- [ ] Support for primary/secondary/bonus objectives
- [ ] Progress persistence across playtest resets

### 17.2 Win Condition Evaluation
**Priority:** P1
**Files:**
- `apps/studio/src/components/playtest/InteractionRuntime.tsx`
- `apps/studio/src/stores/playtest-store.ts`

**Tasks:**
- [ ] Continuous win condition checking
- [ ] Support all 5 condition types (collect, score, objectives, time)
- [ ] Victory screen on completion
- [ ] Show rewards earned
- [ ] Option to replay or exit

### 17.3 Portal/Navigation System
**Priority:** P2
**Files:**
- `apps/studio/src/components/playtest/NavigationRuntime.tsx`
- `apps/studio/src/components/editor/PortalEditor.tsx` (new)

**Tasks:**
- [ ] UI for creating portals between scenes
- [ ] Portal visualization in editor
- [ ] Scene transition in playtest
- [ ] Loading screen between scenes
- [ ] Preserve player state across transitions

### 17.4 Testing Checklist Generation
**Priority:** P2
**Files:**
- `apps/studio/src/components/playtest/TestingChecklist.tsx` (new)

Per the product brief, auto-generate testing checklist:
- [ ] All venues/scenes load correctly
- [ ] All collectibles are findable
- [ ] All interactions work
- [ ] Win condition triggers properly
- [ ] Rewards are granted
- [ ] Audio plays correctly
- [ ] No visual glitches

### 17.5 Publish Preparation
**Priority:** P2
**Files:**
- `apps/studio/src/app/api/publish/route.ts`
- `apps/studio/src/components/publish/PublishModal.tsx`

**Tasks:**
- [ ] Validate experience before publish
- [ ] Generate experience metadata (thumbnail, description)
- [ ] Check all required fields complete
- [ ] Subscription check (can creator publish?)
- [ ] Preview experience URL generation

**Sprint 17 Exit Criteria:**
- [ ] Win conditions trigger victory state
- [ ] Objectives tracked and displayed
- [ ] Navigation between scenes works
- [ ] Experience ready for publish flow

---

## Phase 2 Completion Checklist

### P0 - Must Have (Sprint 15)
- [ ] 3D models render in playtest (not boxes)
- [ ] Click interactions work
- [ ] Players see interactive object hints
- [ ] Audio plays on trigger

### P1 - Should Have (Sprint 16-17)
- [ ] Drag-drop object placement
- [ ] Win conditions evaluate correctly
- [ ] Objective progress tracking
- [ ] Scene navigation/portals

### P2 - Nice to Have (Sprint 17+)
- [ ] Look trigger implementation
- [ ] Undo/redo UI buttons
- [ ] Auto-generated test checklist
- [ ] Collision warnings in editor

---

## Technical Debt to Address

| Item | Location | Priority |
|------|----------|----------|
| User notifications for processing status | `/api/processing/callback/route.ts` lines 97, 120 | P3 |
| Error boundary in playtest mode | `PlaytestMode.tsx` | P2 |
| Performance optimization for many objects | `SceneEditor.tsx` | P3 |
| Mobile touch controls for playtest | `FirstPersonControls.tsx` | Phase 3 |

---

## Success Metrics

**Phase 2 Exit Criteria (from Product Brief):**
> Creator can upload video, process to 3D, place objects, configure interactions, define win conditions, and test the complete experience — without writing code.

**Validation Test:**
1. Upload venue video (5 minutes)
2. Process to 3D via Modal (wait for completion)
3. Place 5 collectible objects
4. Configure "collect" interactions for each
5. Set win condition: "Collect all 5 items"
6. Set reward: "Show victory message"
7. Enter playtest mode
8. Find and collect all 5 items
9. See victory screen with reward

If this works end-to-end, Phase 2 is complete.

---

## Resource Requirements

| Sprint | Primary Focus | Estimated Effort |
|--------|--------------|------------------|
| Sprint 15 | Critical fixes (rendering, clicks) | High |
| Sprint 16 | Creator experience (drag-drop, editor) | Medium |
| Sprint 17 | Game logic & publish prep | Medium |

---

*Document created: January 16, 2026*
*Based on codebase audit revealing 78% Phase 2 completion*
